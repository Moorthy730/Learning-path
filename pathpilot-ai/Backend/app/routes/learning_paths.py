"""
routes/learning_paths.py — CRUD + AI generation endpoints for learning paths.
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Query

from app.auth import CurrentUserId
from app.database import get_admin_client
from app.schemas import (
    GeneratePathRequest,
    LearningPathResponse,
    LearningPathSummary,
    UpdatePathRequest,
    RevisePathRequest,
    PathProgress,
    AssessmentResult,
)
from app.services import roadmap_service
from app.services.progress_service import get_path_progress
from app.exceptions import DatabaseError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/learning-paths", tags=["learning-paths"])


@router.post("/generate", response_model=LearningPathResponse, status_code=201)
async def generate_learning_path(
    body: GeneratePathRequest,
    user_id: CurrentUserId,
) -> LearningPathResponse:
    """
    Generate a personalized learning roadmap using Gemini AI and persist it.
    Rate limiting is handled by SlowAPI middleware in main.py.
    """
    db = get_admin_client()
    return await roadmap_service.create_learning_path(user_id, body, db)


@router.get("", response_model=list[LearningPathSummary])
async def list_paths(
    user_id: CurrentUserId,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[LearningPathSummary]:
    """Return all learning paths for the authenticated user with pagination."""
    db = get_admin_client()
    return await roadmap_service.list_learning_paths(user_id, db, skip=skip, limit=limit)


@router.get("/{path_id}", response_model=LearningPathResponse)
async def get_path(
    path_id: str,
    user_id: CurrentUserId,
) -> LearningPathResponse:
    """Return a single learning path with all modules, lessons, and progress."""
    db = get_admin_client()
    return await roadmap_service.get_learning_path(path_id, user_id, db)


@router.patch("/{path_id}", response_model=LearningPathResponse)
async def update_path(
    path_id: str,
    body: UpdatePathRequest,
    user_id: CurrentUserId,
) -> LearningPathResponse:
    """Update editable metadata (title, status) for a learning path."""
    db = get_admin_client()
    updates = body.model_dump(exclude_none=True)
    return await roadmap_service.update_learning_path(path_id, user_id, updates, db)


@router.post("/{path_id}/revise", response_model=LearningPathResponse)
async def revise_path(
    path_id: str,
    body: RevisePathRequest,
    user_id: CurrentUserId,
) -> LearningPathResponse:
    """
    Generate a revised roadmap with updated parameters.
    Completed lessons are preserved where titles match.
    """
    db = get_admin_client()
    return await roadmap_service.revise_learning_path(path_id, user_id, body, db)


@router.delete("/{path_id}", status_code=204, response_model=None)
async def delete_path(
    path_id: str,
    user_id: CurrentUserId,
) -> None:
    """Delete a learning path and all its modules, lessons, and assessments."""
    db = get_admin_client()
    await roadmap_service.delete_learning_path(path_id, user_id, db)
    return None


@router.get("/{path_id}/progress", response_model=PathProgress)
async def get_progress(
    path_id: str,
    user_id: CurrentUserId,
) -> PathProgress:
    """Return detailed progress statistics for a learning path."""
    db = get_admin_client()
    # Verify ownership first
    await roadmap_service.get_learning_path(path_id, user_id, db)
    return await get_path_progress(path_id, user_id, db)

@router.get("/{path_id}/assessments", response_model=list[AssessmentResult])
async def get_path_assessments(
    path_id: str,
    user_id: CurrentUserId,
) -> list[AssessmentResult]:
    """Return the authenticated user's assessment history for a path."""
    db = get_admin_client()

    # Verify ownership first
    await roadmap_service.get_learning_path(path_id, user_id, db)

    try:
        res = (
            db.table("assessments")
            .select("*")
            .eq("path_id", path_id)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as e:
        logger.error("DB error fetching assessments: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve assessment history")

    results = []
    for row in (res.data or []):
        total = row["total_questions"] or 1
        results.append(AssessmentResult(
            id=row["id"],
            score=row["score"],
            total_questions=total,
            percentage=round((row["score"] / total) * 100, 1),
            passed=round((row["score"] / total) * 100, 1) >= 70.0,
            created_at=row["created_at"],
        ))
    return results
