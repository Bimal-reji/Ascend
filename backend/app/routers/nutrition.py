"""Nutrition routes: log macros + sleep, today's snapshot."""
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import NutritionLog, User
from ..schemas import NutritionLogIn, NutritionOut
from ..services import NUTRITION_TARGETS, log_nutrition

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


@router.post("/log", response_model=NutritionOut, status_code=201)
def nutrition_log(payload: NutritionLogIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = log_nutrition(db, user, payload.model_dump())
    return _out(row)


@router.get("/today", response_model=NutritionOut)
def today(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = (
        db.query(NutritionLog)
        .filter(NutritionLog.user_id == user.id, NutritionLog.date == date.today())
        .first()
    )
    if row is None:
        row = NutritionLog(user_id=user.id, date=date.today(),
                           calories=0, protein=0, carbs=0, fat=0)
    return _out(row)


def _out(row: NutritionLog) -> NutritionOut:
    return NutritionOut(
        date=row.date,
        calories=row.calories,
        protein=row.protein,
        carbs=row.carbs,
        fat=row.fat,
        sleep_hours=row.sleep_hours,
        targets=NUTRITION_TARGETS,
    )
