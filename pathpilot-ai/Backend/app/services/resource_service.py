"""
resource_service.py — Educational resource recommendation.

Design: Resource discovery is kept separate from AI generation so it can later
be connected to a real search API (e.g. YouTube Data API, Coursera catalog)
without modifying roadmap logic.

Current implementation uses a curated domain registry and validates that
resource_url fields from the AI are from reputable domains. Fabricated URLs
from the AI are set to None.

IMPORTANT: We never claim a URL is accessible without actually checking it.
HTTP verification is attempted when configured; on timeout/error the URL
is returned as-is (unverified) with a flag indicating verification status.
"""
from __future__ import annotations

import logging
import re
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# Reputable educational domains (not exhaustive — curated whitelist)
TRUSTED_DOMAINS = frozenset(
    [
        "docs.python.org",
        "developer.mozilla.org",
        "reactjs.org",
        "react.dev",
        "nextjs.org",
        "docs.github.com",
        "git-scm.com",
        "typescriptlang.org",
        "nodejs.org",
        "fastapi.tiangolo.com",
        "docs.docker.com",
        "kubernetes.io",
        "aws.amazon.com",
        "cloud.google.com",
        "learn.microsoft.com",
        "postgresql.org",
        "mongodb.com",
        "redis.io",
        "graphql.org",
        "tailwindcss.com",
        "vuejs.org",
        "angular.io",
        "svelte.dev",
        "rust-lang.org",
        "go.dev",
        "kotlinlang.org",
        "swift.org",
        "flutter.dev",
        "tensorflow.org",
        "pytorch.org",
        "scikit-learn.org",
        "pandas.pydata.org",
        "numpy.org",
        "kaggle.com",
        "coursera.org",
        "edx.org",
        "udemy.com",
        "freecodecamp.org",
        "w3schools.com",
        "css-tricks.com",
        "smashingmagazine.com",
        "medium.com",
        "dev.to",
        "stackoverflow.com",
        "github.com",
        "youtube.com",
        "youtu.be",
        "pluralsight.com",
        "linkedin.com",
        "codecademy.com",
        "theodinproject.com",
        "roadmap.sh",
    ]
)

_URL_PATTERN = re.compile(
    r"^https?://"
    r"(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}"
    r"(?::\d+)?(?:/[^\s]*)?$",
    re.IGNORECASE,
)


def is_plausible_url(url: Optional[str]) -> bool:
    """Basic structural URL validation — does NOT verify reachability."""
    if not url:
        return False
    return bool(_URL_PATTERN.match(url.strip()))


def is_trusted_domain(url: str) -> bool:
    """Check if the URL belongs to a known reputable educational domain."""
    try:
        from urllib.parse import urlparse
        hostname = urlparse(url).hostname or ""
        return any(hostname == d or hostname.endswith(f".{d}") for d in TRUSTED_DOMAINS)
    except Exception:
        return False


def sanitize_resource_url(url: Optional[str]) -> Optional[str]:
    """
    Return a URL only if it looks structurally valid.
    Returns None for blank, malformed, or obviously fabricated URLs.
    Does NOT verify the URL is reachable.
    """
    if not url:
        return None
    url = url.strip()
    if not is_plausible_url(url):
        logger.debug("Discarding malformed resource URL")
        return None
    return url


async def verify_url_reachable(url: str, timeout: float = 5.0) -> bool:
    """
    Attempt a HEAD request to check if a URL is reachable.
    Returns False on any error — we never claim a URL is verified if we
    couldn't reach it.
    """
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
            resp = await client.head(url)
            return resp.status_code < 400
    except Exception:
        return False


def build_curated_resources(topic: str, format_preference: str) -> list[dict]:
    """
    Return a small list of curated, format-appropriate resource suggestions
    for a given topic. These are real domain links, not AI-fabricated ones.

    This is a lightweight fallback when AI doesn't provide resource_url values.
    """
    topic_lower = topic.lower()
    suggestions = []

    if "python" in topic_lower:
        suggestions.append({"title": "Python Official Docs", "url": "https://docs.python.org/3/"})
    if "react" in topic_lower:
        suggestions.append({"title": "React Official Docs", "url": "https://react.dev"})
    if "typescript" in topic_lower:
        suggestions.append({"title": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/"})
    if "css" in topic_lower:
        suggestions.append({"title": "MDN CSS Reference", "url": "https://developer.mozilla.org/en-US/docs/Web/CSS"})
    if "html" in topic_lower:
        suggestions.append({"title": "MDN HTML Guide", "url": "https://developer.mozilla.org/en-US/docs/Web/HTML"})
    if "javascript" in topic_lower or "js" in topic_lower:
        suggestions.append({"title": "MDN JavaScript Guide", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript"})
    if "sql" in topic_lower or "database" in topic_lower:
        suggestions.append({"title": "PostgreSQL Docs", "url": "https://www.postgresql.org/docs/"})
    if "docker" in topic_lower:
        suggestions.append({"title": "Docker Docs", "url": "https://docs.docker.com/"})
    if "git" in topic_lower:
        suggestions.append({"title": "Git Documentation", "url": "https://git-scm.com/doc"})
    if "machine learning" in topic_lower or "ml" in topic_lower:
        suggestions.append({"title": "Scikit-learn User Guide", "url": "https://scikit-learn.org/stable/user_guide.html"})
    if "fastapi" in topic_lower:
        suggestions.append({"title": "FastAPI Docs", "url": "https://fastapi.tiangolo.com"})

    # Always suggest a general search resource
    if format_preference == "video":
        suggestions.append({"title": f"Search YouTube for '{topic}'", "url": "https://www.youtube.com"})
    else:
        suggestions.append({"title": f"freeCodeCamp", "url": "https://www.freecodecamp.org"})

    return suggestions[:3]
