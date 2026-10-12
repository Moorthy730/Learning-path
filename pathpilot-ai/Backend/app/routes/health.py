"""
routes/health.py — Health and readiness endpoints.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings
from app.database import get_admin_client
from app.schemas import HealthResponse, ReadyResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Basic liveness check — always returns 200 if the server is running."""
    return HealthResponse(status="ok")


@router.get("/ready", response_model=ReadyResponse)
async def ready() -> ReadyResponse:
    """
    Readiness check — verifies essential config is present and DB is reachable.
    Never reveals secret values.
    """
    settings = get_settings()
    db_status = "unreachable"

    try:
        client = get_admin_client()
        # Lightweight query to test connectivity — just fetch a single profile row
        client.table("profiles").select("id").limit(1).execute()
        db_status = "connected"
    except Exception:
        db_status = "unreachable"

    return ReadyResponse(
        status="ready" if db_status == "connected" else "degraded",
        database=db_status,
        ai_configured=bool(settings.GEMINI_API_KEY.get_secret_value()),
    )
