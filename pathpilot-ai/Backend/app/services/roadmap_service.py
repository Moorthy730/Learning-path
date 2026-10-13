"""
roadmap_service.py — Business logic for generating and persisting learning paths.

Flow:
  1. Call Gemini to get a structured AIRoadmapResponse.
  2. Persist the learning_path row.
  3. Persist each module row.
  4. Persist each lesson row.
  5. Return the full assembled path.

All DB operations use the user-scoped client so RLS is enforced.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from supabase import Client

from app.schemas import (
    AIRoadmapResponse,
    GeneratePathRequest,
    LearningPathResponse,
    LearningPathSummary,
    ModuleDB,
    LessonDB,
    PathProgress,
    RevisePathRequest,
)
from app.ai.gemini_service import generate_roadmap, generate_revised_roadmap
from app.exceptions import DatabaseError, NotFoundError, ForbiddenError

logger = logging.getLogger(__name__)


# ── helpers ───────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _assemble_path(path_row: dict, modules: list[dict], lessons: list[dict]) -> LearningPathResponse:
    """Combine flat DB rows into a nested LearningPathResponse."""
    lessons_by_module: dict[str, list[LessonDB]] = {}
    for l in lessons:
        mid = l["module_id"]
        if mid not in lessons_by_module:
            lessons_by_module[mid] = []
        lessons_by_module[mid].append(LessonDB(**l))

    module_objects = []
    for m in sorted(modules, key=lambda x: x.get("order_index", 0)):
        mod_lessons = sorted(
            lessons_by_module.get(m["id"], []),
            key=lambda x: x.order_index,
        )
        module_objects.append(
            ModuleDB(
                id=m["id"],
                path_id=m["path_id"],
                title=m["title"],
                description=m["description"],
                order_index=m["order_index"],
                estimated_hours=m["estimated_hours"],
                project=m.get("project"),
                lessons=mod_lessons,
                created_at=m["created_at"],
            )
        )

    return LearningPathResponse(
        id=path_row["id"],
        user_id=path_row["user_id"],
        title=path_row["title"],
        goal=path_row["goal"],
        current_level=path_row["current_level"],
        existing_skills=path_row.get("existing_skills") or [],
        daily_hours=path_row["daily_hours"],
        duration_weeks=path_row["duration_weeks"],
        learning_format=path_row["learning_format"],
        learning_objective=path_row["learning_objective"],
        summary=path_row["summary"],
        status=path_row["status"],
        modules=module_objects,
        created_at=path_row["created_at"],
        updated_at=path_row["updated_at"],
    )


# ── public service functions ─────────────────────────────────────────────────

async def create_learning_path(
    user_id: str,
    req: GeneratePathRequest,
    db: Client,
) -> LearningPathResponse:
    """Generate via Gemini and persist to Supabase."""

    # 1. AI generation
    ai_result: AIRoadmapResponse = await generate_roadmap(req)

    path_id = str(uuid.uuid4())
    now = _now()

    # 2. Insert learning_path row
    path_data = {
        "id": path_id,
        "user_id": user_id,
        "title": ai_result.title,
        "goal": ai_result.goal,
        "current_level": req.skill_level,
        "existing_skills": req.existing_skills,
        "daily_hours": req.daily_hours,
        "duration_weeks": ai_result.duration_weeks,
        "learning_format": req.learning_format,
        "learning_objective": req.learning_objective,
        "summary": ai_result.summary,
        "roadmap": {},  # raw AI JSON kept for reference
        "status": "not-started",
        "created_at": now,
        "updated_at": now,
    }

    try:
        path_res = db.table("learning_paths").insert(path_data).execute()
        if not path_res.data:
            raise DatabaseError("Failed to save learning path")
    except DatabaseError:
        raise
    except Exception as e:
        logger.error("DB error inserting path: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to save learning path to database")

    inserted_modules = []
    inserted_lessons = []

    # 3. Insert modules and lessons
    for module_ai in ai_result.modules:
        module_id = str(uuid.uuid4())
        module_data = {
            "id": module_id,
            "path_id": path_id,
            "title": module_ai.title,
            "description": module_ai.description,
            "order_index": module_ai.order_index,
            "estimated_hours": module_ai.estimated_hours,
            "project": module_ai.project,
            "created_at": now,
        }
        try:
            mod_res = db.table("modules").insert(module_data).execute()
            if not mod_res.data:
                raise DatabaseError(f"Failed to save module: {module_ai.title}")
            inserted_modules.append(module_data)
        except DatabaseError:
            raise
        except Exception as e:
            logger.error("DB error inserting module: %s", type(e).__name__, exc_info=False)
            raise DatabaseError(f"Failed to save module '{module_ai.title}'")

        for idx, lesson_ai in enumerate(module_ai.lessons, start=1):
            lesson_id = str(uuid.uuid4())
            lesson_data = {
                "id": lesson_id,
                "module_id": module_id,
                "title": lesson_ai.title,
                "description": lesson_ai.description,
                "estimated_hours": lesson_ai.estimated_hours,
                "resource_url": lesson_ai.resource_url,
                "completion_criteria": lesson_ai.completion_criteria,
                "order_index": idx,
                "completed": False,
                "completed_at": None,
                "created_at": now,
            }
            try:
                les_res = db.table("lessons").insert(lesson_data).execute()
                if not les_res.data:
                    raise DatabaseError(f"Failed to save lesson: {lesson_ai.title}")
                inserted_lessons.append(lesson_data)
            except DatabaseError:
                raise
            except Exception as e:
                logger.error("DB error inserting lesson: %s", type(e).__name__, exc_info=False)
                raise DatabaseError(f"Failed to save lesson '{lesson_ai.title}'")

    return _assemble_path(path_res.data[0], inserted_modules, inserted_lessons)


async def list_learning_paths(user_id: str, db: Client, skip: int = 0, limit: int = 20) -> list[LearningPathSummary]:
    """Return lightweight summaries of the user's paths."""
    try:
        res = (
            db.table("learning_paths")
            .select("id,title,goal,current_level,status,duration_weeks,created_at,updated_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(skip, skip + limit - 1)
            .execute()
        )
    except Exception as e:
        logger.error("DB error listing paths: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve learning paths")

    summaries = []
    for row in (res.data or []):
        # Count lessons via proper two-step join: path → modules → lessons
        try:
            mod_res = (
                db.table("modules")
                .select("id")
                .eq("path_id", row["id"])
                .execute()
            )
            mod_ids = [m["id"] for m in (mod_res.data or [])]

            if mod_ids:
                lesson_res = (
                    db.table("lessons")
                    .select("completed")
                    .in_("module_id", mod_ids)
                    .execute()
                )
                lessons_data = lesson_res.data or []
            else:
                lessons_data = []

            total = len(lessons_data)
            completed = sum(1 for l in lessons_data if l.get("completed"))
        except Exception:
            total = 0
            completed = 0

        pct = round((completed / total * 100), 1) if total > 0 else 0.0
        summaries.append(
            LearningPathSummary(
                id=row["id"],
                title=row["title"],
                goal=row["goal"],
                current_level=row["current_level"],
                status=row["status"],
                duration_weeks=row["duration_weeks"],
                total_lessons=total,
                completed_lessons=completed,
                completion_pct=pct,
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )
        )
    return summaries


async def get_learning_path(path_id: str, user_id: str, db: Client) -> LearningPathResponse:
    """Fetch a single path with all modules and lessons, enforcing ownership."""
    try:
        path_res = db.table("learning_paths").select("*").eq("id", path_id).execute()
    except Exception as e:
        logger.error("DB error fetching path: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve learning path")

    if not path_res.data:
        raise NotFoundError("Learning path")

    path_row = path_res.data[0]
    # Extra ownership check (RLS is primary, this is defence-in-depth)
    if path_row["user_id"] != user_id:
        raise ForbiddenError("You do not have access to this learning path")

    try:
        mods_res = (
            db.table("modules")
            .select("*")
            .eq("path_id", path_id)
            .order("order_index")
            .execute()
        )
        modules = mods_res.data or []

        module_ids = [m["id"] for m in modules]
        if module_ids:
            les_res = (
                db.table("lessons")
                .select("*")
                .in_("module_id", module_ids)
                .order("order_index")
                .execute()
            )
            lessons = les_res.data or []
        else:
            lessons = []
    except Exception as e:
        logger.error("DB error fetching modules/lessons: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve path content")

    return _assemble_path(path_row, modules, lessons)


async def update_learning_path(
    path_id: str,
    user_id: str,
    updates: dict,
    db: Client,
) -> LearningPathResponse:
    """Update allowed fields. Ownership enforced."""
    # Verify ownership first
    await get_learning_path(path_id, user_id, db)

    updates["updated_at"] = _now()
    try:
        db.table("learning_paths").update(updates).eq("id", path_id).execute()
    except Exception as e:
        logger.error("DB error updating path: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to update learning path")

    return await get_learning_path(path_id, user_id, db)


async def delete_learning_path(path_id: str, user_id: str, db: Client) -> None:
    """Delete a path and all dependent data (cascade handled by DB constraints)."""
    # Verify ownership before deletion
    await get_learning_path(path_id, user_id, db)

    try:
        db.table("learning_paths").delete().eq("id", path_id).execute()
    except Exception as e:
        logger.error("DB error deleting path: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to delete learning path")


async def revise_learning_path(
    path_id: str,
    user_id: str,
    req: RevisePathRequest,
    db: Client,
) -> LearningPathResponse:
    """Generate a revised roadmap, preserving completed lesson state."""
    existing = await get_learning_path(path_id, user_id, db)

    # Build a GeneratePathRequest merging existing + overrides
    gen_req = GeneratePathRequest(
        career_goal=existing.goal,
        skill_level=req.skill_level or existing.current_level,
        existing_skills=req.existing_skills or existing.existing_skills,
        daily_hours=req.daily_hours or existing.daily_hours,
        duration_weeks=req.duration_weeks or existing.duration_weeks,
        learning_format=req.learning_format or existing.learning_format,
        learning_objective=existing.learning_objective,
    )

    # Track which lesson titles were already completed
    completed_titles: set[str] = set()
    for mod in existing.modules:
        for lesson in mod.lessons:
            if lesson.completed:
                completed_titles.add(lesson.title.lower())

    ai_result = await generate_revised_roadmap(
        original_goal=existing.goal,
        req=gen_req,
        notes=req.notes or "",
    )

    now = _now()

    # Delete old modules/lessons (path row kept, roadmap updated)
    try:
        old_module_ids = [m.id for m in existing.modules]
        if old_module_ids:
            db.table("lessons").delete().in_("module_id", old_module_ids).execute()
            db.table("modules").delete().in_("id", old_module_ids).execute()
    except Exception as e:
        logger.error("DB error removing old modules: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to prepare path revision")

    inserted_modules = []
    inserted_lessons = []

    for module_ai in ai_result.modules:
        module_id = str(uuid.uuid4())
        module_data = {
            "id": module_id,
            "path_id": path_id,
            "title": module_ai.title,
            "description": module_ai.description,
            "order_index": module_ai.order_index,
            "estimated_hours": module_ai.estimated_hours,
            "project": module_ai.project,
            "created_at": now,
        }
        db.table("modules").insert(module_data).execute()
        inserted_modules.append(module_data)

        for idx, lesson_ai in enumerate(module_ai.lessons, start=1):
            was_completed = lesson_ai.title.lower() in completed_titles
            lesson_data = {
                "id": str(uuid.uuid4()),
                "module_id": module_id,
                "title": lesson_ai.title,
                "description": lesson_ai.description,
                "estimated_hours": lesson_ai.estimated_hours,
                "resource_url": lesson_ai.resource_url,
                "completion_criteria": lesson_ai.completion_criteria,
                "order_index": idx,
                "completed": was_completed,
                "completed_at": now if was_completed else None,
                "created_at": now,
            }
            db.table("lessons").insert(lesson_data).execute()
            inserted_lessons.append(lesson_data)

    # Update path metadata
    db.table("learning_paths").update({
        "title": ai_result.title,
        "summary": ai_result.summary,
        "duration_weeks": ai_result.duration_weeks,
        "current_level": gen_req.skill_level,
        "daily_hours": gen_req.daily_hours,
        "updated_at": now,
    }).eq("id", path_id).execute()

    return await get_learning_path(path_id, user_id, db)
