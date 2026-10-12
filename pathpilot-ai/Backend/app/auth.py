"""
auth.py — FastAPI dependency for verifying Supabase JWT bearer tokens.
"""
from __future__ import annotations

import logging
from typing import Annotated

from fastapi import Depends, Header
from supabase import Client

from app.database import get_admin_client
from app.exceptions import AuthError

logger = logging.getLogger(__name__)


async def get_current_user_id(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """
    FastAPI dependency that:
    1. Reads the Bearer token from the Authorization header.
    2. Verifies it against Supabase Auth using the admin client.
    3. Returns the authenticated user's UUID.

    Raises AuthError (HTTP 401) on missing, invalid, or expired tokens.
    Never logs the token itself.
    """
    if not authorization:
        raise AuthError("Authorization header is required")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthError("Authorization header must be: Bearer <token>")

    token = parts[1]
    if not token:
        raise AuthError("Bearer token is empty")

    try:
        admin: Client = get_admin_client()
        response = admin.auth.get_user(token)

        if not response or not response.user:
            raise AuthError("Invalid or expired token")

        user_id: str = response.user.id
        if not user_id:
            raise AuthError("Could not extract user identity from token")

        return user_id

    except AuthError:
        raise
    except Exception:
        # Log without the token value
        logger.warning("Token verification failed", exc_info=False)
        raise AuthError("Token verification failed")


# Convenient alias for route dependencies
CurrentUserId = Annotated[str, Depends(get_current_user_id)]
