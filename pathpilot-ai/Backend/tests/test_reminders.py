"""
test_reminders.py - Tests for reminders, notifications, and daily tasks.
Uses monkeypatching at the route/service layer to avoid complex DB mock chains.
"""
from __future__ import annotations
import asyncio
from datetime import date, datetime, timezone
from unittest.mock import MagicMock, AsyncMock, patch, call
from fastapi.testclient import TestClient

AUTH = {"Authorization": "Bearer valid-token"}


def _app_client(user_id="user-123"):
    mock_admin = MagicMock()
    mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id=user_id))
    ctx = [
        patch("app.auth.get_admin_client", return_value=mock_admin),
        patch("app.database.get_admin_client", return_value=mock_admin),
        patch("app.services.reminder_scheduler.start_scheduler"),
        patch("app.services.reminder_scheduler.stop_scheduler"),
    ]
    for c in ctx: c.start()
    from app.main import app
    client = TestClient(app, raise_server_exceptions=False)
    return client, mock_admin, ctx


def _stop(ctx):
    for c in ctx: c.stop()


# ── Auth required ─────────────────────────────────────────────────────────────

def test_notifications_require_auth():
    mock_admin = MagicMock()
    mock_admin.auth.get_user.return_value = MagicMock(user=None)
    with patch("app.auth.get_admin_client", return_value=mock_admin), \
         patch("app.database.get_admin_client", return_value=mock_admin), \
         patch("app.services.reminder_scheduler.start_scheduler"), \
         patch("app.services.reminder_scheduler.stop_scheduler"):
        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        assert c.get("/api/notifications").status_code == 401
        assert c.get("/api/reminders/preferences").status_code == 401
        assert c.get("/api/daily-tasks").status_code == 401


# ── Notifications: unread count ────────────────────────────────────────────────

def test_notifications_unread_count_zero():
    """Endpoint returns unread_count=0 when all notifications are read."""
    now = datetime.now(timezone.utc).isoformat()
    rows = [{"id": "n1", "type": "reminder", "title": "T", "message": "M",
             "data": {}, "read": True, "created_at": now}]
    with patch("app.routes.notifications.get_admin_client") as mock_db_fn, \
         patch("app.auth.get_admin_client") as mock_auth_fn, \
         patch("app.database.get_admin_client") as mock_db2, \
         patch("app.services.reminder_scheduler.start_scheduler"), \
         patch("app.services.reminder_scheduler.stop_scheduler"):
        mock_admin = MagicMock()
        mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
        mock_auth_fn.return_value = mock_admin
        mock_db2.return_value = mock_admin
        notif_admin = MagicMock()
        notif_admin.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(data=rows)
        mock_db_fn.return_value = notif_admin

        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        resp = c.get("/api/notifications", headers=AUTH)
        assert resp.status_code == 200
        body = resp.json()
        assert body["unread_count"] == 0
        assert len(body["notifications"]) == 1


def test_mark_all_read():
    """PATCH /api/notifications/read-all returns 200."""
    with patch("app.routes.notifications.get_admin_client") as mock_db_fn, \
         patch("app.auth.get_admin_client") as mock_auth_fn, \
         patch("app.database.get_admin_client") as mock_db2, \
         patch("app.services.reminder_scheduler.start_scheduler"), \
         patch("app.services.reminder_scheduler.stop_scheduler"):
        mock_admin = MagicMock()
        mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
        mock_auth_fn.return_value = mock_admin
        mock_db2.return_value = mock_admin
        notif_admin = MagicMock()
        notif_admin.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        mock_db_fn.return_value = notif_admin

        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        resp = c.patch("/api/notifications/read-all", headers=AUTH)
        assert resp.status_code == 200
        assert resp.json()["updated"] == "all"


# ── Reminder Preferences ──────────────────────────────────────────────────────

def test_preferences_invalid_time_format_rejected():
    """Reminder time must match HH:MM pattern."""
    with patch("app.routes.reminders.get_admin_client") as mock_db_fn, \
         patch("app.auth.get_admin_client") as mock_auth_fn, \
         patch("app.database.get_admin_client") as mock_db2, \
         patch("app.services.reminder_scheduler.start_scheduler"), \
         patch("app.services.reminder_scheduler.stop_scheduler"):
        mock_admin = MagicMock()
        mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
        mock_auth_fn.return_value = mock_admin
        mock_db2.return_value = mock_admin
        mock_db_fn.return_value = MagicMock()
        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        for bad in ("8pm", "8:00:00", "25:00", ""):
            resp = c.patch("/api/reminders/preferences", headers=AUTH,
                          json={"reminder_time": bad})
            assert resp.status_code == 422, f"Expected 422 for {bad!r}, got {resp.status_code}"


def test_preferences_valid_update():
    """Valid time HH:MM + timezone PATCH returns 200."""
    now = datetime.now(timezone.utc).isoformat()
    pref_row = {"user_id": "user-123", "enabled": True, "reminder_time": "09:00",
                "timezone": "Asia/Kolkata", "email_enabled": False, "push_enabled": False,
                "created_at": now, "updated_at": now}
    with patch("app.routes.reminders.get_admin_client") as mock_db_fn, \
         patch("app.auth.get_admin_client") as mock_auth_fn, \
         patch("app.database.get_admin_client") as mock_db2, \
         patch("app.services.reminder_scheduler.start_scheduler"), \
         patch("app.services.reminder_scheduler.stop_scheduler"):
        mock_admin = MagicMock()
        mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
        mock_auth_fn.return_value = mock_admin
        mock_db2.return_value = mock_admin
        db = MagicMock()
        db.table.return_value.upsert.return_value.execute.return_value = MagicMock(data=[])
        db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[pref_row])
        mock_db_fn.return_value = db
        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        resp = c.patch("/api/reminders/preferences", headers=AUTH,
                      json={"reminder_time": "09:00", "timezone": "Asia/Kolkata"})
        assert resp.status_code == 200
        assert resp.json()["timezone"] == "Asia/Kolkata"


# ── Daily Tasks ───────────────────────────────────────────────────────────────

def _task_row(idx=1, today=None, completed=False, overdue=False):
    d = today or date.today().isoformat()
    now = datetime.now(timezone.utc).isoformat()
    return {"id": f"t{idx}", "user_id": "user-123", "path_id": "p1",
            "lesson_id": None, "task_type": "lesson", "title": f"Task {idx}",
            "scheduled_date": d, "completed": completed,
            "completed_at": now if completed else None, "overdue": overdue,
            "snoozed_until": None, "created_at": now, "updated_at": now}


def test_daily_tasks_bucket_split():
    """Today/overdue/completed buckets are correctly populated."""
    today = date.today().isoformat()
    tasks = [
        _task_row(1, today, completed=False, overdue=False),   # → today
        _task_row(2, today, completed=True,  overdue=False),   # → completed_today
        _task_row(3, "2024-01-01", completed=False, overdue=True),  # → overdue
    ]
    with patch("app.routes.daily_tasks.get_admin_client") as mock_db_fn, \
         patch("app.auth.get_admin_client") as mock_auth_fn, \
         patch("app.database.get_admin_client") as mock_db2, \
         patch("app.services.reminder_scheduler.start_scheduler"), \
         patch("app.services.reminder_scheduler.stop_scheduler"):
        mock_admin = MagicMock()
        mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
        mock_auth_fn.return_value = mock_admin
        mock_db2.return_value = mock_admin
        db = MagicMock()
        # update (overdue sweep) + select (all tasks)
        db.table.return_value.update.return_value.eq.return_value.lt.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        db.table.return_value.select.return_value.eq.return_value.order.return_value.order.return_value.execute.return_value = MagicMock(data=tasks)
        mock_db_fn.return_value = db
        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        resp = c.get("/api/daily-tasks", headers=AUTH)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["today"]) == 1
    assert len(body["completed_today"]) == 1
    assert len(body["overdue"]) == 1


def test_complete_task_clears_overdue_flag():
    """Marking an overdue task complete sets overdue=False in response."""
    task = _task_row(1, "2024-01-01", completed=False, overdue=True)
    with patch("app.routes.daily_tasks.get_admin_client") as mock_db_fn, \
         patch("app.auth.get_admin_client") as mock_auth_fn, \
         patch("app.database.get_admin_client") as mock_db2, \
         patch("app.services.reminder_scheduler.start_scheduler"), \
         patch("app.services.reminder_scheduler.stop_scheduler"):
        mock_admin = MagicMock()
        mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
        mock_auth_fn.return_value = mock_admin
        mock_db2.return_value = mock_admin
        db = MagicMock()
        db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[task])
        db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        mock_db_fn.return_value = db
        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        resp = c.patch("/api/daily-tasks/t1", headers=AUTH, json={"completed": True})
    assert resp.status_code == 200
    assert resp.json()["completed"] is True
    assert resp.json()["overdue"] is False


def test_cross_user_task_access_denied():
    """User B cannot modify User A task."""
    task_a = _task_row(1)  # belongs to user-123
    task_a["user_id"] = "user-123"
    with patch("app.routes.daily_tasks.get_admin_client") as mock_db_fn, \
         patch("app.auth.get_admin_client") as mock_auth_fn, \
         patch("app.database.get_admin_client") as mock_db2, \
         patch("app.services.reminder_scheduler.start_scheduler"), \
         patch("app.services.reminder_scheduler.stop_scheduler"):
        mock_admin = MagicMock()
        # user-999 is making the request
        mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-999"))
        mock_auth_fn.return_value = mock_admin
        mock_db2.return_value = mock_admin
        db = MagicMock()
        db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[task_a])
        mock_db_fn.return_value = db
        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        resp = c.patch("/api/daily-tasks/t1",
                      headers={"Authorization": "Bearer other"},
                      json={"completed": True})
    assert resp.status_code == 403


# ── Scheduler Logic ───────────────────────────────────────────────────────────

def test_scheduler_skips_when_no_pending_tasks():
    """Zero pending tasks → no notification, log = skipped."""
    from app.services.reminder_scheduler import _process_user_reminder
    db = MagicMock()
    pref = {"user_id": "u1", "reminder_time": "20:00:00", "timezone": "UTC", "email_enabled": False}
    with patch("app.services.reminder_scheduler.check_reminder_already_sent", return_value=False), \
         patch("app.services.reminder_scheduler.record_reminder_log") as mock_log, \
         patch("app.services.reminder_scheduler.create_in_app_notification", new=AsyncMock()) as mock_notif, \
         patch("app.services.reminder_scheduler._get_user_local_time",
               return_value=datetime(2024, 1, 15, 20, 0, 0, tzinfo=timezone.utc)):
        db.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        asyncio.run(_process_user_reminder(db, pref))
    mock_notif.assert_not_called()
    assert mock_log.call_args[0][4] == "skipped"


def test_scheduler_sends_notification_for_pending():
    """Pending tasks at reminder time → in-app notification created."""
    from app.services.reminder_scheduler import _process_user_reminder
    db = MagicMock()
    pref = {"user_id": "u1", "reminder_time": "20:00:00", "timezone": "UTC", "email_enabled": False}
    with patch("app.services.reminder_scheduler.check_reminder_already_sent", return_value=False), \
         patch("app.services.reminder_scheduler.record_reminder_log"), \
         patch("app.services.reminder_scheduler.create_in_app_notification", new=AsyncMock()) as mock_notif, \
         patch("app.services.reminder_scheduler._get_user_local_time",
               return_value=datetime(2024, 1, 15, 20, 0, 0, tzinfo=timezone.utc)):
        db.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[
            {"id": "t1", "title": "Read chapter", "path_id": "p1", "task_type": "lesson"},
        ])
        asyncio.run(_process_user_reminder(db, pref))
    mock_notif.assert_called_once()
    assert mock_notif.call_args[1]["notif_type"] == "reminder"


def test_scheduler_prevents_duplicate():
    """Already-logged reminder prevents second delivery."""
    from app.services.reminder_scheduler import _process_user_reminder
    db = MagicMock()
    pref = {"user_id": "u1", "reminder_time": "20:00:00", "timezone": "UTC", "email_enabled": False}
    with patch("app.services.reminder_scheduler.check_reminder_already_sent", return_value=True), \
         patch("app.services.reminder_scheduler.create_in_app_notification", new=AsyncMock()) as mock_notif, \
         patch("app.services.reminder_scheduler._get_user_local_time",
               return_value=datetime(2024, 1, 15, 20, 0, 0, tzinfo=timezone.utc)):
        asyncio.run(_process_user_reminder(db, pref))
    mock_notif.assert_not_called()


def test_scheduler_wrong_minute_does_nothing():
    """When current minute != configured reminder minute, nothing should happen."""
    from app.services.reminder_scheduler import _process_user_reminder
    db = MagicMock()
    pref = {"user_id": "u1", "reminder_time": "20:00:00", "timezone": "UTC", "email_enabled": False}
    with patch("app.services.reminder_scheduler.check_reminder_already_sent") as mock_check, \
         patch("app.services.reminder_scheduler._get_user_local_time",
               return_value=datetime(2024, 1, 15, 19, 30, 0, tzinfo=timezone.utc)):
        asyncio.run(_process_user_reminder(db, pref))
    mock_check.assert_not_called()  # function should have returned early
