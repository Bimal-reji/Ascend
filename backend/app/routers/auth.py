"""Auth routes: register & login."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import PlayerStats, Quest, User
from ..schemas import LoginIn, RegisterIn, TokenOut
from ..security import create_access_token, hash_password, verify_password
from ..services import get_or_create_daily_quest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="A Hunter with this email already exists")

    user = User(email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.flush()

    db.add(PlayerStats(user_id=user.id, level=1, xp=0, rank="E",
                       str=1.0, vit=1.0, agi=1.0, per=1.0, int=1.0, sen=1.0))
    db.commit()
    db.refresh(user)
    user.player_stats = db.query(PlayerStats).filter(PlayerStats.user_id == user.id).first()

    get_or_create_daily_quest(db, user)

    return TokenOut(token=create_access_token(user.id), user=user)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenOut(token=create_access_token(user.id), user=user)
