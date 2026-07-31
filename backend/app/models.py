"""SQLAlchemy models for ASCEND.

Mirrors the minimum-viable data model from the spec, plus a few supporting
tables (stat history snapshots, PRs) needed for charts and the PR tracker.
"""
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    player_stats = relationship(
        "PlayerStats", uselist=False, back_populates="user", cascade="all, delete-orphan"
    )


class PlayerStats(Base):
    __tablename__ = "player_stats"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)

    # The six RPG stats
    str = Column(Float, default=1.0)
    vit = Column(Float, default=1.0)
    agi = Column(Float, default=1.0)
    per = Column(Float, default=1.0)
    int = Column(Float, default=1.0)
    sen = Column(Float, default=1.0)

    rank = Column(String, default="E")

    # Lifetime counters for unlocks / charts
    total_volume = Column(Float, default=0.0)
    dungeons_cleared = Column(Integer, default=0)
    quests_completed = Column(Integer, default=0)
    nutrition_logs = Column(Integer, default=0)
    study_quests = Column(Integer, default=0)
    prs = Column(Integer, default=0)

    user = relationship("User", back_populates="player_stats")


class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String, default="custom")  # daily | custom
    title = Column(String, nullable=False)
    description = Column(String, default="")
    targets = Column(JSON, default=dict)      # {"pushups": 20, ...} or {"reps": 50}
    progress = Column(JSON, default=dict)     # {"pushups": 12, ...}
    status = Column(String, default="active") # active | completed | failed
    reward_xp = Column(Integer, default=0)
    reset_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class Dungeon(Base):
    __tablename__ = "dungeons"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    rank = Column(String, default="E")        # E | D | C | B | A | S
    type = Column(String, default="mixed")    # strength | cardio | hiit | mobility | mixed
    status = Column(String, default="active") # active | completed | abandoned
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    exercises = relationship(
        "Exercise", back_populates="dungeon", cascade="all, delete-orphan", order_by="Exercise.id"
    )
    workout_logs = relationship("WorkoutLog", back_populates="dungeon")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    dungeon_id = Column(Integer, ForeignKey("dungeons.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    sets = Column(Integer, default=3)
    reps = Column(Integer, default=10)
    weight = Column(Float, default=0.0)
    is_boss = Column(Boolean, default=False)

    sets_completed = Column(Integer, default=0)
    volume = Column(Float, default=0.0)

    dungeon = relationship("Dungeon", back_populates="exercises")


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    dungeon_id = Column(Integer, ForeignKey("dungeons.id"), nullable=False)
    date = Column(Date, default=date.today, index=True)
    total_volume = Column(Float, default=0.0)
    duration_minutes = Column(Integer, default=0)
    session_type = Column(String, default="mixed")

    dungeon = relationship("Dungeon", back_populates="workout_logs")


class StatHistory(Base):
    __tablename__ = "stat_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, default=date.today, index=True)
    level = Column(Integer, default=1)
    str = Column(Float, default=1.0)
    vit = Column(Float, default=1.0)
    agi = Column(Float, default=1.0)
    per = Column(Float, default=1.0)
    int = Column(Float, default=1.0)
    sen = Column(Float, default=1.0)


class Title(Base):
    __tablename__ = "titles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    kind = Column(String, default="title")  # title | badge
    unlocked_at = Column(DateTime, default=datetime.utcnow)


class PR(Base):
    __tablename__ = "prs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    exercise_name = Column(String, nullable=False)
    weight = Column(Float, default=0.0)
    reps = Column(Integer, default=1)
    achieved_at = Column(DateTime, default=datetime.utcnow)


class NutritionLog(Base):
    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, default=date.today, index=True)
    calories = Column(Float, default=0.0)
    protein = Column(Float, default=0.0)
    carbs = Column(Float, default=0.0)
    fat = Column(Float, default=0.0)
    sleep_hours = Column(Float, nullable=True)
