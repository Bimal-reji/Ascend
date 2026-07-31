"""ASCEND configuration.

DATABASE_URL is the single point of swap between SQLite (dev) and Postgres.
  sqlite:  sqlite:///./ascend.db
  postgres: postgresql+psycopg://user:pass@host:5432/ascend
"""
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./ascend.db",
)

SECRET_KEY = os.getenv("ASCEND_SECRET_KEY", "dev-secret-key-change-me-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ASCEND_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
