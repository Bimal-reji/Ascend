"""ASCEND FastAPI application entrypoint."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

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

# API routers are mounted twice:
#   - at the root (dev proxy + backend tests call /auth/register, /player/stats, ...)
#   - under /api (production single-origin where the built frontend calls /api/...)
ROUTERS = [
    auth.router,
    player.router,
    quests.router,
    dungeons.router,
    progress.router,
    nutrition.router,
]
for router in ROUTERS:
    app.include_router(router)
    app.include_router(router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "The System is online", "system": "ASCEND"}


# ── Static frontend (production single-service) ──────────────────
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.is_dir():
    assets = FRONTEND_DIST / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        """Serve the built SPA; client-side routes fall back to index.html."""
        if full_path == "api" or full_path.startswith("api/"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        # Resolve + containment check so `..` traversal can't escape the dist dir.
        target = (FRONTEND_DIST / full_path).resolve()
        if full_path and target.is_file() and FRONTEND_DIST.resolve() in target.parents:
            return FileResponse(target)
        return FileResponse(FRONTEND_DIST / "index.html")
