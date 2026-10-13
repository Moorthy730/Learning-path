"""
routes/reminders.py — User reminder preference endpoints.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter

from app.auth import CurrentUserId
from app.database import get_admin_client
from app.exceptions import DatabaseError
from app.schemas_reminders import (
    ReminderPreferencesResponse,
    UpdateReminderPreferencesRequest,
    PushSubscriptionRequest,
    PushSubscriptionResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reminders", tags=["reminders"])

_DEFAULT_PREFS = {
    "enabled": True,
    "reminder_time": "20:00",
    "timezone": "UTC",
    "email_enabled": False,
    "push_enabled": False,
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/preferences", response_model=ReminderPreferencesResponse)
async def get_preferences(user_id: CurrentUserId) -> ReminderPreferencesResponse:
    """
    Return the user's reminder preferences.
    Auto-creates a default row if one doesn't exist yet.
    """
    db = get_admin_client()

    try:
        res = (
            db.table("reminder_preferences")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
    except Exception as e:
        logger.error("DB error fetching prefs: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve preferences")

    if not res.data:
        # Auto-create defaults
        now = _now()
        new_pref = {
            "user_id": user_id,
            **_DEFAULT_PREFS,
            "created_at": now,
            "updated_at": now,
        }
        try:
            insert_res = db.table("reminder_preferences").insert(new_pref).execute()
            row = insert_res.data[0] if insert_res.data else {**new_pref}
        except Exception as e:
            logger.error("DB error creating prefs: %s", type(e).__name__, exc_info=False)
            raise DatabaseError("Failed to create preferences")
    else:
        row = res.data[0]

    # Normalize reminder_time to HH:MM (DB may store as HH:MM:SS)
    rt = row.get("reminder_time", "20:00")
    row["reminder_time"] = ":".join(rt.split(":")[:2])

    return ReminderPreferencesResponse(**row)


@router.patch("/preferences", response_model=ReminderPreferencesResponse)
async def update_preferences(
    body: UpdateReminderPreferencesRequest,
    user_id: CurrentUserId,
) -> ReminderPreferencesResponse:
    """Update reminder preferences. Only provided fields are changed."""
    db = get_admin_client()

    updates = body.model_dump(exclude_none=True)
    if not updates:
        return await get_preferences(user_id)

    updates["updated_at"] = _now()

    try:
        db.table("reminder_preferences").upsert(
            {"user_id": user_id, **updates}
        ).execute()
    except Exception as e:
        logger.error("DB error updating prefs: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to update preferences")

    return await get_preferences(user_id)


@router.post("/push-subscription", response_model=PushSubscriptionResponse, status_code=201)
async def save_push_subscription(
    body: PushSubscriptionRequest,
    user_id: CurrentUserId,
) -> PushSubscriptionResponse:
    """
    Save a browser push subscription (WebPush/VAPID).
    Requires VAPID keys to be configured on the server.
    """
    db = get_admin_client()
    import uuid

    sub_id = str(uuid.uuid4())
    now = _now()

    try:
        # Upsert: update if same endpoint already registered
        res = db.table("push_subscriptions").upsert({
            "id": sub_id,
            "user_id": user_id,
            "endpoint": body.endpoint,
            "p256dh": body.p256dh,
            "auth_key": body.auth_key,
            "user_agent": body.user_agent,
            "active": True,
            "created_at": now,
        }, on_conflict="user_id,endpoint").execute()
        row = res.data[0] if res.data else {
            "id": sub_id, "endpoint": body.endpoint,
            "active": True, "created_at": now
        }
    except Exception as e:
        logger.error("DB error saving push sub: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to save push subscription")

    return PushSubscriptionResponse(
        id=row.get("id", sub_id),
        endpoint=body.endpoint,
        active=True,
        created_at=row.get("created_at", now),
    )


@router.delete("/push-subscription", response_model=dict, status_code=200)
async def remove_push_subscription(
    user_id: CurrentUserId,
) -> dict:
    """Remove all push subscriptions for the user (unsubscribe)."""
    db = get_admin_client()
    try:
        db.table("push_subscriptions").update({"active": False}).eq(
            "user_id", user_id
        ).execute()
    except Exception as e:
        logger.error("DB error removing push sub: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to remove push subscription")
    return {"removed": True}
