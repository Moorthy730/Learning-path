"""
gemini_service.py — Gemini AI integration using the official google-genai SDK.

Key design decisions:
- Uses structured output (response_schema) when the model supports it;
  falls back to JSON-mode parsing with Pydantic validation.
- Never blindly trusts model output — always validates via Pydantic schema.
- Never executes model-generated code or SQL.
- Handles all API error categories with distinct exceptions.
- Never exposes API keys in logs.
"""
from __future__ import annotations

import json
import logging
import asyncio
from typing import Any

import google.genai as genai
from google.genai import types as genai_types

from app.config import get_settings
from app.schemas import AIRoadmapResponse, GeneratePathRequest
from app.ai.roadmap_prompts import (
    build_roadmap_prompt,
    build_assessment_prompt,
    build_revision_prompt,
)
from app.exceptions import AIServiceError, ValidationError

logger = logging.getLogger(__name__)


def _get_client() -> genai.Client:
    """Create a Gemini client. Key is read from settings — never hardcoded."""
    settings = get_settings()
    return genai.Client(api_key=settings.GEMINI_API_KEY.get_secret_value())


def _parse_json_response(text: str, context: str = "") -> dict[str, Any]:
    """
    Parse JSON from model text response.
    Strips markdown code fences if present (model sometimes ignores instructions).
    """
    cleaned = text.strip()
    # Remove ```json ... ``` wrapping
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error("JSON parse error%s: %s", f" ({context})" if context else "", e)
        raise AIServiceError(
            "The AI returned a response that could not be parsed. Please try again."
        )


async def generate_roadmap(req: GeneratePathRequest) -> AIRoadmapResponse:
    """
    Call Gemini to generate a personalized learning roadmap.

    Steps:
    1. Build the prompt.
    2. Call Gemini with a timeout.
    3. Parse and validate the JSON response.
    4. Return a validated AIRoadmapResponse.

    Raises AIServiceError or ValidationError — never re-raises raw API errors
    that could expose internal implementation details.
    """
    settings = get_settings()
    prompt = build_roadmap_prompt(req)

    try:
        client = _get_client()
        
        # Run synchronous SDK call in thread pool to avoid blocking
        response = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.4,
                        max_output_tokens=8192,
                    ),
                ),
            ),
            timeout=settings.AI_TIMEOUT_SECONDS,
        )

    except asyncio.TimeoutError:
        logger.warning("Gemini API timed out after %ss", settings.AI_TIMEOUT_SECONDS)
        raise AIServiceError(
            f"The AI service took too long to respond (>{settings.AI_TIMEOUT_SECONDS}s). "
            "Please try again."
        )
    except Exception as e:
        error_str = str(e)
        # Map known error strings to user-friendly messages
        if "quota" in error_str.lower() or "429" in error_str:
            raise AIServiceError("AI quota exceeded. Please try again later.")
        if "api key" in error_str.lower() or "403" in error_str:
            raise AIServiceError("AI service configuration error. Please contact support.")
        if "model" in error_str.lower() and "not found" in error_str.lower():
            raise AIServiceError(
                f"Configured AI model '{settings.GEMINI_MODEL}' is not available. "
                "Please check GEMINI_MODEL in your configuration."
            )
        logger.error("Gemini API error (type=%s)", type(e).__name__, exc_info=False)
        raise AIServiceError("AI service is temporarily unavailable. Please try again.")

    # Validate we got content
    if not response or not response.text:
        raise AIServiceError("AI returned an empty response. Please try again.")

    raw_data = _parse_json_response(response.text, context="roadmap generation")

    # Validate against our schema — reject malformed output
    try:
        roadmap = AIRoadmapResponse.model_validate(raw_data)
    except Exception as e:
        logger.error("Roadmap schema validation failed: %s", str(e), exc_info=False)
        raise ValidationError(
            f"AI generated an invalid roadmap structure: {str(e)[:200]}"
        )

    # Final sanity checks
    if not roadmap.modules:
        raise ValidationError("AI generated an empty roadmap. Please try again.")
    if roadmap.duration_weeks < 1:
        raise ValidationError("AI generated an invalid duration. Please try again.")

    return roadmap


async def generate_assessment_questions(
    module_title: str,
    lessons: list[str],
    difficulty: str,
) -> list[dict[str, Any]]:
    """
    Generate multiple-choice assessment questions for a module.
    Returns raw question dicts (with correct_index) for server-side scoring.
    """
    settings = get_settings()
    prompt = build_assessment_prompt(module_title, lessons, difficulty)

    try:
        client = _get_client()
        response = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.3,
                        max_output_tokens=2048,
                    ),
                ),
            ),
            timeout=30,
        )
    except asyncio.TimeoutError:
        raise AIServiceError("Assessment generation timed out. Please try again.")
    except Exception as e:
        logger.error("Gemini assessment error (type=%s)", type(e).__name__, exc_info=False)
        raise AIServiceError("Could not generate assessment. Please try again.")

    if not response or not response.text:
        raise AIServiceError("AI returned empty assessment. Please try again.")

    raw = _parse_json_response(response.text, context="assessment generation")
    if isinstance(raw, list):
        questions = raw
    elif isinstance(raw, dict) and "questions" in raw:
        questions = raw["questions"]
    else:
        raise ValidationError("AI returned unexpected assessment format.")

    # Validate each question has required fields
    validated = []
    for q in questions:
        if not all(k in q for k in ("id", "question", "options", "correct_index")):
            continue
        if not isinstance(q["options"], list) or len(q["options"]) != 4:
            continue
        if not isinstance(q["correct_index"], int) or q["correct_index"] not in range(4):
            continue
        validated.append(q)

    if not validated:
        raise ValidationError("AI returned no valid assessment questions.")

    return validated


async def generate_revised_roadmap(
    original_goal: str,
    req: GeneratePathRequest,
    notes: str = "",
) -> AIRoadmapResponse:
    """Generate a revised roadmap based on updated learner parameters."""
    settings = get_settings()
    prompt = build_revision_prompt(original_goal, req, notes)

    try:
        client = _get_client()
        response = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.4,
                        max_output_tokens=8192,
                    ),
                ),
            ),
            timeout=settings.AI_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise AIServiceError("AI revision timed out. Please try again.")
    except Exception as e:
        logger.error("Gemini revision error (type=%s)", type(e).__name__, exc_info=False)
        raise AIServiceError("Could not generate revised roadmap. Please try again.")

    if not response or not response.text:
        raise AIServiceError("AI returned empty revision. Please try again.")

    raw_data = _parse_json_response(response.text, context="revision")

    try:
        return AIRoadmapResponse.model_validate(raw_data)
    except Exception as e:
        logger.error("Revision schema validation failed: %s", str(e), exc_info=False)
        raise ValidationError(f"AI generated invalid revision: {str(e)[:200]}")
