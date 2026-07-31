"""Quest routes: daily quest, custom quests, logging and completion."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import engine
from ..database import get_db
from ..deps import get_current_user
from ..models import Quest, User
from ..schemas import (
    DailyQuestOut,
    QuestCreateIn,
    QuestLogIn,
    QuestLogOut,
    QuestOut,
    QuestRewardOut,
)
from ..services import get_or_create_daily_quest, grant_daily_quest, penalty_active, pad_stat_points
router = APIRouter(prefix="/quests", tags=["quests"])


@router.get("/daily", response_model=DailyQuestOut)
def get_daily(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quest = get_or_create_daily_quest(db, user)
    complete = engine.daily_complete(quest.progress, quest.targets)
    return DailyQuestOut(
        quest=QuestOut.model_validate(quest),
        penalty_active=penalty_active(db, user),
        complete=complete,
    )


@router.post("/{quest_id}/log", response_model=QuestLogOut)
def log_progress(
    quest_id: int,
    payload: QuestLogIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quest = db.get(Quest, quest_id)
    if not quest or quest.user_id != user.id:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.status == "completed":
        raise HTTPException(status_code=400, detail="Quest already completed")

    if payload.subtask not in quest.targets:
        raise HTTPException(status_code=400, detail=f"Unknown quest target: {payload.subtask}")

    progress = dict(quest.progress or {})
    progress[payload.subtask] = float(progress.get(payload.subtask, 0)) + payload.amount
    quest.progress = progress

    reward = None
    if engine.daily_complete(progress, quest.targets) and quest.type == "daily":
        # Auto-award the daily quest rewards the moment the last target lands
        # and surface them to the UI so it can animate the reward card.
        # Custom quests stay active until the player explicitly completes them
        # (their XP reward is granted by POST /{id}/complete).
        reward = grant_daily_quest(db, user, quest)

    db.commit()
    db.refresh(quest)
    return QuestLogOut(quest=QuestOut.model_validate(quest), reward=reward)


@router.post("/{quest_id}/complete", response_model=QuestRewardOut)
def complete_quest(
    quest_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quest = db.get(Quest, quest_id)
    if not quest or quest.user_id != user.id:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.status == "completed":
        raise HTTPException(status_code=400, detail="Quest already completed")

    if quest.type == "daily":
        return grant_daily_quest(db, user, quest)

    # Custom quest completion — smaller reward
    from ..services import check_unlocks, rank_up_check, snapshot_stats

    st = user.player_stats
    xp = quest.reward_xp or 50
    new_level, new_xp, levels_up = engine.apply_xp(st.level, st.xp, xp)
    st.level, st.xp = new_level, new_xp
    st.quests_completed += 1
    rank_changed, old_rank, new_rank = rank_up_check(db, user)

    # Discipline: every logged completion earns a little PER
    st.per = round(st.per + 0.2, 2)

    quest.status = "completed"
    quest.completed_at = __import__("datetime").datetime.utcnow()
    snapshot_stats(db, user)
    unlocked = check_unlocks(db, user)
    db.commit()
    return {
        "xp_gained": xp,
        "stat_points": pad_stat_points({"per": 0.2}),
        "levels_up": levels_up,
        "new_level": new_level,
        "rank_changed": rank_changed,
        "old_rank": old_rank,
        "new_rank": new_rank,
        "unlocked": unlocked,
    }


@router.get("", response_model=list[QuestOut])
def list_quests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Quest)
        .filter(Quest.user_id == user.id, Quest.status == "active")
        .order_by(Quest.type.desc(), Quest.created_at.desc())
        .all()
    )


@router.post("", response_model=QuestOut, status_code=201)
def create_quest(payload: QuestCreateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.targets:
        payload.targets = {"reps": 50}
    quest = Quest(
        user_id=user.id,
        type="custom",
        title=payload.title,
        description=payload.description,
        targets=payload.targets,
        progress={k: 0 for k in payload.targets},
        status="active",
        reward_xp=payload.reward_xp,
    )
    db.add(quest)
    db.commit()
    db.refresh(quest)
    return quest
