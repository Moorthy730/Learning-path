"""
test_resources.py — Unit tests for educational resource resolution, curation, and validation.
"""
import pytest
from app.services.resource_service import (
    is_plausible_url,
    is_trusted_domain,
    sanitize_resource_url,
    get_fallback_resource_for_lesson,
    resolve_lesson_resource,
    build_curated_resources,
)


def test_is_plausible_url():
    assert is_plausible_url("https://docs.python.org/3/") is True
    assert is_plausible_url("http://react.dev") is True
    assert is_plausible_url(None) is False
    assert is_plausible_url("") is False
    assert is_plausible_url("   ") is False
    assert is_plausible_url("not a url") is False
    assert is_plausible_url("http://example.com/test") is False


def test_is_trusted_domain():
    assert is_trusted_domain("https://developer.mozilla.org/en-US/docs/Web") is True
    assert is_trusted_domain("https://docs.docker.com/get-started/") is True
    assert is_trusted_domain("https://github.com/torvalds/linux") is True
    assert is_trusted_domain("https://untrusted-suspicious-site.xyz") is False


def test_sanitize_resource_url():
    assert sanitize_resource_url("  https://react.dev/learn  ") == "https://react.dev/learn"
    assert sanitize_resource_url("http://example.com/lesson") is None
    assert sanitize_resource_url(None) is None
    assert sanitize_resource_url("invalid-url") is None


def test_get_fallback_resource_for_known_topics():
    # Cybersecurity / PortSwigger / OWASP
    sec_res = get_fallback_resource_for_lesson(
        lesson_title="Understanding OWASP Top 10 Vulnerabilities",
        module_title="Web Security",
        career_goal="Cybersecurity Analyst",
    )
    assert "owasp.org" in sec_res["url"]
    assert "OWASP" in sec_res["title"]

    # Docker
    docker_res = get_fallback_resource_for_lesson(
        lesson_title="Containerizing Applications with Docker",
        module_title="DevOps Foundations",
        career_goal="DevOps Engineer",
    )
    assert "docker.com" in docker_res["url"]

    # UI/UX / Figma
    figma_res = get_fallback_resource_for_lesson(
        lesson_title="Wireframing and Prototyping in Figma",
        module_title="Design Fundamentals",
        career_goal="UI/UX Designer",
    )
    assert "figma.com" in figma_res["url"]

    # Testing / QA
    qa_res = get_fallback_resource_for_lesson(
        lesson_title="Automated UI Testing with Cypress",
        module_title="Quality Assurance",
        career_goal="Software Tester",
    )
    assert "cypress.io" in qa_res["url"]


def test_resolve_lesson_resource_keeps_valid_url():
    valid = "https://fastapi.tiangolo.com/tutorial/"
    resolved = resolve_lesson_resource(
        lesson_title="FastAPI Endpoints",
        raw_url=valid,
    )
    assert resolved == valid


def test_resolve_lesson_resource_uses_lesson_specific_curated_fallbacks():
    resolved = resolve_lesson_resource(
        lesson_title="Python Data Types",
        raw_url=None,
        career_goal="Full Stack Developer",
    )
    assert resolved.startswith("http")
    assert "python.org" in resolved


def test_video_resource_without_verified_metadata_is_not_fabricated():
    resolved = resolve_lesson_resource(
        lesson_title="A bespoke lesson without a catalog match",
        raw_url=None,
        format_preference="video",
    )
    assert resolved is None


def test_unmatched_article_does_not_fabricate_a_search_link():
    resolved = resolve_lesson_resource(
        lesson_title="A bespoke lesson without a catalog match",
        raw_url=None,
        format_preference="articles",
    )
    assert resolved is None


def test_build_curated_resources_returns_only_verified_matches():
    # Predefined keyword
    py_res = build_curated_resources("python", "mixed")
    assert len(py_res) >= 1
    assert any("python" in r["title"].lower() for r in py_res)

    # Unknown domains have no claimed resource until one is verified.
    custom_res = build_curated_resources("Quantum Computing Architecture", "video")
    assert custom_res == []
