"""
routes/daily_tasks.py — Daily task checklist endpoints.

Tasks are created automatically when a learning path is generated (derived from lessons)
and can also be created manually. Users mark tasks complete here.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timezone

from fastapi import APIRouter, Query

from app.auth import CurrentUserId
from app.database import get_admin_client
from app.exceptions import DatabaseError, NotFoundError, ForbiddenError
from app.schemas_reminders import (
    DailyTaskResponse,
    DailyTaskListResponse,
    CreateDailyTaskRequest,
    UpdateDailyTaskRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/daily-tasks", tags=["daily-tasks"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _today() -> str:
    return date.today().isoformat()


def _row_to_task(row: dict) -> DailyTaskResponse:
    return DailyTaskResponse(
        id=row["id"],
        user_id=row["user_id"],
        path_id=row["path_id"],
        lesson_id=row.get("lesson_id"),
        task_type=row["task_type"],
        title=row["title"],
        scheduled_date=row["scheduled_date"],
        completed=row["completed"],
        completed_at=row.get("completed_at"),
        overdue=row.get("overdue", False),
        snoozed_until=row.get("snoozed_until"),
        created_at=row["created_at"],
    )


@router.get("", response_model=DailyTaskListResponse)
async def list_daily_tasks(
    user_id: CurrentUserId,
    target_date: str = Query(default=None, description="ISO date YYYY-MM-DD (defaults to today)"),
) -> DailyTaskListResponse:
    """
    Return today's tasks split by status: today, pending (future), overdue, completed_today.
    """
    db = get_admin_client()
    today = target_date or _today()

    try:
        # Mark any tasks past their date as overdue (server-side cleanup)
        db.table("daily_tasks").update({"overdue": True}).eq(
            "user_id", user_id
        ).lt("scheduled_date", today).eq("completed", False).eq("overdue", False).execute()

        res = (
            db.table("daily_tasks")
            .select("*")
            .eq("user_id", user_id)
            .order("scheduled_date")
            .order("created_at")
            .execute()
        )
    except Exception as e:
        logger.error("DB error fetching daily tasks: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve tasks")

    all_tasks = [_row_to_task(r) for r in (res.data or [])]
    today_date = date.fromisoformat(today)

    today_tasks = [
        t for t in all_tasks
        if t.scheduled_date == today_date and not t.completed and not t.overdue
    ]
    completed_today = [
        t for t in all_tasks
        if t.scheduled_date == today_date and t.completed
    ]
    overdue_tasks = [t for t in all_tasks if t.overdue]
    pending_tasks = [
        t for t in all_tasks
        if t.scheduled_date > today_date and not t.completed
    ]

    return DailyTaskListResponse(
        today=today_tasks,
        pending=pending_tasks,
        overdue=overdue_tasks,
        completed_today=completed_today,
    )


@router.post("", response_model=DailyTaskResponse, status_code=201)
async def create_daily_task(
    body: CreateDailyTaskRequest,
    user_id: CurrentUserId,
) -> DailyTaskResponse:
    """Manually create a daily task (e.g. review or custom entry)."""
    db = get_admin_client()

    import uuid
    task_id = str(uuid.uuid4())
    now = _now()
    today = _today()

    row = {
        "id": task_id,
        "user_id": user_id,
        "path_id": body.path_id,
        "lesson_id": body.lesson_id,
        "task_type": body.task_type,
        "title": body.title,
        "scheduled_date": body.scheduled_date.isoformat(),
        "completed": False,
        "overdue": body.scheduled_date.isoformat() < today,
        "created_at": now,
        "updated_at": now,
    }

    try:
        res = db.table("daily_tasks").insert(row).execute()
        created = res.data[0] if res.data else row
    except Exception as e:
        logger.error("DB error creating task: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to create task")

    return _row_to_task(created)


@router.patch("/{task_id}", response_model=DailyTaskResponse)
async def update_daily_task(
    task_id: str,
    body: UpdateDailyTaskRequest,
    user_id: CurrentUserId,
) -> DailyTaskResponse:
    """Mark a task complete/incomplete or snooze it."""
    db = get_admin_client()

    # Verify ownership
    try:
        existing = (
            db.table("daily_tasks")
            .select("*")
            .eq("id", task_id)
            .execute()
        )
    except Exception as e:
        logger.error("DB error fetching task: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve task")

    if not existing.data:
        raise NotFoundError("Task")

    task_row = existing.data[0]
    if task_row["user_id"] != user_id:
        raise ForbiddenError("You do not have access to this task")

    updates: dict = {"updated_at": _now()}
    if body.completed is not None:
        updates["completed"] = body.completed
        updates["completed_at"] = _now() if body.completed else None
        if body.completed:
            updates["overdue"] = False  # completion clears overdue flag
    if body.snoozed_until is not None:
        updates["snoozed_until"] = body.snoozed_until.isoformat()
        updates["scheduled_date"] = body.snoozed_until.isoformat()
        updates["overdue"] = False

    try:
        db.table("daily_tasks").update(updates).eq("id", task_id).execute()
    except Exception as e:
        logger.error("DB error updating task: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to update task")

    # Return updated row
    updated = dict(task_row, **updates)
    return _row_to_task(updated)


@router.delete("/{task_id}", status_code=204, response_model=None)
async def delete_daily_task(task_id: str, user_id: CurrentUserId) -> None:
    """Delete a manually created task."""
    db = get_admin_client()

    try:
        existing = db.table("daily_tasks").select("user_id").eq("id", task_id).execute()
    except Exception:
        raise DatabaseError("Failed to retrieve task")

    if not existing.data:
        raise NotFoundError("Task")
    if existing.data[0]["user_id"] != user_id:
        raise ForbiddenError("You do not have access to this task")

    try:
        db.table("daily_tasks").delete().eq("id", task_id).execute()
    except Exception as e:
        logger.error("DB error deleting task: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to delete task")
