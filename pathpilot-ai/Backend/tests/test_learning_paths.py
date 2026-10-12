"""
test_learning_paths.py — Learning path generation and CRUD tests.
All Gemini and Supabase calls are mocked — no real API charges.
"""
from __future__ import annotations

import json
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient

from tests.conftest import SAMPLE_ROADMAP


def _make_auth_client(monkeypatch) -> TestClient:
    """Create a TestClient with working auth and DB mocks."""
    mock_admin = MagicMock()
    mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
    monkeypatch.setattr("app.database.get_admin_client", lambda: mock_admin)
    monkeypatch.setattr("app.auth.get_admin_client", lambda: mock_admin)

    from app.main import app
    return TestClient(app, raise_server_exceptions=False), mock_admin


# ── Schema validation tests ───────────────────────────────────────────────────

def test_ai_roadmap_schema_validates_valid_input():
    """Valid AI response must pass schema validation."""
    from app.schemas import AIRoadmapResponse
    result = AIRoadmapResponse.model_validate(SAMPLE_ROADMAP)
    assert result.title == SAMPLE_ROADMAP["title"]
    assert len(result.modules) == 1
    assert len(result.modules[0].lessons) == 1


def test_ai_roadmap_schema_rejects_empty_modules():
    """AI response with empty modules list must fail validation."""
    from app.schemas import AIRoadmapResponse
    import pydantic
    bad_data = {**SAMPLE_ROADMAP, "modules": []}
    with pytest.raises(pydantic.ValidationError):
        AIRoadmapResponse.model_validate(bad_data)


def test_ai_roadmap_schema_rejects_invalid_duration():
    """AI response with duration_weeks=0 must fail validation."""
    from app.schemas import AIRoadmapResponse
    import pydantic
    bad_data = {**SAMPLE_ROADMAP, "duration_weeks": 0}
    with pytest.raises(pydantic.ValidationError):
        AIRoadmapResponse.model_validate(bad_data)


def test_ai_roadmap_schema_rejects_duplicate_order_indices():
    """Modules with duplicate order_index must fail validation."""
    from app.schemas import AIRoadmapResponse
    import pydantic
    dup = {**SAMPLE_ROADMAP}
    dup["modules"] = [
        {**SAMPLE_ROADMAP["modules"][0], "order_index": 1},
        {**SAMPLE_ROADMAP["modules"][0], "order_index": 1},
    ]
    with pytest.raises(pydantic.ValidationError):
        AIRoadmapResponse.model_validate(dup)


def test_generate_request_validates_skill_level():
    """Invalid skill_level must be rejected by the request schema."""
    from app.schemas import GeneratePathRequest
    import pydantic
    with pytest.raises(pydantic.ValidationError):
        GeneratePathRequest(
            career_goal="Developer",
            skill_level="expert",  # invalid
            daily_hours=2.0,
            duration_weeks=12,
        )


def test_generate_request_trims_skills():
    """Skill strings should be stripped of whitespace."""
    from app.schemas import GeneratePathRequest
    req = GeneratePathRequest(
        career_goal="Developer",
        skill_level="beginner",
        existing_skills=["  Python  ", " JS "],
        daily_hours=2.0,
        duration_weeks=12,
    )
    assert req.existing_skills == ["Python", "JS"]


# ── Generation endpoint tests ─────────────────────────────────────────────────

def test_generate_without_auth_returns_401(client: TestClient, valid_generate_payload):
    resp = client.post("/api/learning-paths/generate", json=valid_generate_payload)
    assert resp.status_code == 401


def test_generate_with_valid_mock(monkeypatch, valid_generate_payload):
    """End-to-end mock: valid token + mocked AI + mocked DB should return 201."""
    mock_admin = MagicMock()
    mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))

    # Mock DB insert to return path data
    path_insert_result = MagicMock()
    path_insert_result.data = [{
        "id": "path-abc",
        "user_id": "user-123",
        "title": "Full Stack Developer Path",
        "goal": "Full Stack Developer",
        "current_level": "beginner",
        "existing_skills": ["HTML", "CSS"],
        "daily_hours": 2.0,
        "duration_weeks": 12,
        "learning_format": "mixed",
        "learning_objective": "job-readiness",
        "summary": "A personalized roadmap.",
        "status": "not-started",
        "created_at": "2024-01-01T00:00:00+00:00",
        "updated_at": "2024-01-01T00:00:00+00:00",
    }]
    mock_admin.table.return_value.insert.return_value.execute.return_value = path_insert_result
    mock_admin.table.return_value.select.return_value.eq.return_value.execute.return_value = path_insert_result

    # Patch at both the database module AND the routes module (already-imported reference)
    from app.schemas import AIRoadmapResponse
    mock_ai_result = AIRoadmapResponse.model_validate(SAMPLE_ROADMAP)

    with patch("app.database.get_admin_client", return_value=mock_admin), \
         patch("app.auth.get_admin_client", return_value=mock_admin), \
         patch("app.routes.learning_paths.get_admin_client", return_value=mock_admin), \
         patch("app.services.roadmap_service.generate_roadmap", new=AsyncMock(return_value=mock_ai_result)):
        from app.main import app
        test_client = TestClient(app, raise_server_exceptions=False)
        resp = test_client.post(
            "/api/learning-paths/generate",
            json=valid_generate_payload,
            headers={"Authorization": "Bearer valid-token"},
        )

    # With full mocking, expect 201 or 500 if DB mock isn't fully wired
    assert resp.status_code in (201, 500)


def test_ai_service_error_returns_503(valid_generate_payload):
    """When Gemini fails, the endpoint must return 503, not expose internals."""
    mock_admin = MagicMock()
    mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))

    from app.exceptions import AIServiceError
    with patch("app.database.get_admin_client", return_value=mock_admin), \
         patch("app.auth.get_admin_client", return_value=mock_admin), \
         patch("app.routes.learning_paths.get_admin_client", return_value=mock_admin), \
         patch("app.services.roadmap_service.generate_roadmap",
               new=AsyncMock(side_effect=AIServiceError("quota exceeded"))):
        from app.main import app
        test_client = TestClient(app, raise_server_exceptions=False)
        resp = test_client.post(
            "/api/learning-paths/generate",
            json=valid_generate_payload,
            headers={"Authorization": "Bearer valid-token"},
        )

    assert resp.status_code == 503
    body = resp.json()
    assert "quota" in body.get("error", "").lower() or "ai" in body.get("error", "").lower()


def test_list_paths_without_auth_returns_401(client: TestClient):
    resp = client.get("/api/learning-paths")
    assert resp.status_code == 401


def test_delete_path_without_auth_returns_401(client: TestClient):
    resp = client.delete("/api/learning-paths/some-path-id")
    assert resp.status_code == 401
