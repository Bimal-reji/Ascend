"""End-to-end API tests using an isolated SQLite file."""
import os
import sys
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_ascend.db"

# Start from a clean DB so re-runs and CI never collide with stale rows.
TEST_DB = Path(__file__).resolve().parent.parent / "test_ascend.db"
if TEST_DB.exists():
    TEST_DB.unlink()

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)

EMAIL = "hunter@example.com"
PASSWORD = "password123"


def _register(email=EMAIL):
    r = client.post("/auth/register", json={"email": email, "password": PASSWORD})
    assert r.status_code == 201, r.text
    return r.json()["token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_health():
    assert client.get("/health").json()["system"] == "ASCEND"


def test_auth_flow():
    r = client.post("/auth/register", json={"email": EMAIL, "password": PASSWORD})
    assert r.status_code == 201
    token = r.json()["token"]
    assert token

    # duplicate register → 409
    r = client.post("/auth/register", json={"email": EMAIL, "password": PASSWORD})
    assert r.status_code == 409

    # login
    r = client.post("/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert r.status_code == 200
    assert r.json()["token"]

    # bad password
    r = client.post("/auth/login", json={"email": EMAIL, "password": "wrong"})
    assert r.status_code == 401

    # protected endpoint without token
    r = client.get("/player/stats")
    assert r.status_code == 401


def test_daily_quest_lifecycle():
    token = _register("daily@example.com")
    h = _auth(token)

    r = client.get("/quests/daily", headers=h)
    assert r.status_code == 200
    q = r.json()["quest"]
    assert q["type"] == "daily"
    assert not r.json()["complete"]
    assert "pushups" in q["targets"]

    # log progress until complete (last target auto-awards the reward)
    targets = q["targets"]
    for key, val in targets.items():
        r = client.post(f"/quests/{q['id']}/log", json={"subtask": key, "amount": val}, headers=h)
        assert r.status_code == 200, r.text

    r = client.get("/quests/daily", headers=h)
    assert r.json()["complete"] is True
    assert r.json()["quest"]["status"] == "completed"

    # XP was awarded by the auto-complete
    stats = client.get("/player/stats", headers=h).json()
    assert stats["xp"] > 0

    # double-completing is rejected
    r = client.post(f"/quests/{q['id']}/complete", headers=h)
    assert r.status_code == 400


def test_dungeon_flow():
    token = _register("dungeon@example.com")
    h = _auth(token)

    r = client.post("/dungeons", headers=h, json={
        "title": "Bench Cathedral",
        "rank": "E",
        "exercises": [
            {"name": "Bench Press", "sets": 3, "reps": 5, "weight": 60, "is_boss": True},
            {"name": "Rows", "sets": 3, "reps": 10, "weight": 40},
        ],
    })
    assert r.status_code == 201, r.text
    d = r.json()["dungeon"]
    assert d["rank"] == "E"
    boss = next(e for e in d["exercises"] if e["is_boss"])
    assert r.json()["boss_hp_pct"] == 100.0

    # log sets on boss
    for _ in range(3):
        r = client.post(f"/dungeons/{d['id']}/log-set",
                        json={"exercise_id": boss["id"], "weight": 60, "reps": 5}, headers=h)
        assert r.status_code == 200

    assert r.json()["boss_hp_pct"] == 0.0
    assert r.json()["total_volume"] == 3 * 5 * 60

    # complete → rewards
    r = client.post(f"/dungeons/{d['id']}/complete", json={"duration_minutes": 45}, headers=h)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "completed"
    assert body["xp_gained"] > 0
    assert body["stat_points"]["str"] > 0
    assert any(pr["exercise"] == "Bench Press" for pr in body["new_prs"])

    # PR recorded
    r = client.get("/player/prs", headers=h)
    assert any(p["exercise_name"] == "Bench Press" for p in r.json())


def test_progress_and_nutrition():
    token = _register("progress@example.com")
    h = _auth(token)

    r = client.get("/progress/stats-history", headers=h)
    assert r.status_code == 200

    r = client.get("/progress/streak", headers=h)
    assert r.status_code == 200
    assert r.json()["current"] >= 0

    r = client.post("/nutrition/log", headers=h, json={
        "calories": 2200, "protein": 140, "carbs": 260, "fat": 70, "sleep_hours": 8,
    })
    assert r.status_code == 201
    assert r.json()["sleep_hours"] == 8

    r = client.get("/nutrition/today", headers=h)
    assert r.status_code == 200
    assert r.json()["calories"] == 2200


def test_custom_quest():
    token = _register("custom@example.com")
    h = _auth(token)

    r = client.post("/quests", headers=h, json={
        "title": "Study 30 minutes", "targets": {"minutes": 30}, "reward_xp": 60,
    })
    assert r.status_code == 201
    qid = r.json()["id"]

    r = client.post(f"/quests/{qid}/complete", headers=h)
    assert r.status_code == 200
    assert r.json()["xp_gained"] == 60
