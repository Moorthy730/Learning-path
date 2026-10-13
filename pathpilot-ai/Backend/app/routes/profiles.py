"""
routes/profiles.py — User profile endpoints.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter

from app.auth import CurrentUserId
from app.database import get_admin_client
from app.exceptions import DatabaseError, NotFoundError
from app.schemas import ProfileResponse, UpdateProfileRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(user_id: CurrentUserId) -> ProfileResponse:
    """Return the authenticated user's profile. Creates it if it doesn't exist."""
    admin = get_admin_client()

    try:
        res = admin.table("profiles").select("*").eq("id", user_id).execute()
    except Exception as e:
        logger.error("DB error fetching profile: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve profile")

    if not res.data:
        # Auto-create profile on first access
        now = datetime.now(timezone.utc).isoformat()
        try:
            # Get email from auth
            user_res = admin.auth.admin.get_user_by_id(user_id)
            email = user_res.user.email if user_res.user else None

            new_profile = {
                "id": user_id,
                "display_name": email.split("@")[0] if email else "User",
                "created_at": now,
                "updated_at": now,
            }
            insert_res = admin.table("profiles").insert(new_profile).execute()
            profile = insert_res.data[0] if insert_res.data else new_profile
            # Attach email from auth
            profile["email"] = email
        except Exception as e:
            logger.error("DB error creating profile: %s", type(e).__name__, exc_info=False)
            raise DatabaseError("Failed to create profile")
    else:
        profile = res.data[0]
        # Attach email from Supabase Auth
        try:
            user_res = admin.auth.admin.get_user_by_id(user_id)
            profile["email"] = user_res.user.email if user_res.user else None
        except Exception:
            profile["email"] = None

    return ProfileResponse(
        id=profile["id"],
        display_name=profile.get("display_name"),
        email=profile.get("email"),
        created_at=profile["created_at"],
    )


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    body: UpdateProfileRequest,
    user_id: CurrentUserId,
) -> ProfileResponse:
    """Update allowed profile fields."""
    admin = get_admin_client()
    updates = body.model_dump(exclude_none=True)

    if not updates:
        return await get_my_profile(user_id)

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        admin.table("profiles").upsert({"id": user_id, **updates}).execute()
    except Exception as e:
        logger.error("DB error updating profile: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to update profile")

    return await get_my_profile(user_id)
