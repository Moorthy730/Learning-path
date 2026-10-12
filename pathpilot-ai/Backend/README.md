# PathPilot AI — Backend

AI-powered learning path generator. FastAPI backend integrated with Google Gemini AI and Supabase.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Setup](#setup)
4. [Supabase Setup](#supabase-setup)
5. [Gemini API Setup](#gemini-api-setup)
6. [Running the Backend](#running-the-backend)
7. [Running the Frontend](#running-the-frontend)
8. [API Documentation](#api-documentation)
9. [Running Tests](#running-tests)
10. [Troubleshooting](#troubleshooting)
11. [Deployment](#deployment)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend build |
| Git | any | Version control |
| Supabase account | — | Database + Auth |
| Google AI Studio account | — | Gemini API key |

---

## Project Structure

```
pathpilot-ai/
├── Backend/
│   ├── .env.example          ← Copy to .env and fill credentials
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py           ← FastAPI app, CORS, rate limiting
│   │   ├── config.py         ← Pydantic-settings (env vars)
│   │   ├── auth.py           ← Supabase JWT verification dependency
│   │   ├── database.py       ← Admin + user-scoped Supabase clients
│   │   ├── schemas.py        ← All request/response Pydantic models
│   │   ├── exceptions.py     ← Custom exceptions + error handlers
│   │   ├── ai/
│   │   │   ├── gemini_service.py     ← Gemini API integration
│   │   │   └── roadmap_prompts.py    ← Prompt templates
│   │   ├── services/
│   │   │   ├── roadmap_service.py    ← Generation + CRUD logic
│   │   │   ├── progress_service.py   ← Lesson completion tracking
│   │   │   └── resource_service.py   ← URL validation + curation
│   │   └── routes/
│   │       ├── health.py
│   │       ├── profiles.py
│   │       ├── learning_paths.py
│   │       ├── lessons.py
│   │       └── assessments.py
│   ├── tests/
│   │   ├── conftest.py       ← Shared fixtures (all deps mocked)
│   │   ├── test_health.py
│   │   ├── test_auth.py
│   │   ├── test_learning_paths.py
│   │   └── test_security.py
│   └── supabase/
│       └── migrations/
│           └── 001_initial_schema.sql
└── Frontend/
    ├── .env.example
    └── src/services/
        ├── supabaseClient.ts   ← Browser Supabase client (anon key)
        ├── apiClient.ts        ← Authenticated HTTP client
        └── backendService.ts   ← Typed wrappers for all API endpoints
```

---

## Setup

### 1. Clone and navigate

```bash
git clone <your-repo-url>
cd pathpilot-ai/Backend
```

### 2. Create Python virtual environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials (see sections below):

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_service_role_key
FRONTEND_ORIGIN=http://localhost:5173
APP_ENV=development
MAX_GENERATIONS_PER_HOUR=10
AI_TIMEOUT_SECONDS=60
```

> ⚠️ **Security**: Never commit `.env`. The `SUPABASE_SECRET_KEY` (service-role key) must NEVER be sent to the frontend. It bypasses Row Level Security.

---

## Supabase Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **API keys**

### 2. Get your API keys

In **Project Settings → API**:
- **`SUPABASE_URL`** → Project URL
- **`SUPABASE_PUBLISHABLE_KEY`** → `anon` / `public` key
- **`SUPABASE_SECRET_KEY`** → `service_role` key (backend only!)

### 3. Run the SQL migration

In the **Supabase SQL Editor**, paste and run the entire contents of:

```
Backend/supabase/migrations/001_initial_schema.sql
```

This creates:
- `profiles`, `learning_paths`, `modules`, `lessons`, `assessments` tables
- Row Level Security policies (users can only access their own data)
- Indexes and foreign key constraints
- Updated-at triggers

### 4. Configure frontend

```bash
cp Frontend/.env.example Frontend/.env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
```

> ✅ **Only the anon key** goes in the frontend. Never put the service-role key in `VITE_*` variables.

---

## Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Set `GEMINI_API_KEY` in `Backend/.env`

### Supported models (structured output required)

| Model | Notes |
|-------|-------|
| `gemini-2.0-flash` | **Recommended** — fast, free tier available |
| `gemini-1.5-pro` | Higher quality, higher cost |
| `gemini-1.5-flash` | Good balance |

Set via `GEMINI_MODEL` in `.env`.

---

## Running the Backend

```bash
# From Backend/ directory with .venv activated
uvicorn app.main:app --reload --port 8000
```

The server starts at **http://localhost:8000**

Verify it's running:
```bash
curl http://localhost:8000/health
# → {"status": "ok", "version": "1.0.0"}
```

---

## Running the Frontend

```bash
cd Frontend
npm install
npm run dev
# → http://localhost:5173
```

### Demo mode (no backend required)

The frontend works fully in demo mode without any backend or Supabase configuration. All data is stored in `localStorage`. When real credentials are provided, the app automatically switches to the real backend.

---

## API Documentation

With the backend running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Liveness check |
| `GET` | `/ready` | No | Readiness check |
| `GET` | `/api/profiles/me` | Yes | Get your profile |
| `PATCH` | `/api/profiles/me` | Yes | Update profile |
| `POST` | `/api/learning-paths/generate` | Yes | Generate AI roadmap |
| `GET` | `/api/learning-paths` | Yes | List all your paths |
| `GET` | `/api/learning-paths/{id}` | Yes | Get path detail |
| `PATCH` | `/api/learning-paths/{id}` | Yes | Update path metadata |
| `POST` | `/api/learning-paths/{id}/revise` | Yes | Regenerate with new params |
| `DELETE` | `/api/learning-paths/{id}` | Yes | Delete path |
| `GET` | `/api/learning-paths/{id}/progress` | Yes | Get progress stats |
| `PATCH` | `/api/lessons/{id}/progress` | Yes | Toggle lesson completion |
| `POST` | `/api/assessments/generate` | Yes | Generate quiz |
| `POST` | `/api/assessments/submit` | Yes | Submit and score quiz |
| `GET` | `/api/learning-paths/{id}/assessments` | Yes | Assessment history |

**Authentication**: All protected endpoints require:
```
Authorization: Bearer <supabase_access_token>
```

The Supabase access token is obtained automatically by the frontend from the active session.

---

## Running Tests

```bash
# From Backend/ with .venv activated
python -m pytest tests/ -v
```

Expected output:
```
30 passed, 3 warnings in 1.5s
```

### What's tested

- ✅ Health endpoints return correct responses
- ✅ CORS allows configured frontend origin
- ✅ Missing/invalid/expired tokens return 401
- ✅ Unauthenticated users cannot access any protected endpoint
- ✅ AI response schema validation (valid + invalid cases)
- ✅ AI service errors return 503 with safe messages
- ✅ Assessment scoring is computed server-side
- ✅ Progress calculations are mathematically correct
- ✅ Error responses do not expose stack traces

**All tests are fully mocked** — no real Gemini or Supabase calls are made during testing.

---

## Troubleshooting

### `GEMINI_API_KEY is empty` on startup
Set `GEMINI_API_KEY` in `Backend/.env`. The server refuses to start without it.

### `Token verification failed` (401)
- Ensure the user is signed in via Supabase Auth
- Check `SUPABASE_SECRET_KEY` is the service-role key (not the anon key)
- Tokens expire after 1 hour — frontend auto-refreshes via Supabase session

### `AI service is temporarily unavailable` (503)
- Check your Gemini API key is valid
- Check you haven't exceeded your quota
- Try `GEMINI_MODEL=gemini-1.5-flash` if the default model is unavailable

### `Failed to save learning path to database` (500)
- Verify you've run the SQL migration in Supabase
- Check `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are correct
- Inspect the Supabase **Logs** tab for constraint violations

### Frontend shows demo data after connecting backend
- Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `Frontend/.env`
- Restart the Vite dev server after changing `.env`
- Sign out and sign in again to get a real Supabase session

### `CORS` errors in browser
- Ensure `FRONTEND_ORIGIN=http://localhost:5173` in `Backend/.env`
- If using a custom frontend port, update `FRONTEND_ORIGIN` accordingly

---

## Deployment

### Backend (e.g. Railway, Render, Fly.io)

1. Set all environment variables from `.env.example` in your hosting dashboard
2. Set `APP_ENV=production`
3. Update `FRONTEND_ORIGIN` to your production frontend URL
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Frontend (e.g. Vercel, Netlify)

1. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` in dashboard
2. Build command: `npm run build`
3. Output directory: `dist`

### Security checklist for production

- [ ] `SUPABASE_SECRET_KEY` set only in backend environment (never in frontend)
- [ ] `APP_ENV=production` (disables localhost CORS)
- [ ] `FRONTEND_ORIGIN` set to exact production URL (no wildcard)
- [ ] All `.env` files excluded from version control
- [ ] Gemini API key has appropriate usage quotas set
- [ ] Supabase RLS is enabled on all tables (verified in migration)
