# ASCEND — Solo Leveling Fitness System

A full-stack gamified fitness and habit-leveling app. You are a "Player"
who levels up their real body by completing workouts — treated in-app as
**Quests** and **Dungeons**, exactly like the System in Solo Leveling.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React + Vite, TailwindCSS, Framer Motion, Plotly |
| Backend  | FastAPI (Python) |
| DB       | SQLite (dev) — one-line swap to Postgres via `DATABASE_URL` |
| Auth     | JWT (email/password) |

## Features

- **RPG stat sheet** — STR / VIT / AGI / PER / INT / SEN, each driven by real
  training data, visualized as the signature holographic **hexagon chart**.
- **Rank & level system** — XP curve `100 * level^1.5`, hidden ranks E → D →
  C → B → A → S, plus a **National Level** easter-egg tier. Rank-ups trigger a
  full-screen animated sequence.
- **Daily Quest** — mandatory, resets at midnight; missing it triggers the
  **Penalty Zone** (UI pressure, no real punishment).
- **Dungeons** — workout sessions with set/rep/weight logging, a **rest
  timer**, a **boss exercise** with a draining health bar, and a clear-screen
  with loot (XP, stat points, PRs, titles).
- **Titles & inventory** — milestones auto-unlock titles and cosmetic badges.
- **Progress** — stat growth + weekly volume (Plotly), streak heatmap, PR
  tracker with a celebratory animation.
- **Nutrition** — lightweight macro/calorie logging feeding INT, sleep feeds SEN.

## Run it

### Backend (port 8000)

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
# .venv/bin/pip install -r requirements.txt               # macOS/Linux
.venv/Scripts/python -m uvicorn app.main:app --port 8000  # Windows
# .venv/bin/uvicorn app.main:app --port 8000              # macOS/Linux
```

Postgres swap (optional): set `DATABASE_URL` before starting, e.g.
`postgresql+psycopg://user:pass@host:5432/ascend` (install `psycopg[binary]`).

### Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the Vite dev server proxies `/api` to `:8000`.

## Tests

```bash
cd backend && .venv/Scripts/python -m pytest tests -q
```

## API surface

```
POST /auth/register            POST /auth/login
GET  /player/stats             GET  /player/rank
GET  /player/inventory         GET  /player/prs
GET  /quests/daily             POST /quests/{id}/log    POST /quests/{id}/complete
GET  /quests                   POST /quests
POST /dungeons                 GET  /dungeons/{id}
POST /dungeons/{id}/log-set    POST /dungeons/{id}/complete
GET  /progress/stats-history   GET  /progress/volume    GET  /progress/streak
POST /nutrition/log            GET  /nutrition/today
```

All routes except `/auth/*` and `/health` require `Authorization: Bearer <token>`.
