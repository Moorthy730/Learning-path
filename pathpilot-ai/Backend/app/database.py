"""
database.py — Supabase client factory.

Two clients are provided:
  - anon_client: Uses the publishable/anon key. Suitable for client-facing
    operations where RLS handles authorization.
  - admin_client: Uses the service-role secret key. Only used internally to
    verify tokens and perform operations that require bypassing RLS (e.g. 
    profile upsert on first login). NEVER returned to or used by frontend code.
"""
from __future__ import annotations

from functools import lru_cache
from supabase import create_client, Client
from app.config import get_settings


@lru_cache(maxsize=1)
def get_admin_client() -> Client:
    """
    Admin Supabase client using the service-role secret key.
    Use ONLY for server-side operations: token verification, admin queries.
    Never expose this client's credentials to the frontend.
    """
    settings = get_settings()
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY.get_secret_value(),
    )


def get_user_client(access_token: str) -> Client:
    """
    Return a Supabase client authenticated as the given user.
    RLS policies on all tables will be enforced for this client.
    A new client is created per request (not cached) so tokens don't leak.
    """
    settings = get_settings()
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_PUBLISHABLE_KEY,
    )
    client.postgrest.auth(access_token)
    return client
