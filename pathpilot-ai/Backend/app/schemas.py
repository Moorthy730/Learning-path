"""
schemas.py — All Pydantic request/response models for PathPilot AI API.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator


# ─── Enums ────────────────────────────────────────────────────────────────────
class SkillLevel(str):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


# ─── Lesson schemas ───────────────────────────────────────────────────────────
class LessonAI(BaseModel):
    """Lesson as returned by the Gemini AI model."""
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=1000)
    estimated_hours: float = Field(..., gt=0, le=40)
    resource_url: Optional[str] = Field(None, max_length=500)
    completion_criteria: str = Field(..., min_length=5, max_length=500)


class LessonDB(BaseModel):
    """Lesson as stored in and retrieved from Supabase."""
    id: str
    module_id: str
    title: str
    description: str
    estimated_hours: float
    resource_url: Optional[str] = None
    completion_criteria: str
    order_index: int
    completed: bool = False
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LessonProgressUpdate(BaseModel):
    completed: bool


class LessonProgressResponse(BaseModel):
    lesson_id: str
    completed: bool
    completed_at: Optional[datetime]
    path_progress: "PathProgress"


# ─── Module schemas ───────────────────────────────────────────────────────────
class ModuleAI(BaseModel):
    """Module as returned by Gemini."""
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=1000)
    order_index: int = Field(..., ge=1)
    estimated_hours: float = Field(..., gt=0, le=500)
    lessons: list[LessonAI] = Field(..., min_length=1, max_length=20)
    project: Optional[str] = Field(None, max_length=500)

    @field_validator("lessons")
    @classmethod
    def validate_lessons(cls, v: list[LessonAI]) -> list[LessonAI]:
        if not v:
            raise ValueError("Each module must have at least one lesson")
        return v


class ModuleDB(BaseModel):
    """Module with its lessons as stored/retrieved from Supabase."""
    id: str
    path_id: str
    title: str
    description: str
    order_index: int
    estimated_hours: float
    project: Optional[str] = None
    lessons: list[LessonDB] = []
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Learning Path schemas ────────────────────────────────────────────────────
class GeneratePathRequest(BaseModel):
    career_goal: str = Field(..., min_length=3, max_length=200)
    skill_level: str = Field(..., pattern="^(beginner|intermediate|advanced)$")
    existing_skills: list[str] = Field(default_factory=list, max_length=30)
    daily_hours: float = Field(..., gt=0, le=12)
    duration_weeks: int = Field(..., ge=1, le=104)
    learning_format: str = Field(
        default="mixed",
        pattern="^(video|articles|hands-on|mixed)$",
    )
    learning_objective: str = Field(
        default="job-readiness",
        pattern="^(job-readiness|academic|career-change|personal)$",
    )

    @field_validator("existing_skills")
    @classmethod
    def validate_skills(cls, v: list[str]) -> list[str]:
        return [s.strip()[:100] for s in v if s.strip()]


class AIRoadmapResponse(BaseModel):
    """Structured response expected from the Gemini model."""
    title: str = Field(..., min_length=5, max_length=200)
    goal: str = Field(..., min_length=3, max_length=200)
    summary: str = Field(..., min_length=20, max_length=2000)
    duration_weeks: int = Field(..., ge=1, le=104)
    modules: list[ModuleAI] = Field(..., min_length=1, max_length=15)

    @field_validator("modules")
    @classmethod
    def validate_modules(cls, v: list[ModuleAI]) -> list[ModuleAI]:
        if not v:
            raise ValueError("Roadmap must contain at least one module")
        order_indices = [m.order_index for m in v]
        if len(set(order_indices)) != len(order_indices):
            raise ValueError("Module order_index values must be unique")
        return sorted(v, key=lambda m: m.order_index)


class LearningPathResponse(BaseModel):
    """Full learning path with modules and lessons returned to the client."""
    id: str
    user_id: str
    title: str
    goal: str
    current_level: str
    existing_skills: list[str]
    daily_hours: float
    duration_weeks: int
    learning_format: str
    learning_objective: str
    summary: str
    status: str
    modules: list[ModuleDB] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LearningPathSummary(BaseModel):
    """Lightweight path summary for the list endpoint."""
    id: str
    title: str
    goal: str
    current_level: str
    status: str
    duration_weeks: int
    total_lessons: int
    completed_lessons: int
    completion_pct: float
    created_at: datetime
    updated_at: datetime


class UpdatePathRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    status: Optional[str] = Field(
        None, pattern="^(not-started|in-progress|completed|paused)$"
    )


class RevisePathRequest(BaseModel):
    """Request to regenerate a path with updated parameters."""
    skill_level: Optional[str] = Field(
        None, pattern="^(beginner|intermediate|advanced)$"
    )
    existing_skills: Optional[list[str]] = None
    daily_hours: Optional[float] = Field(None, gt=0, le=12)
    duration_weeks: Optional[int] = Field(None, ge=1, le=104)
    learning_format: Optional[str] = Field(
        None, pattern="^(video|articles|hands-on|mixed)$"
    )
    notes: Optional[str] = Field(None, max_length=1000)


# ─── Progress schemas ─────────────────────────────────────────────────────────
class PathProgress(BaseModel):
    path_id: str
    total_modules: int
    total_lessons: int
    completed_lessons: int
    remaining_lessons: int
    completion_pct: float
    completed_hours: float
    remaining_hours: float


# ─── Assessment schemas ───────────────────────────────────────────────────────
class AssessmentQuestion(BaseModel):
    id: str
    question: str
    options: list[str] = Field(..., min_length=2, max_length=6)
    correct_index: int  # Only stored server-side, never sent to client


class AssessmentForClient(BaseModel):
    """Assessment questions without answers — safe to send to frontend."""
    assessment_id: str
    module_id: str
    questions: list[dict[str, Any]]  # {id, question, options} — no correct_index


class GenerateAssessmentRequest(BaseModel):
    module_id: str
    path_id: str


class SubmitAssessmentRequest(BaseModel):
    assessment_id: str
    path_id: str
    module_id: str
    answers: dict[str, int]  # {question_id: selected_option_index}


class AssessmentResult(BaseModel):
    id: str
    score: int
    total_questions: int
    percentage: float
    passed: bool
    created_at: datetime


# ─── Profile schemas ──────────────────────────────────────────────────────────
class ProfileResponse(BaseModel):
    id: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=100)


# ─── Health schemas ───────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"


class ReadyResponse(BaseModel):
    status: str
    database: str
    ai_configured: bool
