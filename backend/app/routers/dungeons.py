"""Dungeon routes: create, list, live session (set logging, boss HP), complete."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import engine
from ..database import get_db
from ..deps import get_current_user
from ..models import Dungeon, Exercise, User
from ..schemas import (
    CompleteDungeonIn,
    DungeonCreateIn,
    DungeonOut,
    DungeonRewardOut,
    DungeonSessionOut,
    LogSetIn,
)
from ..services import clear_dungeon

router = APIRouter(prefix="/dungeons", tags=["dungeons"])


@router.post("", response_model=DungeonSessionOut, status_code=201)
def create_dungeon(
    payload: DungeonCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.rank not in engine.RANK_ORDER and payload.rank != "National Level":
        raise HTTPException(status_code=400, detail="Invalid dungeon rank")
    if payload.rank == "E":
        # auto-scale a fresh dungeon to the player's level
        payload.rank = engine.suggest_dungeon_rank(user.player_stats.level)

    dungeon = Dungeon(
        user_id=user.id,
        title=payload.title,
        rank=payload.rank,
        type=payload.type or engine.classify_type([e.name for e in payload.exercises]),
        status="active",
    )
    db.add(dungeon)
    db.flush()

    boss_id = None
    for ex in payload.exercises:
        exercise = Exercise(
            dungeon_id=dungeon.id,
            name=ex.name,
            sets=ex.sets,
            reps=ex.reps,
            weight=ex.weight,
            is_boss=ex.is_boss,
        )
        db.add(exercise)
        if ex.is_boss:
            boss_id = exercise.id
    dungeon.boss_exercise_id = boss_id
    db.commit()
    db.refresh(dungeon)
    return _session_out(dungeon)


@router.get("", response_model=list[DungeonOut])
def list_dungeons(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Dungeon)
        .filter(Dungeon.user_id == user.id)
        .order_by(Dungeon.status, Dungeon.started_at.desc())
        .limit(50)
        .all()
    )


@router.get("/{dungeon_id}", response_model=DungeonSessionOut)
def get_dungeon(dungeon_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dungeon = db.get(Dungeon, dungeon_id)
    if not dungeon or dungeon.user_id != user.id:
        raise HTTPException(status_code=404, detail="Dungeon not found")
    return _session_out(dungeon)


@router.post("/{dungeon_id}/log-set", response_model=DungeonSessionOut)
def log_set(
    dungeon_id: int,
    payload: LogSetIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dungeon = db.get(Dungeon, dungeon_id)
    if not dungeon or dungeon.user_id != user.id:
        raise HTTPException(status_code=404, detail="Dungeon not found")
    if dungeon.status != "active":
        raise HTTPException(status_code=400, detail="Dungeon is not active")

    exercise = db.get(Exercise, payload.exercise_id)
    if not exercise or exercise.dungeon_id != dungeon.id:
        raise HTTPException(status_code=404, detail="Exercise not found")

    reps = payload.reps if payload.reps is not None else exercise.reps
    weight = payload.weight if payload.weight is not None else exercise.weight

    if exercise.sets_completed < exercise.sets:
        exercise.sets_completed += 1
        exercise.volume = round(engine.total_volume(exercise.sets_completed, reps, weight), 2)

    db.commit()
    db.refresh(dungeon)
    return _session_out(dungeon)


@router.post("/{dungeon_id}/complete", response_model=DungeonRewardOut)
def complete_dungeon(
    dungeon_id: int,
    payload: CompleteDungeonIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dungeon = db.get(Dungeon, dungeon_id)
    if not dungeon or dungeon.user_id != user.id:
        raise HTTPException(status_code=404, detail="Dungeon not found")
    if dungeon.status != "active":
        raise HTTPException(status_code=400, detail="Dungeon already completed")
    return clear_dungeon(db, user, dungeon, payload.duration_minutes)


def _session_out(dungeon: Dungeon) -> DungeonSessionOut:
    total = round(sum(e.volume for e in dungeon.exercises), 2)
    boss = next((e for e in dungeon.exercises if e.is_boss), None)
    if boss and boss.sets > 0:
        boss_hp = round(max(0.0, 1.0 - boss.sets_completed / boss.sets) * 100, 1)
    else:
        # no boss → overall progress acts as boss HP
        all_sets = sum(e.sets for e in dungeon.exercises) or 1
        done = sum(e.sets_completed for e in dungeon.exercises)
        boss_hp = round(max(0.0, 1.0 - done / all_sets) * 100, 1)
    return DungeonSessionOut(dungeon=DungeonOut.model_validate(dungeon), boss_hp_pct=boss_hp, total_volume=total)
