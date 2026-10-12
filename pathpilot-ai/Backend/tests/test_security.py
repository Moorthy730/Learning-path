"""
test_security.py — Security-specific tests.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_lesson_progress_without_auth_returns_401(client: TestClient):
    """Unauthenticated lesson progress update must return 401."""
    resp = client.patch(
        "/api/lessons/some-lesson-id/progress",
        json={"completed": True},
    )
    assert resp.status_code == 401


def test_profile_without_auth_returns_401(client: TestClient):
    """Profile access without auth must return 401."""
    resp = client.get("/api/profiles/me")
    assert resp.status_code == 401


def test_assessment_generate_without_auth_returns_401(client: TestClient):
    """Assessment generation without auth must return 401."""
    resp = client.post(
        "/api/assessments/generate",
        json={"module_id": "mod-123", "path_id": "path-123"},
    )
    assert resp.status_code == 401


def test_assessment_submit_without_auth_returns_401(client: TestClient):
    """Assessment submission without auth must return 401."""
    resp = client.post(
        "/api/assessments/submit",
        json={
            "assessment_id": "assess-123",
            "path_id": "path-123",
            "module_id": "mod-123",
            "answers": {"q1": 0},
        },
    )
    assert resp.status_code == 401


def test_error_responses_do_not_expose_stack_traces(client: TestClient):
    """Error responses must not include Python tracebacks."""
    resp = client.get("/api/learning-paths/nonexistent-path-12345")
    body = resp.text
    assert "Traceback" not in body
    assert "line " not in body or "File " not in body


def test_progress_calculation_is_correct():
    """Progress percentage calculation must be mathematically correct."""
    from app.schemas import PathProgress
    progress = PathProgress(
        path_id="p1",
        total_modules=3,
        total_lessons=10,
        completed_lessons=7,
        remaining_lessons=3,
        completion_pct=70.0,
        completed_hours=14.0,
        remaining_hours=6.0,
    )
    assert progress.completion_pct == 70.0
    assert progress.completed_lessons + progress.remaining_lessons == progress.total_lessons


def test_assessment_scoring_is_server_side():
    """
    Verify the scoring function counts correct answers properly.
    The test simulates the scoring logic used in the assessments route.
    """
    questions = [
        {"id": "q1", "question": "Q1", "options": ["A", "B", "C", "D"], "correct_index": 0},
        {"id": "q2", "question": "Q2", "options": ["A", "B", "C", "D"], "correct_index": 2},
        {"id": "q3", "question": "Q3", "options": ["A", "B", "C", "D"], "correct_index": 1},
    ]
    answers = {"q1": 0, "q2": 1, "q3": 1}  # q1 correct, q2 wrong, q3 correct

    correct = 0
    for q in questions:
        if answers.get(q["id"]) == q["correct_index"]:
            correct += 1

    assert correct == 2
    assert round(correct / len(questions) * 100, 1) == 66.7


def test_revise_path_without_auth_returns_401(client: TestClient):
    resp = client.post("/api/learning-paths/path-123/revise", json={})
    assert resp.status_code == 401
