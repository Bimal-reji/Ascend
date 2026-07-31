"""ASCEND FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .database import Base, engine
from .routers import auth, dungeons, nutrition, player, progress, quests

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ASCEND — Solo Leveling Fitness System",
    description="The System has chosen you. Level your real body by completing quests and dungeons.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(player.router)
app.include_router(quests.router)
app.include_router(dungeons.router)
app.include_router(progress.router)
app.include_router(nutrition.router)


@app.get("/health")
def health():
    return {"status": "The System is online", "system": "ASCEND"}
