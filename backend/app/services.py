"""Service layer — orchestrates the engine math against the database.

Keeps routers thin: all reward awarding, daily quest lifecycle, stat
snapshots and unlock checks live here.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import engine
from .models import (
    Dungeon,
    NutritionLog,
    PR,
    PlayerStats,
    Quest,
    StatHistory,
    Title,
    User,
    WorkoutLog,
)


# ---------------------------------------------------------------------------
# Daily quest lifecycle
# ---------------------------------------------------------------------------

def _quest_day(q: Quest) -> date | None:
    """Calendar day a daily quest belongs to. reset_at is the *next* midnight,
    so a quest created today has reset_at tomorrow 00:00 -> belongs to today."""
    if q and q.reset_at:
        return (q.reset_at - timedelta(days=1)).date()
    return None


def get_or_create_daily_quest(db: Session, user: User, today: date | None = None) -> Quest:
    """Return today's daily quest, creating it (and marking stale ones failed)
    if it doesn't exist yet."""
    today = today or date.today()
    q = (
        db.query(Quest)
        .filter(Quest.user_id == user.id, Quest.type == "daily")
        .order_by(Quest.reset_at.desc())
        .first()
    )
    if _quest_day(q) == today:
        return q

    # The previous daily quest is stale → if it was never completed it becomes
    # a failed quest (triggers the Penalty Zone until today is cleared).
    if q and q.status == "active":
        q.status = "failed"

    targets = dict(engine.DAILY_QUEST_TARGETS)
    new_q = Quest(
        user_id=user.id,
        type="daily",
        title="Daily Quest",
        description="The System demands its toll. 20 pushups, 30 squats, 25 situps, run 1 km.",
        targets=targets,
        progress={k: 0 for k in targets},
        status="active",
        reward_xp=engine.daily_quest_xp(user.player_stats.level),
        reset_at=engine.next_midnight(),
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q


def penalty_active(db: Session, user: User, today: date | None = None) -> bool:
    """Penalty Zone: a recent daily quest was failed and today isn't cleared yet.
    Pure UI pressure — clears the moment the player clears today's quest."""
    today = today or date.today()
    q = (
        db.query(Quest)
        .filter(Quest.user_id == user.id, Quest.type == "daily")
        .order_by(Quest.reset_at.desc())
        .first()
    )
    if q and _quest_day(q) == today and q.status == "completed":
        return False
    failed = (
        db.query(Quest)
        .filter(Quest.user_id == user.id, Quest.type == "daily", Quest.status == "failed")
        .first()
    )
    return failed is not None


# ---------------------------------------------------------------------------
# Stat snapshot + unlock checks
# ---------------------------------------------------------------------------

def snapshot_stats(db: Session, user: User) -> None:
    st = user.player_stats
    existing = (
        db.query(StatHistory)
        .filter(StatHistory.user_id == user.id, StatHistory.date == date.today())
        .first()
    )
    vals = dict(
        level=st.level,
        str=st.str,
        vit=st.vit,
        agi=st.agi,
        per=st.per,
        int=st.int,
        sen=st.sen,
    )
    if existing:
        for k, v in vals.items():
            setattr(existing, k, v)
    else:
        db.add(StatHistory(user_id=user.id, date=date.today(), **vals))


def active_dates(db: Session, user: User) -> set[date]:
    """Distinct dates with any logged activity (workouts or daily quests)."""
    workout_dates = {
        r[0] for r in db.query(WorkoutLog.date).filter(WorkoutLog.user_id == user.id).all()
    }
    quest_dates = {
        r[0].date() if isinstance(r[0], datetime) else r[0]
        for r in db.query(Quest.completed_at)
        .filter(Quest.user_id == user.id, Quest.status == "completed")
        .all()
        if r[0] is not None
    }
    return workout_dates | quest_dates


def current_streak(db: Session, user: User) -> int:
    return engine.compute_streaks(active_dates(db, user))[0]


def check_unlocks(db: Session, user: User) -> list[dict]:
    """Award any newly-earned titles/badges. Returns the newly unlocked list."""
    st = user.player_stats
    owned = {t.name for t in db.query(Title.name).filter(Title.user_id == user.id).all()}
    cur, best = engine.compute_streaks(active_dates(db, user))
    state = {
        "level": st.level,
        "rank": st.rank,
        "dungeons": st.dungeons_cleared,
        "prs": st.prs,
        "streak": best,
        "quests": st.quests_completed,
        "volume": st.total_volume,
    }
    earned = engine.missing_unlocks(state, owned)
    for item in earned:
        db.add(Title(user_id=user.id, name=item["name"], kind=item["kind"]))
    if earned:
        db.commit()
    return earned


def rank_up_check(db: Session, user: User) -> tuple[bool, str, str]:
    """Compare old vs new rank after level-ups. Returns (changed, old, new)."""
    st = user.player_stats
    new_rank = engine.rank_for_level(st.level)
    changed = new_rank != st.rank
    old = st.rank
    st.rank = new_rank
    return changed, old, new_rank


# ---------------------------------------------------------------------------
# Reward awarding
# ---------------------------------------------------------------------------

STAT_KEYS = ["str", "vit", "agi", "per", "int", "sen"]


def pad_stat_points(changes: dict[str, float]) -> dict[str, float]:
    """Return all six stat keys, 0-padded, so reward payloads are uniform."""
    return {key: round(changes.get(key, 0.0), 2) for key in STAT_KEYS}


def _apply_stat_changes(st: PlayerStats, changes: dict[str, float]) -> dict[str, float]:
    applied = {}
    for key, amount in changes.items():
        if amount <= 0:
            continue
        current = getattr(st, key)
        setattr(st, key, round(current + amount, 2))
        applied[key] = round(amount, 2)
    return applied


def grant_daily_quest(db: Session, user: User, quest: Quest) -> dict:
    """Force-complete today's daily quest and award rewards."""
    st = user.player_stats
    xp = engine.daily_quest_xp(st.level)
    new_level, new_xp, levels_up = engine.apply_xp(st.level, st.xp, xp)

    changes = _apply_stat_changes(st, {
        "str": engine.str_points(0) + 0.4,          # pushups/squats/situps
        "vit": engine.vit_points(0) + 0.3,          # run km
        "per": engine.per_points(1) + 0.2,          # perfect logging streak
    })

    st.level, st.xp = new_level, new_xp
    st.quests_completed += 1
    rank_changed, old_rank, new_rank = rank_up_check(db, user)

    quest.status = "completed"
    quest.completed_at = datetime.utcnow()
    quest.reward_xp = xp

    snapshot_stats(db, user)
    unlocked = check_unlocks(db, user)
    db.commit()

    return {
        "xp_gained": xp,
        "stat_points": pad_stat_points(changes),
        "levels_up": levels_up,
        "new_level": new_level,
        "rank_changed": rank_changed,
        "old_rank": old_rank,
        "new_rank": new_rank,
        "unlocked": unlocked,
    }


def clear_dungeon(db: Session, user: User, dungeon: Dungeon, duration_minutes: int = 0) -> dict:
    """Compute rewards for clearing a dungeon and commit the full state change."""
    st = user.player_stats

    # --- volume & session type ---
    volume = sum(e.volume for e in dungeon.exercises)
    session_type = dungeon.type or engine.classify_type([e.name for e in dungeon.exercises])
    dungeon.type = session_type

    # --- XP ---
    xp = engine.dungeon_xp(volume, dungeon.rank, session_type, st.level)
    new_level, new_xp, levels_up = engine.apply_xp(st.level, st.xp, xp)

    # --- stat points ---
    cardio_minutes = 0.0
    hiit_minutes = 0.0
    mobility_sessions = 0
    if session_type == "cardio":
        cardio_minutes = float(duration_minutes or 30)
    elif session_type == "hiit":
        hiit_minutes = float(duration_minutes or 20)
    elif session_type == "mobility":
        mobility_sessions = 1

    changes = _apply_stat_changes(st, {
        "str": engine.str_points(volume) if session_type in ("strength", "mixed") else 0,
        "vit": engine.vit_points(1 if volume > 0 else 0, cardio_minutes),
        "agi": engine.agi_points(hiit_minutes, mobility_sessions),
        "per": engine.per_points(1),
    })

    st.level, st.xp = new_level, new_xp
    st.dungeons_cleared += 1
    st.total_volume = round(st.total_volume + volume, 2)
    rank_changed, old_rank, new_rank = rank_up_check(db, user)

    # --- workout log ---
    db.add(WorkoutLog(
        user_id=user.id,
        dungeon_id=dungeon.id,
        date=date.today(),
        total_volume=round(volume, 2),
        duration_minutes=duration_minutes,
        session_type=session_type,
    ))

    # --- PR detection ---
    new_prs = _detect_prs(db, user, dungeon)

    dungeon.status = "completed"
    dungeon.completed_at = datetime.utcnow()

    snapshot_stats(db, user)
    unlocked = check_unlocks(db, user)
    db.commit()

    return {
        "dungeon_id": dungeon.id,
        "status": dungeon.status,
        "xp_gained": xp,
        "stat_points": pad_stat_points(changes),
        "levels_up": levels_up,
        "new_level": new_level,
        "rank_changed": rank_changed,
        "old_rank": old_rank,
        "new_rank": new_rank,
        "new_prs": new_prs,
        "loot": unlocked,
        "unlocked": unlocked,
    }


def _detect_prs(db: Session, user: User, dungeon: Dungeon) -> list[dict]:
    new_prs = []
    for ex in dungeon.exercises:
        if not ex.weight or ex.weight <= 0:
            continue
        existing = (
            db.query(PR)
            .filter(PR.user_id == user.id, PR.exercise_name == ex.name)
            .order_by(PR.weight.desc())
            .first()
        )
        if existing is None or ex.weight > existing.weight:
            db.add(PR(user_id=user.id, exercise_name=ex.name, weight=ex.weight, reps=ex.reps))
            new_prs.append({"exercise": ex.name, "weight": ex.weight, "reps": ex.reps})
    if new_prs:
        user.player_stats.prs += len(new_prs)
    return new_prs


# ---------------------------------------------------------------------------
# Nutrition
# ---------------------------------------------------------------------------

NUTRITION_TARGETS = {"calories": 2500, "protein": 150, "carbs": 300, "fat": 80}


def log_nutrition(db: Session, user: User, data: dict) -> NutritionLog:
    day = data.get("date") or date.today()
    row = (
        db.query(NutritionLog)
        .filter(NutritionLog.user_id == user.id, NutritionLog.date == day)
        .first()
    )
    is_new = row is None
    if is_new:
        row = NutritionLog(user_id=user.id, date=day)
        db.add(row)
    row.calories = data.get("calories", 0)
    row.protein = data.get("protein", 0)
    row.carbs = data.get("carbs", 0)
    row.fat = data.get("fat", 0)
    if data.get("sleep_hours") is not None:
        row.sleep_hours = data["sleep_hours"]

    # INT stat payoff: consistent nutrition logging (once per day — re-logging
    # the same day's macros just updates it, no extra INT farming).
    st = user.player_stats
    changes = {}
    if is_new:
        st.nutrition_logs += 1
        changes = _apply_stat_changes(st, {
            "int": engine.int_points(1),
            "sen": engine.sen_points(row.sleep_hours or 0, current_streak(db, user)),
        })
    snapshot_stats(db, user)
    db.commit()
    db.refresh(row)
    return row
