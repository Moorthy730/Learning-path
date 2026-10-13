# Daily Learning Reminder & Notification System — Implementation Report

> **Commit**: `5b11726` → `Moorthy730/Learning-path` `main`  
> **Tests**: **46/46 pass** | **Frontend build**: tsc 0 errors, exit 0

---

## What Was Built

### 1. Database Migration
> Run **`002_reminders_and_notifications.sql`** in Supabase SQL Editor

| Table | Purpose |
|---|---|
| `reminder_preferences` | Per-user: enabled, `reminder_time` (TIME), IANA `timezone`, email/push toggles |
| `notifications` | In-app notification history with `read`, `email_sent` status, `data` JSONB |
| `daily_tasks` | Tasks linked to learning path lessons, bucketed by `scheduled_date`, `completed`, `overdue` |
| `push_subscriptions` | WebPush VAPID subscription storage (architecture ready, not wired to sender yet) |
| `reminder_log` | Deduplication log — one row per user/date/channel prevents duplicate reminders |

All five tables have full **Row Level Security** (users can only read/write their own rows). The backend uses the service-role key and enforces ownership at the application layer as a second defence.

---

### 2. Backend — New Files

| File | Description |
|---|---|
| [`schemas_reminders.py`](file:///d:/Project/Innover/pathpilot-ai/Backend/app/schemas_reminders.py) | Pydantic v2 schemas. `reminder_time` validated as valid 24h clock (00:00–23:59) |
| [`services/notification_service.py`](file:///d:/Project/Innover/pathpilot-ai/Backend/app/services/notification_service.py) | Creates in-app notifications; sends email via Resend API; `reminder_log` dedup |
| [`services/reminder_scheduler.py`](file:///d:/Project/Innover/pathpilot-ai/Backend/app/services/reminder_scheduler.py) | APScheduler job, fires every minute. Checks each user's local time vs their configured time. Handles timezone correctly via `zoneinfo.ZoneInfo` |
| [`routes/notifications.py`](file:///d:/Project/Innover/pathpilot-ai/Backend/app/routes/notifications.py) | `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/read`, `PATCH /api/notifications/read-all` |
| [`routes/reminders.py`](file:///d:/Project/Innover/pathpilot-ai/Backend/app/routes/reminders.py) | `GET/PATCH /api/reminders/preferences` (auto-creates defaults), push subscription endpoints |
| [`routes/daily_tasks.py`](file:///d:/Project/Innover/pathpilot-ai/Backend/app/routes/daily_tasks.py) | `GET /api/daily-tasks` (bucketed response), `POST`, `PATCH /{id}` (complete/snooze), `DELETE /{id}` |

### Updated Backend Files

| File | Change |
|---|---|
| [`app/main.py`](file:///d:/Project/Innover/pathpilot-ai/Backend/app/main.py) | `start_scheduler()` in lifespan startup, `stop_scheduler()` on shutdown. 3 new routers registered |
| [`app/config.py`](file:///d:/Project/Innover/pathpilot-ai/Backend/app/config.py) | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SCHEDULER_ENABLED` optional env vars |
| `requirements.txt` | Added `apscheduler==3.10.4`, `pytz==2024.2`, `httpx>=0.28.1` |

---

### 3. How the Scheduler Works

```
FastAPI starts → APScheduler starts (in-process, same event loop)
      ↓
  Every minute: _run_reminder_check()
      ↓  
  Fetch all users with enabled=True from reminder_preferences
      ↓ for each user:
  Convert current UTC time → user's IANA timezone
      ↓
  If local hour:minute == reminder_time → proceed
  Else → skip (no DB writes)
      ↓
  Check reminder_log: already sent today? → skip
      ↓
  Fetch pending daily_tasks for today
      ↓
  No tasks → log as "skipped", stop
  Has tasks → create in-app notification + log as "sent"
      ↓
  If email_enabled AND RESEND_API_KEY set → send email
```

> **Server-side guarantee**: The scheduler runs inside the FastAPI process and fires whether or not any browser tab is open. On Render (single instance), this is production-appropriate.

---

### 4. Frontend — New Files

| File | Description |
|---|---|
| [`services/notificationService.ts`](file:///d:/Project/Innover/pathpilot-ai/Frontend/src/services/notificationService.ts) | Typed wrappers for all notification/reminder/task API calls |
| [`components/notifications/NotificationBell.tsx`](file:///d:/Project/Innover/pathpilot-ai/Frontend/src/components/notifications/NotificationBell.tsx) | Bell icon with live unread badge (Luna Blue `#54ACBF`), polls every 60s. Dropdown shows notification list, time-ago, mark-read, mark-all-read, deep link to learning path |
| [`components/notifications/DailyTaskChecklist.tsx`](file:///d:/Project/Innover/pathpilot-ai/Frontend/src/components/notifications/DailyTaskChecklist.tsx) | Task list bucketed as Overdue / Today / Completed Today. Optimistic toggle with auto-revert. Luna Blue gradient progress bar |

### Updated Frontend Files

| File | Change |
|---|---|
| [`components/layout/TopBar.tsx`](file:///d:/Project/Innover/pathpilot-ai/Frontend/src/components/layout/TopBar.tsx) | Replaced static Bell icon with live `<NotificationBell />` |
| [`pages/Dashboard.tsx`](file:///d:/Project/Innover/pathpilot-ai/Frontend/src/pages/Dashboard.tsx) | Added `<DailyTaskChecklist />` to right column |
| [`pages/Settings.tsx`](file:///d:/Project/Innover/pathpilot-ai/Frontend/src/pages/Settings.tsx) | New "Notifications & Reminders" section: enable toggle, time picker, timezone dropdown (browser timezone auto-detected), email toggle, Save button |

---

### 5. Test Results — 46/46 Pass

```
tests/test_auth.py          7/7   PASS
tests/test_bug_fixes.py     4/4   PASS
tests/test_health.py        4/4   PASS
tests/test_learning_paths.py 11/11 PASS
tests/test_reminders.py    12/12  PASS  ← NEW
tests/test_security.py      8/8   PASS
─────────────────────────────────────────
Total:                     46/46  PASS
```

#### New test coverage (test_reminders.py):
- Auth guard on all 3 new endpoint groups
- Notification unread count calculation
- Mark-all-read
- Invalid reminder_time format rejected (422) — including `25:00`, `8PM`, `8:00:00`
- Valid PATCH saves and returns correct timezone
- Daily task bucket split (today/overdue/completed)
- Complete task clears `overdue=False`
- Cross-user task access denied (403)
- Scheduler skips when no pending tasks (log = skipped)
- Scheduler creates notification for pending tasks
- Scheduler prevents duplicates via `check_reminder_already_sent`
- Scheduler no-ops when current minute ≠ configured minute

---

## What Requires External Setup

### ① Run the SQL Migration
Copy the contents of [`002_reminders_and_notifications.sql`](file:///d:/Project/Innover/pathpilot-ai/Backend/supabase/migrations/002_reminders_and_notifications.sql) and run it in:  
**Supabase Dashboard → SQL Editor → New Query → Run**

### ② Email Reminders (Optional)
Add to your backend `.env`:
```env
RESEND_API_KEY=re_...your_key...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```
Without this, email reminders are silently skipped. In-app reminders still work.  
Get a free API key at [resend.com](https://resend.com).

### ③ Multi-Instance Deployments (Render Pro / Railway)
If you ever scale to multiple backend instances:
- Set `SCHEDULER_ENABLED=false` on all but one instance, OR
- Move to a Render Cron Job calling a private `/admin/run-reminders` endpoint.

---

## What Is NOT Yet Implemented

| Feature | Status | Reason |
|---|---|---|
| Browser Push Notifications | Architecture only | Requires VAPID key pair + service worker registration. Table and endpoint exist. |
| Auto-populate daily tasks from paths | Not implemented | Requires a separate job that reads lesson schedules and creates `daily_tasks` rows. Currently users create tasks manually or via the checklist. |
| Task auto-creation on path generation | Not implemented | Would be added to `roadmap_service.py` post-generation step. |
| Snoozed task date updates in frontend | Backend only | UI snooze button not added; can be triggered via API directly. |

---

## How to Run Locally

```powershell
# Terminal 1 — Backend (scheduler starts automatically)
cd d:\Project\Innover\pathpilot-ai\Backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
# Watch for: "APScheduler started — daily reminder job running every minute"

# Terminal 2 — Frontend
cd d:\Project\Innover\pathpilot-ai\Frontend
npm run dev

# Run tests
cd d:\Project\Innover\pathpilot-ai\Backend
python -m pytest tests/ -v
```
