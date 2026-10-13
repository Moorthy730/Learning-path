"""
routes/assessments.py — Knowledge checkpoint generation and scoring.

Security note: The correct_index field is NEVER sent to the client.
Scoring is always done server-side to prevent client-side tampering.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter

from app.auth import CurrentUserId
from app.database import get_admin_client
from app.schemas import (
    GenerateAssessmentRequest,
    SubmitAssessmentRequest,
    AssessmentForClient,
    AssessmentResult,
)
from app.ai.gemini_service import generate_assessment_questions
from app.exceptions import NotFoundError, DatabaseError, ForbiddenError, ValidationError
from app.services.roadmap_service import get_learning_path

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/assessments", tags=["assessments"])

# In-memory store for pending assessments (production: use Redis or DB)
# Maps assessment_id -> list of questions (with correct_index)
_pending_assessments: dict[str, dict] = {}


@router.post("/generate", response_model=AssessmentForClient)
async def generate_assessment(
    body: GenerateAssessmentRequest,
    user_id: CurrentUserId,
) -> AssessmentForClient:
    """
    Generate a multiple-choice knowledge assessment for a module.
    Returns questions WITHOUT correct answers to the client.
    Correct answers stored server-side for scoring.
    """
    db = get_admin_client()

    # Verify path ownership
    path = await get_learning_path(body.path_id, user_id, db)

    # Fetch module
    try:
        mod_res = (
            db.table("modules")
            .select("*, lessons(title)")
            .eq("id", body.module_id)
            .eq("path_id", body.path_id)
            .execute()
        )
    except Exception as e:
        logger.error("DB error fetching module for assessment: %s", type(e).__name__)
        raise DatabaseError("Failed to retrieve module")

    if not mod_res.data:
        raise NotFoundError("Module")

    module = mod_res.data[0]
    lesson_titles = [l["title"] for l in (module.get("lessons") or [])]

    # Generate questions via AI
    questions = await generate_assessment_questions(
        module_title=module["title"],
        lessons=lesson_titles,
        difficulty=path.current_level,
    )

    assessment_id = str(uuid.uuid4())

    # Store with answers server-side (never sent to client)
    _pending_assessments[assessment_id] = {
        "user_id": user_id,
        "path_id": body.path_id,
        "module_id": body.module_id,
        "questions": questions,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    # Return questions WITHOUT correct_index
    safe_questions = [
        {"id": q["id"], "question": q["question"], "options": q["options"]}
        for q in questions
    ]

    return AssessmentForClient(
        assessment_id=assessment_id,
        module_id=body.module_id,
        questions=safe_questions,
    )


@router.post("/submit", response_model=AssessmentResult)
async def submit_assessment(
    body: SubmitAssessmentRequest,
    user_id: CurrentUserId,
) -> AssessmentResult:
    """
    Score a submitted assessment server-side.
    Never trusts a score calculated by the frontend.
    """
    pending = _pending_assessments.get(body.assessment_id)
    if not pending:
        raise ValidationError(
            "Assessment not found or expired. Please generate a new assessment."
        )

    # Verify the assessment belongs to this user
    if pending["user_id"] != user_id:
        raise ForbiddenError("This assessment does not belong to you")

    questions = pending["questions"]
    total = len(questions)
    correct = 0

    for q in questions:
        submitted = body.answers.get(q["id"])
        if submitted is not None and submitted == q["correct_index"]:
            correct += 1

    score_pct = round((correct / total * 100), 1) if total > 0 else 0.0
    passed = score_pct >= 70.0

    # Persist result
    db = get_admin_client()
    assessment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Store answers without correct_index in DB (privacy)
    try:
        db.table("assessments").insert({
            "id": assessment_id,
            "user_id": user_id,
            "path_id": body.path_id,
            "module_id": body.module_id,
            "score": correct,
            "total_questions": total,
            "answers": {k: v for k, v in body.answers.items()},
            "created_at": now,
        }).execute()
    except Exception as e:
        logger.error("DB error saving assessment: %s", type(e).__name__, exc_info=False)
        # Don't fail the response if DB save fails — return result anyway
        logger.warning("Assessment result could not be persisted")

    # Remove from pending store
    _pending_assessments.pop(body.assessment_id, None)

    return AssessmentResult(
        id=assessment_id,
        score=correct,
        total_questions=total,
        percentage=score_pct,
        passed=passed,
        created_at=datetime.fromisoformat(now),
    )



@router.get("/{assessment_id}", response_model=AssessmentResult)
async def get_assessment_result(
    assessment_id: str,
    user_id: CurrentUserId,
) -> AssessmentResult:
    """Return a single assessment result by ID."""
    db = get_admin_client()

    try:
        res = (
            db.table("assessments")
            .select("*")
            .eq("id", assessment_id)
            .eq("user_id", user_id)
            .execute()
        )
    except Exception as e:
        logger.error("DB error fetching assessment: %s", type(e).__name__, exc_info=False)
        raise DatabaseError("Failed to retrieve assessment")

    if not res.data:
        raise NotFoundError("Assessment")

    row = res.data[0]
    total = row["total_questions"] or 1
    return AssessmentResult(
        id=row["id"],
        score=row["score"],
        total_questions=total,
        percentage=round((row["score"] / total) * 100, 1),
        passed=round((row["score"] / total) * 100, 1) >= 70.0,
        created_at=row["created_at"],
    )
