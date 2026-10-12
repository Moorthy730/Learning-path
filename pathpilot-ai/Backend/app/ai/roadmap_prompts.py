"""
roadmap_prompts.py — Prompt templates for learning path generation.

Prompts are kept separate from the service so they can be tuned
without touching business logic.
"""
from __future__ import annotations

from app.schemas import GeneratePathRequest


def build_roadmap_prompt(req: GeneratePathRequest) -> str:
    """
    Construct the Gemini prompt for generating a personalized learning path.
    Existing skills are included as context but never executed.
    """
    skills_text = (
        ", ".join(req.existing_skills) if req.existing_skills else "none listed"
    )
    format_descriptions = {
        "video": "video courses and tutorials",
        "articles": "written articles, documentation, and text-based resources",
        "hands-on": "practical projects and hands-on exercises",
        "mixed": "a balanced mix of video, reading, and hands-on practice",
    }
    objective_descriptions = {
        "job-readiness": "getting hired as a professional in this field",
        "academic": "deep theoretical understanding for academic purposes",
        "career-change": "transitioning from a different field",
        "personal": "personal enrichment and skill development",
    }

    return f"""You are an expert learning path designer. Create a detailed, personalized learning roadmap.

LEARNER PROFILE:
- Career Goal: {req.career_goal}
- Current Skill Level: {req.skill_level}
- Existing Skills: {skills_text}
- Daily Study Time: {req.daily_hours} hours/day
- Target Duration: {req.duration_weeks} weeks
- Preferred Format: {format_descriptions.get(req.learning_format, req.learning_format)}
- Primary Objective: {objective_descriptions.get(req.learning_objective, req.learning_objective)}

REQUIREMENTS:
1. Design a curriculum that builds from the learner's current level ({req.skill_level}), skipping topics they already know.
2. Organize content into logical modules, each with 3-8 lessons.
3. Each lesson must have a concrete completion criterion (something the learner can DO to prove mastery).
4. Include at least one practical project per module.
5. Estimate realistic study hours for each lesson based on {req.daily_hours} hours/day capacity.
6. Total duration should be approximately {req.duration_weeks} weeks.
7. For resource_url fields: use null if you cannot cite a specific verified URL. Do NOT fabricate URLs.
8. Generate between 3 and 10 modules appropriate to the complexity of the goal.

Return ONLY a valid JSON object matching the required schema. Do not include markdown, code fences, or explanatory text.
"""


def build_assessment_prompt(module_title: str, lessons: list[str], difficulty: str) -> str:
    """Build a prompt for generating assessment questions for a module."""
    lesson_list = "\n".join(f"- {l}" for l in lessons)
    return f"""Create a knowledge assessment for the following learning module.

MODULE: {module_title}
DIFFICULTY: {difficulty}
LESSONS COVERED:
{lesson_list}

Generate exactly 5 multiple-choice questions that test comprehension and application of the topics above.

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- Exactly one option must be correct
- Questions should test understanding, not trivia
- Do NOT include the answer in the question text

Return ONLY a valid JSON array of objects. Each object must have:
- "id": unique string (e.g. "q1", "q2")
- "question": the question text
- "options": array of exactly 4 strings
- "correct_index": integer 0-3 (index of the correct option)

Do not include markdown, code fences, or any text outside the JSON array.
"""


def build_revision_prompt(original_goal: str, req: GeneratePathRequest, notes: str = "") -> str:
    """Build a prompt for revising an existing learning path."""
    skills_text = (
        ", ".join(req.existing_skills) if req.existing_skills else "none listed"
    )
    notes_section = f"\nLEARNER NOTES: {notes}" if notes else ""

    return f"""You are an expert learning path designer revising an existing curriculum.

ORIGINAL GOAL: {original_goal}
UPDATED LEARNER PROFILE:
- Skill Level: {req.skill_level}
- Current Skills: {skills_text}
- Daily Study Time: {req.daily_hours} hours/day
- Target Duration: {req.duration_weeks} weeks
- Preferred Format: {req.learning_format}
- Objective: {req.learning_objective}
{notes_section}

Regenerate a complete, revised learning roadmap that:
1. Reflects the learner's updated skills and availability
2. Focuses on gaps not yet covered
3. Maintains a logical progression
4. Meets the updated time constraints

Return ONLY a valid JSON object matching the required schema. Do not include markdown, code fences, or explanatory text.
"""
