"""
test_auth.py — Authentication and authorization tests.
"""
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient


def test_missing_auth_header_returns_401(client: TestClient):
    """Protected endpoints must reject requests with no Authorization header."""
    resp = client.get("/api/learning-paths")
    assert resp.status_code == 401


def test_invalid_bearer_format_returns_401(client: TestClient):
    """Malformed Authorization header must be rejected."""
    resp = client.get("/api/learning-paths", headers={"Authorization": "Token abc123"})
    assert resp.status_code == 401


def test_empty_token_returns_401(client: TestClient):
    """Empty Bearer token must be rejected."""
    resp = client.get("/api/learning-paths", headers={"Authorization": "Bearer "})
    assert resp.status_code == 401


def test_invalid_token_returns_401(client: TestClient, monkeypatch):
    """Token that fails Supabase verification must return 401."""
    mock_admin = MagicMock()
    mock_admin.auth.get_user.return_value = MagicMock(user=None)
    monkeypatch.setattr("app.database.get_admin_client", lambda: mock_admin)
    monkeypatch.setattr("app.auth.get_admin_client", lambda: mock_admin)

    from app.main import app
    from fastapi.testclient import TestClient
    test_client = TestClient(app, raise_server_exceptions=False)
    resp = test_client.get(
        "/api/learning-paths",
        headers={"Authorization": "Bearer invalid-token-xyz"},
    )
    assert resp.status_code == 401


def test_valid_token_accepted(client: TestClient, auth_headers, monkeypatch):
    """Valid token returns non-401 (actual result depends on DB mock)."""
    mock_admin = MagicMock()
    mock_admin.auth.get_user.return_value = MagicMock(user=MagicMock(id="user-123"))
    mock_admin.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value.data = []
    monkeypatch.setattr("app.database.get_admin_client", lambda: mock_admin)
    monkeypatch.setattr("app.auth.get_admin_client", lambda: mock_admin)

    from app.main import app
    from fastapi.testclient import TestClient
    test_client = TestClient(app, raise_server_exceptions=False)
    resp = test_client.get("/api/learning-paths", headers=auth_headers)
    # Should not be 401 (may be 200 with empty list or 500 if DB mock incomplete)
    assert resp.status_code != 401


def test_unauthenticated_cannot_generate_path(client: TestClient, valid_generate_payload):
    """Unauthenticated users must not be able to generate learning paths."""
    resp = client.post("/api/learning-paths/generate", json=valid_generate_payload)
    assert resp.status_code == 401


def test_unauthenticated_cannot_access_profiles(client: TestClient):
    """Unauthenticated users must not access profile endpoints."""
    resp = client.get("/api/profiles/me")
    assert resp.status_code == 401
