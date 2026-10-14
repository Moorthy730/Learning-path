"""
notification_service.py — In-app and email notification delivery.

Responsibilities:
- Create in-app notifications (stored in Supabase `notifications` table).
- Send email via Resend API if configured.
- Never crash the scheduler — all failures are logged and returned.
- Deduplicate reminders using the `reminder_log` table.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional
import uuid

import httpx
from supabase import Client

from app.config import get_settings

logger = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_in_app_notification(
    db: Client,
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    data: dict[str, Any] | None = None,
) -> str:
    """
    Insert a notification row. Returns the new notification's UUID.
    Raises DatabaseError on failure.
    """
    notif_id = str(uuid.uuid4())
    try:
        db.table("notifications").insert({
            "id": notif_id,
            "user_id": user_id,
            "type": notif_type,
            "title": title,
            "message": message,
            "data": data or {},
            "read": False,
            "email_sent": False,
            "created_at": _now(),
        }).execute()
        logger.info("Created in-app notification %s for user %s", notif_id, user_id[:8])
    except Exception as e:
        logger.error("Failed to create in-app notification: %s", type(e).__name__, exc_info=False)
        raise
    return notif_id


async def send_email_reminder(
    user_email: str,
    user_name: str,
    pending_tasks: list[dict[str, Any]],
) -> bool:
    """
    Send a daily reminder email via Resend API.
    Returns True on success, False if not configured or delivery fails.
    Email sending is best-effort — failure does NOT raise an exception.
    """
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        logger.debug("RESEND_API_KEY not set — skipping email reminder")
        return False

    task_list_html = "".join(
        f"<li style='margin:4px 0'>📚 {t['title']}</li>"
        for t in pending_tasks[:10]
    )
    more_count = len(pending_tasks) - 10
    more_note = f"<p>...and {more_count} more tasks</p>" if more_count > 0 else ""

    html_body = f"""
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#26658C,#023859);padding:24px;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">📍 PathPilot AI Daily Reminder</h1>
      </div>
      <div style="background:#f8fafc;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
        <p style="color:#334155">Hi <strong>{user_name}</strong>,</p>
        <p style="color:#475569">You have <strong>{len(pending_tasks)}</strong> pending task(s) for today:</p>
        <ul style="color:#334155;padding-left:20px">
          {task_list_html}
        </ul>
        {more_note}
        <a href="{settings.FRONTEND_ORIGIN.rstrip('/')}/dashboard"
           style="display:inline-block;margin-top:16px;padding:10px 20px;
                  background:#26658C;color:white;border-radius:8px;
                  text-decoration:none;font-weight:600">
          Open PathPilot AI →
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          You received this because you have daily reminders enabled in PathPilot AI.
          <br>To disable, go to Settings → Notifications.
        </p>
      </div>
    </div>
    """

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.RESEND_FROM_EMAIL,
                    "to": [user_email],
                    "subject": f"📍 {len(pending_tasks)} learning task(s) pending today — PathPilot AI",
                    "html": html_body,
                },
            )
            if resp.status_code in (200, 201):
                logger.info("Email reminder sent to %s", user_email[:4] + "***")
                return True
            else:
                logger.warning(
                    "Email delivery failed (status=%d): %s",
                    resp.status_code,
                    resp.text[:200],
                )
                return False
    except Exception as e:
        logger.warning("Email delivery error: %s", type(e).__name__, exc_info=False)
        return False


def check_reminder_already_sent(
    db: Client,
    user_id: str,
    today_str: str,
    channel: str,
) -> bool:
    """Return True if a reminder was already sent/skipped for this user+date+channel."""
    try:
        res = (
            db.table("reminder_log")
            .select("id")
            .eq("user_id", user_id)
            .eq("sent_date", today_str)
            .eq("channel", channel)
            .execute()
        )
        return bool(res.data)
    except Exception:
        return False


def record_reminder_log(
    db: Client,
    user_id: str,
    today_str: str,
    channel: str,
    status: str,
    details: str = "",
) -> None:
    """Record delivery attempt in reminder_log for deduplication."""
    try:
        db.table("reminder_log").insert({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "sent_date": today_str,
            "channel": channel,
            "status": status,
            "details": details[:500] if details else None,
            "created_at": _now(),
        }).execute()
    except Exception as e:
        # Upsert on conflict fails silently — log and continue
        logger.debug("reminder_log insert skipped (likely duplicate): %s", type(e).__name__)
