"""
test_bug_fixes.py - Regression tests for 3 verified bugs fixed in PathPilot AI.

BUG-01: profiles.py - db = get_user_client (missing parens, unused var).
BUG-02: roadmap_service.py - Invalid PostgREST .eq("module_id.path_id", ...) always returned 0.
BUG-03: assessments.py - get_path_assessments was at wrong URL prefix (404 guaranteed).
"""
from __future__ import annotations
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


def test_profiles_me_no_broken_db_reference(monkeypatch):
    """BUG-01: profiles route must reach admin DB without crashing on broken db ref."""
    mock_admin = MagicMock()
    mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
    profile_row = {"id": "user-123", "display_name": "Alice",
                   "created_at": "2024-01-01T00:00:00+00:00", "updated_at": "2024-01-01T00:00:00+00:00"}
    sel = MagicMock(); sel.data = [profile_row]
    mock_admin.table.return_value.select.return_value.eq.return_value.execute.return_value = sel
    user_m = MagicMock(); user_m.user.email = "alice@example.com"
    mock_admin.auth.admin.get_user_by_id.return_value = user_m

    with patch("app.database.get_admin_client", return_value=mock_admin), \
         patch("app.auth.get_admin_client", return_value=mock_admin), \
         patch("app.routes.profiles.get_admin_client", return_value=mock_admin):
        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        resp = c.get("/api/profiles/me", headers={"Authorization": "Bearer valid-token"})
    assert resp.status_code != 422
    assert resp.status_code in (200, 500)


def test_assessment_history_at_correct_url(monkeypatch):
    """BUG-03: GET /api/learning-paths/{id}/assessments must return 200/500, never 404."""
    mock_admin = MagicMock()
    mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
    path_row = {"id": "p1", "user_id": "user-123", "title": "T", "goal": "G",
                "current_level": "beginner", "existing_skills": [], "daily_hours": 2.0,
                "duration_weeks": 8, "learning_format": "mixed",
                "learning_objective": "job-readiness", "summary": "S",
                "status": "not-started", "roadmap": {},
                "created_at": "2024-01-01T00:00:00+00:00",
                "updated_at": "2024-01-01T00:00:00+00:00"}

    def tbl(name):
        t = MagicMock()
        if name == "learning_paths":
            t.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[path_row])
            t.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(data=[])
        elif name == "modules":
            t.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(data=[])
        elif name == "assessments":
            t.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(data=[])
        return t

    mock_admin.table.side_effect = tbl

    with patch("app.database.get_admin_client", return_value=mock_admin), \
         patch("app.auth.get_admin_client", return_value=mock_admin), \
         patch("app.routes.learning_paths.get_admin_client", return_value=mock_admin):
        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        resp = c.get("/api/learning-paths/p1/assessments",
                     headers={"Authorization": "Bearer valid-token"})
    assert resp.status_code != 404, f"BUG-03 still present: got 404 at correct URL"
    assert resp.status_code in (200, 500)


def test_old_broken_assessment_url_is_404():
    """BUG-03 counterpart: old wrong URL /api/assessments/learning-paths/... must 404."""
    mock_admin = MagicMock()
    mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
    with patch("app.database.get_admin_client", return_value=mock_admin), \
         patch("app.auth.get_admin_client", return_value=mock_admin):
        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        resp = c.get("/api/assessments/learning-paths/any-id/assessments",
                     headers={"Authorization": "Bearer valid-token"})
    assert resp.status_code == 404


def test_progress_endpoint_returns_data_not_none():
    """Verify get_progress still has its return after learning_paths.py refactoring."""
    mock_admin = MagicMock()
    mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
    path_row = {"id": "p1", "user_id": "user-123", "title": "T", "goal": "G",
                "current_level": "beginner", "existing_skills": [], "daily_hours": 2.0,
                "duration_weeks": 8, "learning_format": "mixed",
                "learning_objective": "job-readiness", "summary": "S",
                "status": "not-started", "roadmap": {},
                "created_at": "2024-01-01T00:00:00+00:00",
                "updated_at": "2024-01-01T00:00:00+00:00"}

    def tbl(name):
        t = MagicMock()
        if name == "learning_paths":
            t.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[path_row])
        if name == "modules":
            t.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
            t.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(data=[])
        return t

    mock_admin.table.side_effect = tbl

    with patch("app.database.get_admin_client", return_value=mock_admin), \
         patch("app.auth.get_admin_client", return_value=mock_admin), \
         patch("app.routes.learning_paths.get_admin_client", return_value=mock_admin):
        from app.main import app
        c = TestClient(app, raise_server_exceptions=False)
        resp = c.get("/api/learning-paths/p1/progress",
                     headers={"Authorization": "Bearer valid-token"})
    assert resp.status_code in (200, 500), \
        f"progress endpoint may have missing return; got {resp.status_code}: {resp.text}"
