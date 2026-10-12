"""
progress_service.py — Lesson completion and path progress tracking.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from supabase import Client

from app.schemas import PathProgress, LessonProgressResponse
from app.exceptions import DatabaseError, NotFoundError, ForbiddenError

logger = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def toggle_lesson_progress(
    lesson_id: str,
    user_id: str,
    completed: bool,
    db: Client,
) -> LessonProgressResponse:
    """
    Mark a lesson complete or incomplete.
    Verifies the lesson belongs to the authenticated user before updating.
    """
    # Fetch the lesson and verify ownership through the join chain:
    # lessons → modules → learning_paths → user_id
    try:
        lesson_res = (
            db.table("lessons")
            .select("*, modules!inner(path_id, learning_paths!inner(user_id))")
            .eq("id", lesson_id)
            .execute()
        )
    except Exception as e:
        logger.error("DB error fetching lesson for progress: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve lesson")

    if not lesson_res.data:
        raise NotFoundError("Lesson")

    lesson_row = lesson_res.data[0]

    # Verify ownership
    try:
        path_user_id = lesson_row["modules"]["learning_paths"]["user_id"]
    except (KeyError, TypeError):
        raise ForbiddenError("Access denied")

    if path_user_id != user_id:
        raise ForbiddenError("You do not have access to this lesson")

    # Update completion
    update_data = {
        "completed": completed,
        "completed_at": _now() if completed else None,
    }

    try:
        db.table("lessons").update(update_data).eq("id", lesson_id).execute()
    except Exception as e:
        logger.error("DB error updating lesson progress: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to update lesson progress")

    # Recalculate path progress
    path_id = lesson_row["modules"]["path_id"]
    progress = await get_path_progress(path_id, user_id, db)

    return LessonProgressResponse(
        lesson_id=lesson_id,
        completed=completed,
        completed_at=datetime.fromisoformat(update_data["completed_at"]) if completed else None,
        path_progress=progress,
    )


async def get_path_progress(path_id: str, user_id: str, db: Client) -> PathProgress:
    """
    Calculate up-to-date progress stats for a learning path.
    """
    try:
        # Get all modules for this path
        mods_res = (
            db.table("modules")
            .select("id,estimated_hours")
            .eq("path_id", path_id)
            .execute()
        )
        modules = mods_res.data or []
        module_ids = [m["id"] for m in modules]

        if not module_ids:
            return PathProgress(
                path_id=path_id,
                total_modules=0,
                total_lessons=0,
                completed_lessons=0,
                remaining_lessons=0,
                completion_pct=0.0,
                completed_hours=0.0,
                remaining_hours=0.0,
            )

        les_res = (
            db.table("lessons")
            .select("id,completed,estimated_hours,module_id")
            .in_("module_id", module_ids)
            .execute()
        )
        lessons = les_res.data or []

    except Exception as e:
        logger.error("DB error computing progress: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to compute path progress")

    total_lessons = len(lessons)
    completed_lessons = sum(1 for l in lessons if l.get("completed"))
    remaining_lessons = total_lessons - completed_lessons
    completion_pct = round((completed_lessons / total_lessons * 100), 1) if total_lessons > 0 else 0.0
    completed_hours = sum(l.get("estimated_hours", 0) for l in lessons if l.get("completed"))
    remaining_hours = sum(l.get("estimated_hours", 0) for l in lessons if not l.get("completed"))

    return PathProgress(
        path_id=path_id,
        total_modules=len(modules),
        total_lessons=total_lessons,
        completed_lessons=completed_lessons,
        remaining_lessons=remaining_lessons,
        completion_pct=completion_pct,
        completed_hours=round(completed_hours, 1),
        remaining_hours=round(remaining_hours, 1),
    )
