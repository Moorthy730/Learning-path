"""
test_health.py — Health and readiness endpoint tests.
"""
import pytest
from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient):
    """GET /health must return 200 with status=ok."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_ready_returns_status(client: TestClient):
    """GET /ready should return a status field (degraded when DB unreachable in test)."""
    resp = client.get("/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "database" in data
    assert "ai_configured" in data


def test_cors_allows_configured_origin(client: TestClient):
    """OPTIONS preflight from allowed origin must return 200."""
    resp = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp.status_code in (200, 204)


def test_cors_allows_frontend_in_response_headers(client: TestClient):
    """Actual GET with configured origin must include CORS headers."""
    resp = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert resp.status_code == 200
    assert "access-control-allow-origin" in resp.headers
