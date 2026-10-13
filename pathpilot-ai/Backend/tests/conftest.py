"""
conftest.py — Shared pytest fixtures.

All external dependencies (Supabase, Gemini) are mocked here.
Tests never make real API calls or incur usage charges.
"""
from __future__ import annotations

import os
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient

# Set required env vars BEFORE importing the app
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key-abc123")
os.environ.setdefault("GEMINI_MODEL", "gemini-2.5-flash")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_PUBLISHABLE_KEY", "test-publishable-key")
os.environ.setdefault("SUPABASE_SECRET_KEY", "test-secret-key")
os.environ.setdefault("FRONTEND_ORIGIN", "http://localhost:5173")
os.environ.setdefault("APP_ENV", "test")


@pytest.fixture(autouse=True)
def mock_supabase(monkeypatch):
    """Auto-mock Supabase client so no real DB calls are made."""
    mock_client = MagicMock()
    mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    mock_client.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
    mock_client.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))

    monkeypatch.setattr("app.database.get_admin_client", lambda: mock_client)
    monkeypatch.setattr("app.database.get_user_client", lambda token: mock_client)
    return mock_client


@pytest.fixture
def client(mock_supabase):
    """Return a FastAPI TestClient with mocked Supabase."""
    from app.main import app
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def auth_headers():
    """Valid (mocked) auth headers for authenticated requests."""
    return {"Authorization": "Bearer test-valid-token"}


@pytest.fixture
def valid_generate_payload():
    return {
        "career_goal": "Full Stack Developer",
        "skill_level": "beginner",
        "existing_skills": ["HTML", "CSS"],
        "daily_hours": 2.0,
        "duration_weeks": 12,
        "learning_format": "mixed",
        "learning_objective": "job-readiness",
    }


SAMPLE_ROADMAP = {
    "title": "Full Stack Developer Path",
    "goal": "Full Stack Developer",
    "summary": "A personalized roadmap to become a full stack developer.",
    "duration_weeks": 12,
    "modules": [
        {
            "title": "JavaScript Fundamentals",
            "description": "Core JS concepts",
            "order_index": 1,
            "estimated_hours": 20,
            "project": "Build a calculator",
            "lessons": [
                {
                    "title": "Variables and Types",
                    "description": "Learn about JS data types",
                    "estimated_hours": 3.0,
                    "resource_url": None,
                    "completion_criteria": "Write 5 programs using different data types",
                }
            ],
        }
    ],
}
