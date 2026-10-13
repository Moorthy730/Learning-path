"""
main.py — FastAPI application entry point.

Responsibilities:
- Create and configure the FastAPI app
- Set up CORS (allowlisting only the configured frontend origin)
- Register all routers
- Configure rate limiting via SlowAPI
- Attach exception handlers
- Verify required config at startup (fail fast on misconfiguration)
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings
from app.exceptions import register_exception_handlers
from app.routes import health, learning_paths, lessons, assessments, profiles
from app.routes import notifications, reminders, daily_tasks
from app.services.reminder_scheduler import start_scheduler, stop_scheduler

# Configure logging — never include secrets in format string
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("pathpilot")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup/shutdown. Validates config eagerly so the server fails fast."""
    try:
        settings = get_settings()
        logger.info(
            "PathPilot AI backend starting | env=%s | model=%s",
            settings.APP_ENV,
            settings.GEMINI_MODEL,
        )
        # Validate critical secrets are non-empty (pydantic already enforces presence)
        assert settings.GEMINI_API_KEY.get_secret_value(), "GEMINI_API_KEY is empty"
        assert settings.SUPABASE_SECRET_KEY.get_secret_value(), "SUPABASE_SECRET_KEY is empty"
    except Exception as e:
        logger.critical("Startup configuration error: %s", str(e))
        raise

    # Start the reminder scheduler (runs even when browser is closed)
    start_scheduler()

    yield  # Server is running

    # Graceful shutdown
    stop_scheduler()
    logger.info("PathPilot AI backend shutting down")


# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="PathPilot AI API",
        description=(
            "Backend API for PathPilot AI — AI-powered learning path generator. "
            "All endpoints require Supabase JWT authentication."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Only allowlist the configured frontend origin. Never use wildcard "*" in production.
    allowed_origins = [settings.FRONTEND_ORIGIN]
    if not settings.is_production:
        allowed_origins += ["http://localhost:5173", "http://127.0.0.1:5173"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
    )

    # ── Rate limiting ─────────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # ── Exception handlers ────────────────────────────────────────────────────
    register_exception_handlers(app)

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(health.router)
    app.include_router(profiles.router)
    app.include_router(learning_paths.router)
    app.include_router(lessons.router)
    app.include_router(assessments.router)
    app.include_router(notifications.router)
    app.include_router(reminders.router)
    app.include_router(daily_tasks.router)

    return app


app = create_app()
