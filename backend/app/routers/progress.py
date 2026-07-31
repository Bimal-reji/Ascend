"""Progress routes: stat history, weekly volume, streak, heatmap."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import engine
from ..database import get_db
from ..deps import get_current_user
from ..models import StatHistory, User, WorkoutLog
from ..schemas import StatPoint, StreakDay, StreakOut, VolumePoint
from ..services import active_dates

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/stats-history", response_model=list[StatPoint])
def stats_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(StatHistory)
        .filter(StatHistory.user_id == user.id)
        .order_by(StatHistory.date)
        .all()
    )
    return [StatPoint.model_validate(r) for r in rows]


@router.get("/volume", response_model=list[VolumePoint])
def weekly_volume(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Volume per muscle group for the last 8 ISO weeks."""
    cutoff = date.today() - timedelta(weeks=8)
    logs = (
        db.query(WorkoutLog)
        .filter(WorkoutLog.user_id == user.id, WorkoutLog.date >= cutoff)
        .all()
    )
    # Volume is stored per-dungeon, so break it down by muscle using dungeon
    # exercises is not possible at log level — approximate by session type and
    # keyword from stored exercises via dungeon relation.
    points = []
    for log in logs:
        dungeon = log.dungeon
        if not dungeon:
            continue
        volume = log.total_volume or 0
        groups = {}
        for ex in dungeon.exercises:
            ex_vol = engine.total_volume(ex.sets_completed, ex.reps, ex.weight)
            if ex_vol > 0:
                groups[engine.muscle_group(ex.name)] = groups.get(engine.muscle_group(ex.name), 0) + ex_vol
        if not groups:
            groups["Other"] = volume
        # week label = Monday of that week
        week_start = log.date - timedelta(days=log.date.weekday())
        for muscle, vol in groups.items():
            points.append(VolumePoint(week=week_start.isoformat(), date=week_start, muscle=muscle, volume=round(vol, 2)))
    return points


@router.get("/streak", response_model=StreakOut)
def streak(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    dates = active_dates(db, user)
    current, best = engine.compute_streaks(dates, today)

    # 12-week heatmap window ending today
    days = []
    for offset in range(83, -1, -1):
        d = today - timedelta(days=offset)
        active = d in dates
        days.append(StreakDay(date=d, active=active, intensity=1 if active else 0))
    return StreakOut(current=current, best=best, days=days)
