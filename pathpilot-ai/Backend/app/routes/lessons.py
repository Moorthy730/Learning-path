"""
routes/lessons.py — Lesson progress endpoints.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.auth import CurrentUserId
from app.database import get_admin_client
from app.schemas import LessonProgressUpdate, LessonProgressResponse
from app.services.progress_service import toggle_lesson_progress

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


@router.patch("/{lesson_id}/progress", response_model=LessonProgressResponse)
async def update_lesson_progress(
    lesson_id: str,
    body: LessonProgressUpdate,
    user_id: CurrentUserId,
) -> LessonProgressResponse:
    """
    Mark a lesson as complete or incomplete.
    Ownership is verified through the lesson → module → path → user chain.
    Updates completed_at automatically and returns recalculated path progress.
    """
    db = get_admin_client()
    return await toggle_lesson_progress(lesson_id, user_id, body.completed, db)
