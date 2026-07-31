"""Player stats, rank, and inventory routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import engine
from ..database import get_db
from ..deps import get_current_user
from ..models import PR, Title, User
from ..schemas import PlayerStatsOut, PROut, RankOut, TitleOut

router = APIRouter(prefix="/player", tags=["player"])


def _stats_out(st) -> PlayerStatsOut:
    return PlayerStatsOut(
        level=st.level,
        xp=st.xp,
        xp_to_next=engine.xp_to_next(st.level),
        xp_pct=round(st.xp / engine.xp_to_next(st.level) * 100, 1),
        str=st.str,
        vit=st.vit,
        agi=st.agi,
        per=st.per,
        int=st.int,
        sen=st.sen,
        rank=st.rank,
        next_rank=engine.next_rank(st.rank),
        rank_progress=round(engine.rank_progress(st.level, st.rank), 3),
        total_volume=st.total_volume,
        dungeons_cleared=st.dungeons_cleared,
        quests_completed=st.quests_completed,
        prs=st.prs,
    )


@router.get("/stats", response_model=PlayerStatsOut)
def get_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _stats_out(user.player_stats)


@router.get("/rank", response_model=RankOut)
def get_rank(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    st = user.player_stats
    return RankOut(
        level=st.level,
        xp=st.xp,
        xp_to_next=engine.xp_to_next(st.level),
        rank=st.rank,
        next_rank=engine.next_rank(st.rank),
        rank_progress=round(engine.rank_progress(st.level, st.rank), 3),
    )


@router.get("/inventory", response_model=list[TitleOut])
def get_inventory(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Title).filter(Title.user_id == user.id).order_by(Title.unlocked_at).all()


@router.get("/prs", response_model=list[PROut])
def get_prs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(PR).filter(PR.user_id == user.id).order_by(PR.weight.desc()).all()
