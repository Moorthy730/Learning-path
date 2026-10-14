"""
tests/test_progress.py — Comprehensive tests for progress calculations and verification.
"""
from __future__ import annotations

import pytest
from unittest.mock import MagicMock
from app.services.progress_service import get_path_progress, toggle_lesson_progress
from app.exceptions import NotFoundError, ForbiddenError


@pytest.mark.asyncio
async def test_progress_with_no_modules():
    """A path with no modules must report 0% without errors."""
    mock_db = MagicMock()
    # modules query returns empty
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []

    progress = await get_path_progress("path-1", "user-123", mock_db)
    assert progress.total_modules == 0
    assert progress.completed_modules == 0
    assert progress.total_lessons == 0
    assert progress.completed_lessons == 0
    assert progress.remaining_lessons == 0
    assert progress.completion_pct == 0.0
    assert progress.completed_hours == 0.0


@pytest.mark.asyncio
async def test_new_path_initial_progress_is_strictly_zero():
    """A newly generated path with modules and uncompleted lessons must start with 0% progress."""
    mock_db = MagicMock()

    # Modules
    mock_mods_res = MagicMock(data=[
        {"id": "mod-1", "estimated_hours": 10.0},
        {"id": "mod-2", "estimated_hours": 10.0},
    ])
    # Lessons - none completed
    mock_les_res = MagicMock(data=[
        {"id": "les-1", "completed": False, "estimated_hours": 2.5, "module_id": "mod-1"},
        {"id": "les-2", "completed": False, "estimated_hours": 2.5, "module_id": "mod-1"},
        {"id": "les-3", "completed": False, "estimated_hours": 3.0, "module_id": "mod-2"},
        {"id": "les-4", "completed": False, "estimated_hours": 2.0, "module_id": "mod-2"},
    ])

    def table_router(name):
        mock_t = MagicMock()
        if name == "modules":
            mock_t.select.return_value.eq.return_value.execute.return_value = mock_mods_res
        elif name == "lessons":
            mock_t.select.return_value.in_.return_value.execute.return_value = mock_les_res
        return mock_t

    mock_db.table.side_effect = table_router

    progress = await get_path_progress("path-1", "user-123", mock_db)
    assert progress.total_modules == 2
    assert progress.completed_modules == 0
    assert progress.total_lessons == 4
    assert progress.completed_lessons == 0
    assert progress.remaining_lessons == 4
    assert progress.completion_pct == 0.0
    assert progress.completed_hours == 0.0
    assert progress.remaining_hours == 10.0


@pytest.mark.asyncio
async def test_progress_updates_on_lesson_completion():
    """Completing 1 lesson out of 4 updates counts and percentages correctly."""
    mock_db = MagicMock()

    mock_mods_res = MagicMock(data=[
        {"id": "mod-1", "estimated_hours": 5.0},
    ])
    # 1 of 4 completed
    mock_les_res = MagicMock(data=[
        {"id": "les-1", "completed": True, "estimated_hours": 2.0, "module_id": "mod-1"},
        {"id": "les-2", "completed": False, "estimated_hours": 2.0, "module_id": "mod-1"},
        {"id": "les-3", "completed": False, "estimated_hours": 2.0, "module_id": "mod-1"},
        {"id": "les-4", "completed": False, "estimated_hours": 2.0, "module_id": "mod-1"},
    ])

    def table_router(name):
        mock_t = MagicMock()
        if name == "modules":
            mock_t.select.return_value.eq.return_value.execute.return_value = mock_mods_res
        elif name == "lessons":
            mock_t.select.return_value.in_.return_value.execute.return_value = mock_les_res
        return mock_t

    mock_db.table.side_effect = table_router

    progress = await get_path_progress("path-1", "user-123", mock_db)
    assert progress.total_modules == 1
    assert progress.completed_modules == 0  # Not all lessons complete
    assert progress.total_lessons == 4
    assert progress.completed_lessons == 1
    assert progress.remaining_lessons == 3
    assert progress.completion_pct == 25.0
    assert progress.completed_hours == 2.0
    assert progress.remaining_hours == 6.0


@pytest.mark.asyncio
async def test_module_completed_when_all_lessons_done():
    """When all lessons in a module are completed, completed_modules increments."""
    mock_db = MagicMock()

    mock_mods_res = MagicMock(data=[
        {"id": "mod-1", "estimated_hours": 4.0},
        {"id": "mod-2", "estimated_hours": 4.0},
    ])
    # mod-1 all completed (2 of 2), mod-2 0 completed
    mock_les_res = MagicMock(data=[
        {"id": "les-1", "completed": True, "estimated_hours": 2.0, "module_id": "mod-1"},
        {"id": "les-2", "completed": True, "estimated_hours": 2.0, "module_id": "mod-1"},
        {"id": "les-3", "completed": False, "estimated_hours": 2.0, "module_id": "mod-2"},
        {"id": "les-4", "completed": False, "estimated_hours": 2.0, "module_id": "mod-2"},
    ])

    def table_router(name):
        mock_t = MagicMock()
        if name == "modules":
            mock_t.select.return_value.eq.return_value.execute.return_value = mock_mods_res
        elif name == "lessons":
            mock_t.select.return_value.in_.return_value.execute.return_value = mock_les_res
        return mock_t

    mock_db.table.side_effect = table_router

    progress = await get_path_progress("path-1", "user-123", mock_db)
    assert progress.total_modules == 2
    assert progress.completed_modules == 1  # mod-1 complete
    assert progress.completed_lessons == 2
    assert progress.completion_pct == 50.0


@pytest.mark.asyncio
async def test_user_cannot_update_other_users_lesson():
    """A user cannot mark another user's lesson complete."""
    mock_db = MagicMock()

    # Lesson belongs to user-other
    mock_lesson_res = MagicMock(data=[{
        "id": "les-1",
        "completed": False,
        "modules": {
            "path_id": "path-1",
            "learning_paths": {
                "user_id": "user-other"
            }
        }
    }])

    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_lesson_res

    with pytest.raises(ForbiddenError):
        await toggle_lesson_progress("les-1", "user-current", True, mock_db)
