"""
reminder_scheduler.py — APScheduler integration for daily learning reminders.

Design:
- An AsyncIOScheduler runs inside the FastAPI lifespan.
- A job fires every minute to check if any user is due for a reminder at this moment.
- Checks are done in UTC then converted to each user's configured timezone.
- Duplicate reminders are prevented by `reminder_log` (one row per user/date/channel).
- All scheduler errors are caught and logged — the scheduler NEVER crashes the API.
- In-memory scheduler state is lost on restart, which is fine since reminder_log
  prevents re-delivery even after a restart.

Production note (Render):
- Render Web Services stay alive while receiving traffic.
- The scheduler runs in-process. This is production-appropriate for a single-instance
  deployment. For multi-instance, use a Render Cron Job or dedicated worker.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import get_settings
from app.database import get_admin_client
from app.services.notification_service import (
    create_in_app_notification,
    send_email_reminder,
    check_reminder_already_sent,
    record_reminder_log,
)

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def _get_user_local_time(user_tz: str) -> datetime:
    """Return current time in the user's timezone. Falls back to UTC on bad TZ string."""
    try:
        tz = ZoneInfo(user_tz)
    except (ZoneInfoNotFoundError, KeyError):
        tz = ZoneInfo("UTC")
    return datetime.now(tz)


async def _run_reminder_check() -> None:
    """
    Core job: check every user with reminders enabled and send if it's their
    configured time and they have pending tasks today.
    """
    settings = get_settings()
    if not settings.SCHEDULER_ENABLED:
        return

    logger.debug("Reminder check starting…")
    db = get_admin_client()

    # Fetch all users with reminders enabled
    try:
        prefs_res = (
            db.table("reminder_preferences")
            .select("user_id, reminder_time, timezone, email_enabled")
            .eq("enabled", True)
            .execute()
        )
    except Exception as e:
        logger.error("Scheduler: failed to fetch preferences: %s", type(e).__name__, exc_info=False)
        return

    for pref in (prefs_res.data or []):
        try:
            await _process_user_reminder(db, pref)
        except Exception as e:
            # Never let one user's failure stop processing others
            logger.error(
                "Scheduler: error processing user %s: %s",
                pref.get("user_id", "?")[:8],
                type(e).__name__,
                exc_info=False,
            )


async def _process_user_reminder(db, pref: dict) -> None:
    """Check and (possibly) send a reminder for one user."""
    user_id: str = pref["user_id"]
    user_tz: str = pref.get("timezone", "UTC")
    reminder_time_str: str = pref.get("reminder_time", "20:00:00")
    email_enabled: bool = pref.get("email_enabled", False)

    # Parse configured time (HH:MM or HH:MM:SS)
    parts = reminder_time_str.split(":")
    target_hour = int(parts[0])
    target_minute = int(parts[1]) if len(parts) > 1 else 0

    # Current time in user's timezone
    local_now = _get_user_local_time(user_tz)
    today_str = local_now.strftime("%Y-%m-%d")

    # Only fire during the configured minute window
    if local_now.hour != target_hour or local_now.minute != target_minute:
        return

    # Check deduplication — in-app channel
    if check_reminder_already_sent(db, user_id, today_str, "in_app"):
        logger.debug("Reminder already sent for user %s on %s", user_id[:8], today_str)
        return

    # Fetch today's pending tasks
    try:
        tasks_res = (
            db.table("daily_tasks")
            .select("id, title, path_id, task_type")
            .eq("user_id", user_id)
            .eq("scheduled_date", today_str)
            .eq("completed", False)
            .execute()
        )
    except Exception as e:
        logger.error("Scheduler: failed to fetch tasks for %s: %s", user_id[:8], type(e).__name__)
        record_reminder_log(db, user_id, today_str, "in_app", "failed", str(e)[:200])
        return

    pending_tasks = tasks_res.data or []

    if not pending_tasks:
        # All done today — no reminder needed; record as skipped
        record_reminder_log(db, user_id, today_str, "in_app", "skipped", "no_pending_tasks")
        return

    task_titles = ", ".join(t["title"] for t in pending_tasks[:3])
    more = len(pending_tasks) - 3
    summary = task_titles + (f" and {more} more" if more > 0 else "")

    # Create in-app notification
    try:
        await create_in_app_notification(
            db=db,
            user_id=user_id,
            notif_type="reminder",
            title=f"📍 Daily Reminder — {len(pending_tasks)} task(s) pending",
            message=f"You still have tasks to complete today: {summary}. Keep going!",
            data={
                "pending_count": len(pending_tasks),
                "task_ids": [t["id"] for t in pending_tasks[:10]],
            },
        )
        record_reminder_log(db, user_id, today_str, "in_app", "sent")
    except Exception as e:
        logger.error("Scheduler: failed to create notification for %s: %s", user_id[:8], type(e).__name__)
        record_reminder_log(db, user_id, today_str, "in_app", "failed", str(e)[:200])
        return

    # Optional email reminder
    if email_enabled:
        if not check_reminder_already_sent(db, user_id, today_str, "email"):
            try:
                # Get user email from auth
                user_res = db.auth.admin.get_user_by_id(user_id)
                email = user_res.user.email if user_res.user else None
                name = (user_res.user.email or "").split("@")[0].capitalize() if user_res.user else "Learner"
            except Exception:
                email = None
                name = "Learner"

            if email:
                sent = await send_email_reminder(email, name, pending_tasks)
                status = "sent" if sent else "failed"
                record_reminder_log(db, user_id, today_str, "email", status)


def start_scheduler() -> AsyncIOScheduler:
    """Start and return the APScheduler instance. Call once at app startup."""
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler

    settings = get_settings()
    if not settings.SCHEDULER_ENABLED:
        logger.info("Scheduler disabled via SCHEDULER_ENABLED=False")
        return None  # type: ignore

    _scheduler = AsyncIOScheduler(timezone="UTC")
    # Run the check every minute
    _scheduler.add_job(
        _run_reminder_check,
        trigger="cron",
        minute="*",  # every minute at :00 seconds
        id="daily_reminder_check",
        replace_existing=True,
        misfire_grace_time=30,  # allow up to 30s late
    )
    _scheduler.start()
    logger.info("APScheduler started — daily reminder job running every minute")
    return _scheduler


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler. Call at app shutdown."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")
