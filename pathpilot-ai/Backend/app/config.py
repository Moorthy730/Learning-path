"""
config.py — Application configuration loaded from environment variables.
Uses pydantic-settings so missing required variables raise a clear startup error.
"""
from __future__ import annotations

from functools import lru_cache
from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Gemini ──────────────────────────────────────────────────────────────
    GEMINI_API_KEY: SecretStr = Field(..., description="Google Gemini API key")
    GEMINI_MODEL: str = Field(
        default="gemini-2.0-flash",
        description="Gemini model name. Must support structured output.",
    )

    # ── Supabase ─────────────────────────────────────────────────────────────
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_PUBLISHABLE_KEY: str = Field(
        ..., description="Supabase anon/publishable key for client operations"
    )
    SUPABASE_SECRET_KEY: SecretStr = Field(
        ...,
        description=(
            "Supabase service-role secret key for admin operations (token verification). "
            "NEVER expose this to the frontend."
        ),
    )

    # ── CORS ─────────────────────────────────────────────────────────────────
    FRONTEND_ORIGIN: str = Field(
        default="http://localhost:5173",
        description="Allowed origin for CORS (frontend URL)",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    APP_ENV: str = Field(default="development")
    MAX_GENERATIONS_PER_HOUR: int = Field(
        default=10, description="Max AI roadmap generations per user per hour"
    )
    AI_TIMEOUT_SECONDS: int = Field(
        default=60, description="Timeout for Gemini API calls in seconds"
    )

    @field_validator("SUPABASE_URL")
    @classmethod
    def validate_supabase_url(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("SUPABASE_URL must start with https://")
        return v.rstrip("/")

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings. Raises ValidationError on misconfiguration."""
    return Settings()
