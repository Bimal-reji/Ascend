"""Pydantic schemas for request/response validation."""
from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---- auth ----

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str


class TokenOut(BaseModel):
    token: str
    user: UserOut


# ---- player ----

class PlayerStatsOut(BaseModel):
    level: int
    xp: int
    xp_to_next: int
    xp_pct: float
    str: float
    vit: float
    agi: float
    per: float
    int: float
    sen: float
    rank: str
    next_rank: Optional[str]
    rank_progress: float
    total_volume: float
    dungeons_cleared: int
    quests_completed: int
    prs: int


class RankOut(BaseModel):
    level: int
    xp: int
    xp_to_next: int
    rank: str
    next_rank: Optional[str]
    rank_progress: float


# ---- quests ----

class QuestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    title: str
    description: str
    targets: dict[str, Any] = {}
    progress: dict[str, Any] = {}
    status: str
    reward_xp: int
    reset_at: Optional[datetime]
    completed_at: Optional[datetime]


class DailyQuestOut(BaseModel):
    quest: QuestOut
    penalty_active: bool
    complete: bool


class QuestLogIn(BaseModel):
    subtask: str
    amount: float = Field(gt=0)


class QuestLogOut(BaseModel):
    """Response for logging progress — includes the reward payload when the
    log completes a daily quest, so the UI can animate the reward card."""
    quest: QuestOut
    reward: Optional[dict] = None


class QuestCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = ""
    targets: dict[str, Any] = Field(default_factory=dict)
    reward_xp: int = 50


class QuestRewardOut(BaseModel):
    xp_gained: int
    stat_points: dict[str, float]
    levels_up: int
    new_level: int
    rank_changed: bool
    old_rank: str
    new_rank: str
    unlocked: list[dict]


# ---- dungeons ----

class ExerciseIn(BaseModel):
    name: str
    sets: int = Field(ge=1, default=3)
    reps: int = Field(ge=1, default=10)
    weight: float = Field(ge=0, default=0.0)
    is_boss: bool = False


class DungeonCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    rank: str = "E"
    type: Optional[str] = None  # strength | cardio | hiit | mobility | mixed
    exercises: list[ExerciseIn] = Field(min_length=1)


class ExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    sets: int
    reps: int
    weight: float
    is_boss: bool
    sets_completed: int
    volume: float


class DungeonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    rank: str
    type: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    exercises: list[ExerciseOut] = []


class DungeonSessionOut(BaseModel):
    dungeon: DungeonOut
    boss_hp_pct: float
    total_volume: float


class LogSetIn(BaseModel):
    exercise_id: int
    weight: Optional[float] = None
    reps: Optional[int] = None


class CompleteDungeonIn(BaseModel):
    duration_minutes: int = Field(ge=0, default=0)


class DungeonRewardOut(BaseModel):
    dungeon_id: int
    status: str
    xp_gained: int
    stat_points: dict[str, float]
    levels_up: int
    new_level: int
    rank_changed: bool
    old_rank: str
    new_rank: str
    new_prs: list[dict]
    loot: list[dict]
    unlocked: list[dict]


# ---- progress ----

class StatPoint(BaseModel):
    date: date
    level: int
    str: float
    vit: float
    agi: float
    per: float
    int: float
    sen: float


class VolumePoint(BaseModel):
    week: str
    date: date
    muscle: str
    volume: float


class StreakDay(BaseModel):
    date: date
    active: bool
    intensity: int  # 0-3 rough activity level


class StreakOut(BaseModel):
    current: int
    best: int
    days: list[StreakDay]


class PROut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    exercise_name: str
    weight: float
    reps: int
    achieved_at: datetime


# ---- nutrition ----

class NutritionLogIn(BaseModel):
    date: Optional[date] = None
    calories: float = Field(ge=0, default=0)
    protein: float = Field(ge=0, default=0)
    carbs: float = Field(ge=0, default=0)
    fat: float = Field(ge=0, default=0)
    sleep_hours: Optional[float] = Field(ge=0, le=24, default=None)


class NutritionOut(BaseModel):
    date: date
    calories: float
    protein: float
    carbs: float
    fat: float
    sleep_hours: Optional[float]
    targets: dict[str, float]


# ---- inventory ----

class TitleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
    kind: str
    unlocked_at: datetime
