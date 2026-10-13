"""
routes/notifications.py — In-app notification endpoints.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter

from app.auth import CurrentUserId
from app.database import get_admin_client
from app.exceptions import DatabaseError, NotFoundError
from app.schemas_reminders import (
    NotificationListResponse,
    NotificationResponse,
    MarkNotificationsReadRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    user_id: CurrentUserId,
) -> NotificationListResponse:
    """Return the 50 most recent notifications for the authenticated user."""
    db = get_admin_client()

    try:
        res = (
            db.table("notifications")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
    except Exception as e:
        logger.error("DB error fetching notifications: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve notifications")

    rows = res.data or []
    notifications = [
        NotificationResponse(
            id=r["id"],
            type=r["type"],
            title=r["title"],
            message=r["message"],
            data=r.get("data") or {},
            read=r["read"],
            created_at=r["created_at"],
        )
        for r in rows
    ]
    unread_count = sum(1 for n in notifications if not n.read)

    return NotificationListResponse(
        notifications=notifications,
        unread_count=unread_count,
    )


@router.patch("/read", response_model=dict)
async def mark_notifications_read(
    body: MarkNotificationsReadRequest,
    user_id: CurrentUserId,
) -> dict:
    """Mark specific notifications as read. Only affects the authenticated user's notifications."""
    db = get_admin_client()

    try:
        # Update only rows owned by this user (extra safety on top of app-layer filter)
        for notif_id in body.notification_ids:
            db.table("notifications").update({"read": True}).eq("id", notif_id).eq(
                "user_id", user_id
            ).execute()
    except Exception as e:
        logger.error("DB error marking read: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to update notifications")

    return {"updated": len(body.notification_ids)}


@router.patch("/read-all", response_model=dict)
async def mark_all_notifications_read(user_id: CurrentUserId) -> dict:
    """Mark ALL notifications for the user as read."""
    db = get_admin_client()
    try:
        db.table("notifications").update({"read": True}).eq("user_id", user_id).eq(
            "read", False
        ).execute()
    except Exception as e:
        logger.error("DB error marking all read: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to update notifications")
    return {"updated": "all"}


@router.get("/unread-count", response_model=dict)
async def get_unread_count(user_id: CurrentUserId) -> dict:
    """Return the count of unread notifications (lightweight for bell badge polling)."""
    db = get_admin_client()
    try:
        res = (
            db.table("notifications")
            .select("id")
            .eq("user_id", user_id)
            .eq("read", False)
            .execute()
        )
        return {"unread_count": len(res.data or [])}
    except Exception as e:
        logger.error("DB error fetching unread count: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve unread count")
