"""ASCEND System engine — pure, deterministic progression math.

Everything in this module is a pure function over plain values so it can be
unit tested in isolation, mirroring the RPG feel: XP curves, rank tiers,
stat-point conversion from real training data, streak math, and unlock
titles/badges.
"""

from __future__ import annotations

import math
from datetime import date, datetime, timedelta
from typing import Iterable, Optional


# ---------------------------------------------------------------------------
# XP curve
# ---------------------------------------------------------------------------

def xp_to_next(level: int) -> int:
    """XP required to go from `level` to `level + 1`: 100 * level^1.5."""
    return round(100 * (level ** 1.5))


def apply_xp(level: int, xp: int, gained: int):
    """Add `gained` XP. Returns (new_level, leftover_xp, levels_gained)."""
    xp += int(gained)
    levels = 0
    while xp >= xp_to_next(level):
        xp -= xp_to_next(level)
        level += 1
        levels += 1
    return level, xp, levels


# ---------------------------------------------------------------------------
# Rank tiers
# ---------------------------------------------------------------------------

RANK_ORDER = ["E", "D", "C", "B", "A", "S", "National Level"]
# (min_level, max_level) inclusive for each rank
RANK_LEVELS = {
    "E": (1, 9),
    "D": (10, 24),
    "C": (25, 44),
    "B": (45, 69),
    "A": (70, 99),
    "S": (100, 149),
}
NATIONAL_LEVEL_MIN = 150


def rank_for_level(level: int) -> str:
    """Hidden rank tier derived from level, mirroring the anime. 'National
    Level' is the easter-egg tier past S."""
    if level >= NATIONAL_LEVEL_MIN:
        return "National Level"
    for rank, (lo, hi) in RANK_LEVELS.items():
        if lo <= level <= hi:
            return rank
    return "E"


def next_rank(rank: str) -> Optional[str]:
    idx = RANK_ORDER.index(rank) if rank in RANK_ORDER else 0
    return RANK_ORDER[idx + 1] if idx + 1 < len(RANK_ORDER) else None


def rank_progress(level: int, rank: str) -> float:
    """0.0 -> 1.0 progress through the current rank band."""
    if rank == "National Level":
        return 1.0
    lo, hi = RANK_LEVELS.get(rank, (1, 9))
    span = hi - lo
    return max(0.0, min(1.0, (level - lo) / span))


def suggest_dungeon_rank(level: int) -> str:
    """Auto-scale dungeon rank to the player's level (the 'auto-scaled to
    player level' spec point)."""
    if level >= NATIONAL_LEVEL_MIN:
        return "S"
    for rank, (lo, hi) in RANK_LEVELS.items():
        if lo <= level <= hi:
            return rank
    return "E"


# ---------------------------------------------------------------------------
# Session classification (used to decide stat-point payouts)
# ---------------------------------------------------------------------------

SESSION_TYPES = {
    "strength": [
        "bench", "squat", "deadlift", "press", "row", "curl", "pull",
        "push", "lift", "weight", "tricep", "bicep", "lat", "shoulder", "chest",
    ],
    "hiit": ["hiit", "sprint", "tabata", "interval", "burpee", "agility", "metcon", "circuit"],
    "cardio": ["run", "jog", "treadmill", "bike", "cycle", "rowing", "stair", "cardio", "swim", "walk"],
    "mobility": ["mobility", "stretch", "yoga", "mobil", "warm-up", "warmup", "flow", "flex"],
}

# Keyword -> muscle group for weekly volume-per-muscle charts
MUSCLE_GROUPS = {
    "Chest": ["bench", "chest", "push", "fly", "incline"],
    "Back": ["row", "pull", "lat", "deadlift", "back"],
    "Legs": ["squat", "leg", "lunge", "deadlift", "calf", "glute", "hamstring", "quad"],
    "Shoulders": ["shoulder", "press", "ohp", "lateral", "raise", "rear delt"],
    "Arms": ["curl", "tricep", "bicep", "skull", "extension", "hammer"],
    "Core": ["crunch", "plank", "situp", "ab", "hollow", "leg raise", "russian"],
    "Cardio": ["run", "jog", "treadmill", "bike", "row", "rope", "stair", "swim"],
}


def classify_type(exercise_names: Iterable[str]) -> str:
    """Classify a dungeon as strength/hiit/cardio/mobility/mixed by keyword."""
    text = " ".join(str(n).lower() for n in exercise_names)
    for t in ("hiit", "cardio", "mobility"):
        if any(k in text for k in SESSION_TYPES[t]):
            return t
    if any(k in text for k in SESSION_TYPES["strength"]):
        return "strength"
    return "mixed"


def muscle_group(name: str) -> str:
    text = str(name).lower()
    for group, kws in MUSCLE_GROUPS.items():
        if any(k in text for k in kws):
            return group
    return "Other"


def total_volume(sets: int, reps: int, weight: float) -> float:
    """Weight-lifted volume for one exercise: sets * reps * weight."""
    return float(sets) * float(reps) * float(weight or 0)


# ---------------------------------------------------------------------------
# Stat point conversion — real training data -> RPG stat points
# ---------------------------------------------------------------------------

# Each formula converts one training signal into stat points for a single
# session, soft-capped so grinding one workout can't stat-cap instantly.

def str_points(volume_kg: float) -> float:
    """STR <- weight-lifted volume. 1 pt per 100 kg, cap 5/session."""
    return round(min(volume_kg / 100.0, 5.0), 2)


def vit_points(consistency_factor: float, cardio_minutes: float = 0.0) -> float:
    """VIT <- workout consistency + cardio minutes."""
    return round(min(cardio_minutes / 30.0, 3.0) + min(consistency_factor * 2.0, 2.0), 2)


def agi_points(hiit_minutes: float, mobility_sessions: int = 0) -> float:
    """AGI <- HIIT/sprint/mobility sessions."""
    return round(min(hiit_minutes / 20.0, 3.0) + min(mobility_sessions, 2.0), 2)


def per_points(perfect_logs: float) -> float:
    """PER <- logging consistency & form checklists (daily quest completion)."""
    return round(min(perfect_logs * 0.5, 4.0), 2)


def int_points(nutrition_logs: float, study_quests: float = 0.0) -> float:
    """INT <- nutrition logging + study/recovery quests."""
    return round(min(nutrition_logs * 0.15, 3.0) + min(study_quests * 0.5, 2.0), 2)


def sen_points(sleep_hours: float, streak_days: int) -> float:
    """SEN <- sleep hours + streak length (wellness/recovery composite)."""
    sleep_pt = (sleep_hours - 5.0) * 0.4 if sleep_hours > 5 else 0.0
    return round(min(max(sleep_pt, 0.0), 3.0) + min(streak_days * 0.05, 2.0), 2)


# ---------------------------------------------------------------------------
# Dungeon rewards
# ---------------------------------------------------------------------------

RANK_XP_BONUS = {"E": 50, "D": 90, "C": 150, "B": 240, "A": 380, "S": 600, "National Level": 1000}

TYPE_XP_MULT = {"strength": 1.0, "cardio": 0.85, "hiit": 1.15, "mobility": 0.7, "mixed": 1.0}


def dungeon_xp(volume_kg: float, rank: str, session_type: str, level: int) -> int:
    """XP awarded for clearing a dungeon.

    base = 40 + volume/20, plus a rank bonus, scaled a touch by level so
    higher-level players still get meaningful rewards.
    """
    base = 40 + (volume_kg / 20.0)
    bonus = RANK_XP_BONUS.get(rank, 50)
    mult = TYPE_XP_MULT.get(session_type, 1.0)
    return round((base + bonus) * mult * (1 + level * 0.02))


def daily_quest_xp(level: int) -> int:
    """XP for the mandatory daily quest — scaled with player level."""
    return 30 + round(level * 2.5)


# ---------------------------------------------------------------------------
# Daily quest
# ---------------------------------------------------------------------------

DAILY_QUEST_TARGETS = {
    "pushups": 20,
    "squats": 30,
    "situps": 25,
    "running_km": 1.0,
}


def next_midnight(from_dt: Optional[datetime] = None) -> datetime:
    """Next local midnight — the daily quest resets here."""
    base = from_dt or datetime.now()
    tomorrow = (base + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return tomorrow


def daily_complete(progress: dict, targets: dict) -> bool:
    """True when every daily sub-goal has been hit."""
    for key, target in targets.items():
        if float(progress.get(key, 0) or 0) < float(target):
            return False
    return True


# ---------------------------------------------------------------------------
# Streaks
# ---------------------------------------------------------------------------

def compute_streaks(active_dates: Iterable[date], today: Optional[date] = None) -> tuple[int, int]:
    """Given a set of dates with logged activity, return (current, best) streak.

    Current streak counts back from today; if today has no activity yet, the
    streak is still alive as long as yesterday had activity (it only breaks at
    end of day).
    """
    today = today or date.today()
    days = set(active_dates)

    # current streak
    current = 0
    d = today
    if d in days:
        current = 1
    elif (d - timedelta(days=1)) in days:
        current = 1
        d = d - timedelta(days=1)
    if current == 1:
        d = d - timedelta(days=1)
        while d in days:
            current += 1
            d = d - timedelta(days=1)

    # best streak
    best = 0
    run = 0
    prev = None
    for d in sorted(days):
        run = run + 1 if (prev is None or (d - prev).days == 1) else 1
        best = max(best, run)
        prev = d
    return current, best


# ---------------------------------------------------------------------------
# Titles & badges (unlock rules)
# ---------------------------------------------------------------------------

TITLES = {
    # level milestones
    "Iron Novice": ("level", 10),
    "Steel Veteran": ("level", 25),
    "Adamantite Warrior": ("level", 50),
    "Shadow Monarch": ("level", 100),
    # rank milestones
    "Elite Hunter": ("rank", "C"),
    "High Rank Hunter": ("rank", "B"),
    "Master Hunter": ("rank", "A"),
    "Shadow Monarch's Hand": ("rank", "S"),
}

BADGES = {
    # dungeon milestones
    "First Clear": ("dungeons", 1),
    "Dungeon Veteran": ("dungeons", 10),
    "Dungeon Conqueror": ("dungeons", 25),
    # PR milestones
    "Record Breaker": ("prs", 1),
    "PR Collector": ("prs", 10),
    # streak milestones
    "Rising Hunter": ("streak", 3),
    "Persistent Hunter": ("streak", 7),
    "Shadow Persistence": ("streak", 30),
    "Eternal Shadow": ("streak", 100),
    # quest milestones
    "Quest Taker": ("quests", 1),
    "Quest Machine": ("quests", 25),
    # volume milestones
    "First Steps": ("volume", 1000),
    "Volume Junkie": ("volume", 10000),
    "Lifter of Legends": ("volume", 100000),
}


def missing_unlocks(state: dict, owned: set[str]) -> list[dict]:
    """Return newly-earned title/badge defs given a player state snapshot.

    state keys: level, rank, dungeons, prs, streak, quests, volume
    owned: set of names already unlocked.
    """
    earned = []
    for name, (metric, threshold) in TITLES.items():
        if name in owned:
            continue
        if metric == "level" and state.get("level", 0) >= threshold:
            earned.append({"name": name, "kind": "title"})
        elif metric == "rank" and _rank_ge(state.get("rank", "E"), threshold):
            earned.append({"name": name, "kind": "title"})
    for name, (metric, threshold) in BADGES.items():
        if name in owned:
            continue
        val = {
            "dungeons": state.get("dungeons", 0),
            "prs": state.get("prs", 0),
            "streak": state.get("streak", 0),
            "quests": state.get("quests", 0),
            "volume": state.get("volume", 0),
        }.get(metric, 0)
        if val >= threshold:
            earned.append({"name": name, "kind": "badge"})
    return earned


def _rank_ge(rank: str, threshold: str) -> bool:
    if rank == "National Level":
        return True
    return RANK_ORDER.index(rank) >= RANK_ORDER.index(threshold)
