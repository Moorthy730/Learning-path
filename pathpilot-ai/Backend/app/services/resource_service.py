"""
resource_service.py — Educational resource recommendation and resolution.

Design: Resource discovery is kept separate from AI generation so it can later
be connected to a real search API (e.g. YouTube Data API, Coursera catalog)
without modifying roadmap logic.

Current implementation provides:
1. Whitelist of trusted educational domains.
2. Sanitization of AI-generated URLs.
3. Topic-aware fallback resource generation for lessons with missing or invalid URLs.
4. Curated learning resources across software engineering, cloud, cybersecurity,
   data science, testing, UI/UX, mobile, and devops.
"""
from __future__ import annotations

import logging
import re
from typing import Optional
from urllib.parse import quote_plus, urlparse

import httpx

logger = logging.getLogger(__name__)

# Reputable educational domains (curated whitelist)
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
        "docs.aws.amazon.com",
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
        "owasp.org",
        "portswigger.net",
        "tryhackme.com",
        "hackthebox.com",
        "nmap.org",
        "wireshark.org",
        "figma.com",
        "nngroup.com",
        "interaction-design.org",
        "material.io",
        "selenium.dev",
        "cypress.io",
        "playwright.dev",
        "postman.com",
        "terraform.io",
        "ansible.com",
        "prometheus.io",
        "grafana.com",
        "linux.org",
        "linuxfoundation.org",
        "devdocs.io",
        "geeksforgeeks.org",
        "leetcode.com",
        "web.dev",
        "martinfowler.com",
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
    clean = url.strip()
    if clean.lower().startswith("http://example.com") or "example.com" in clean.lower():
        return False
    return bool(_URL_PATTERN.match(clean))


def is_trusted_domain(url: str) -> bool:
    """Check if the URL belongs to a known reputable educational domain."""
    try:
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


# Curated knowledge base of reputable resources by topic keywords
TOPIC_RESOURCE_MAP: list[tuple[list[str], str, str]] = [
    # (keywords, title, url)
    (["figma", "wirefram", "prototyp"], "Figma Learn & Tutorials", "https://help.figma.com/hc/en-us/categories/360002051613-Learn-Design"),
    (["ui/ux", "user research", "usability", "design system", "heuristic"], "Nielsen Norman Group UX Articles", "https://www.nngroup.com/articles/"),
    (["owasp", "vulnerability", "xss", "sql injection", "csrf"], "OWASP Top Ten Security Project", "https://owasp.org/www-project-top-ten/"),
    (["portswigger", "web security", "burp suite"], "PortSwigger Web Security Academy", "https://portswigger.net/web-security"),
    (["nmap", "port scan"], "Nmap Network Scanning Guide", "https://nmap.org/book/man.html"),
    (["wireshark", "packet", "pcap"], "Wireshark User Guide", "https://www.wireshark.org/docs/wsug_html_chunked/"),
    (["cybersecurity", "penetration", "ethical hack", "infosec"], "TryHackMe Security Fundamentals", "https://tryhackme.com"),
    (["docker", "container", "dockerfile", "compose"], "Docker Official Documentation", "https://docs.docker.com/get-started/"),
    (["kubernetes", "k8s", "pod", "deployment", "cluster"], "Kubernetes Official Documentation", "https://kubernetes.io/docs/home/"),
    (["terraform", "iac", "infrastructure as code"], "Terraform Documentation", "https://developer.hashicorp.com/terraform/docs"),
    (["aws", "cloud practitioner", "ec2", "s3", "lambda"], "AWS Getting Started Resource Center", "https://aws.amazon.com/getting-started/"),
    (["azure"], "Microsoft Learn for Azure", "https://learn.microsoft.com/en-us/azure/"),
    (["gcp", "google cloud"], "Google Cloud Architecture & Guides", "https://cloud.google.com/docs"),
    (["selenium", "webdriver"], "Selenium Documentation", "https://www.selenium.dev/documentation/"),
    (["cypress"], "Cypress End-to-End Testing Guide", "https://docs.cypress.io/guides/overview/why-cypress"),
    (["playwright"], "Playwright Fast & Reliable Testing", "https://playwright.dev/docs/intro"),
    (["testing", "unit test", "integration test", "qa", "tdd"], "Martin Fowler Testing Guide", "https://martinfowler.com/testing/"),
    (["python", "pip", "virtualenv"], "Python 3 Official Tutorial", "https://docs.python.org/3/tutorial/"),
    (["fastapi", "pydantic", "uvicorn"], "FastAPI Official Documentation", "https://fastapi.tiangolo.com/tutorial/"),
    (["django"], "Django Documentation & Tutorial", "https://docs.djangoproject.com/en/stable/intro/tutorial01/"),
    (["flask"], "Flask Quickstart Guide", "https://flask.palletsprojects.com/en/latest/quickstart/"),
    (["react native"], "React Native Documentation", "https://reactnative.dev/docs/getting-started"),
    (["flutter", "dart"], "Flutter Documentation", "https://docs.flutter.dev/"),
    (["react", "jsx", "hook"], "React Official Documentation", "https://react.dev/learn"),
    (["next.js", "nextjs", "ssr"], "Next.js App Router Documentation", "https://nextjs.org/docs"),
    (["typescript", "tsconfig"], "TypeScript Handbook", "https://www.typescriptlang.org/docs/handbook/intro.html"),
    (["javascript", "es6", "dom", "async/await"], "MDN JavaScript Guide", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"),
    (["css", "flexbox", "grid", "tailwind"], "MDN CSS Reference & Guides", "https://developer.mozilla.org/en-US/docs/Web/CSS"),
    (["html", "semantic"], "MDN HTML Guide", "https://developer.mozilla.org/en-US/docs/Web/HTML"),
    (["sql", "postgres", "rdbms", "relational"], "PostgreSQL Official Documentation", "https://www.postgresql.org/docs/current/"),
    (["mongodb", "nosql"], "MongoDB Developer Manual", "https://www.mongodb.com/docs/manual/"),
    (["redis", "cache"], "Redis Documentation", "https://redis.io/docs/"),
    (["git", "github", "version control"], "Pro Git Book (Git-SCM)", "https://git-scm.com/book/en/v2"),
    (["pandas", "dataframe"], "Pandas User Guide", "https://pandas.pydata.org/docs/user_guide/index.html"),
    (["numpy"], "NumPy User Guide", "https://numpy.org/doc/stable/user/"),
    (["scikit-learn", "sklearn", "regression", "classification"], "Scikit-Learn User Guide", "https://scikit-learn.org/stable/user_guide.html"),
    (["tensorflow", "keras"], "TensorFlow Core Tutorials", "https://www.tensorflow.org/tutorials"),
    (["pytorch"], "PyTorch Tutorials", "https://pytorch.org/tutorials/"),
    (["machine learning", "deep learning", "nlp", "computer vision"], "Google Machine Learning Crash Course", "https://developers.google.com/machine-learning/crash-course"),
    (["data analysis", "statistics", "eda", "visualization"], "Kaggle Learn Tutorials", "https://www.kaggle.com/learn"),
    (["devops", "ci/cd", "pipeline", "jenkins", "github actions"], "GitHub Actions Documentation", "https://docs.github.com/en/actions"),
    (["linux", "bash", "shell", "terminal"], "Linux Journey", "https://linuxjourney.com/"),
    (["rust"], "The Rust Programming Language Book", "https://doc.rust-lang.org/book/"),
    (["go", "golang"], "A Tour of Go", "https://go.dev/tour/welcome/1"),
]


def get_fallback_resource_for_lesson(
    lesson_title: str,
    module_title: str = "",
    career_goal: str = "",
    format_preference: str = "mixed",
) -> dict[str, str]:
    """
    Produce a verified, high-quality educational resource URL and title for a lesson
    by matching lesson, module, and career domain context.
    """
    text_corpus = f"{lesson_title} {module_title} {career_goal}".lower()

    # 1. Match against curated knowledge base
    for keywords, title, url in TOPIC_RESOURCE_MAP:
        if any(kw in text_corpus for kw in keywords):
            return {
                "title": f"{lesson_title} — {title}",
                "url": url,
            }

    # 2. Topic-driven educational search URL fallback
    clean_topic = re.sub(r"[^\w\s-]", "", lesson_title).strip()
    encoded_topic = quote_plus(clean_topic or career_goal or "programming")

    if format_preference == "video":
        return {
            "title": f"{lesson_title} Video Tutorial",
            "url": f"https://www.youtube.com/results?search_query={encoded_topic}+tutorial",
        }
    if "design" in text_corpus or "ui" in text_corpus:
        return {
            "title": f"{lesson_title} Guide",
            "url": f"https://www.interaction-design.org/literature",
        }
    if "security" in text_corpus or "cyber" in text_corpus:
        return {
            "title": f"{lesson_title} Reference",
            "url": "https://owasp.org/projects/",
        }

    # Default to reputable dev/docs platform
    return {
        "title": f"{lesson_title} Guide — freeCodeCamp",
        "url": f"https://www.freecodecamp.org/news/search/?query={encoded_topic}",
    }


def resolve_lesson_resource(
    lesson_title: str,
    module_title: str = "",
    career_goal: str = "",
    raw_url: Optional[str] = None,
    format_preference: str = "mixed",
) -> str:
    """
    Validate raw_url from AI; if missing or invalid, generate an intelligent,
    topic-appropriate fallback URL from a trusted educational source.
    """
    sanitized = sanitize_resource_url(raw_url)
    if sanitized:
        return sanitized

    fallback = get_fallback_resource_for_lesson(
        lesson_title=lesson_title,
        module_title=module_title,
        career_goal=career_goal,
        format_preference=format_preference,
    )
    return fallback["url"]


def build_curated_resources(topic: str, format_preference: str = "mixed") -> list[dict]:
    """
    Return curated, format-appropriate resource suggestions for a given topic or domain.
    """
    topic_lower = topic.lower()
    suggestions: list[dict] = []

    for keywords, title, url in TOPIC_RESOURCE_MAP:
        if any(kw in topic_lower for kw in keywords):
            suggestions.append({"title": title, "url": url})
            if len(suggestions) >= 3:
                break

    if len(suggestions) < 3:
        clean_topic = re.sub(r"[^\w\s-]", "", topic).strip()
        encoded = quote_plus(clean_topic or "programming")
        if format_preference == "video":
            suggestions.append({
                "title": f"{topic} Video Tutorials on YouTube",
                "url": f"https://www.youtube.com/results?search_query={encoded}+tutorial",
            })
        else:
            suggestions.append({
                "title": f"{topic} Articles on freeCodeCamp",
                "url": f"https://www.freecodecamp.org/news/search/?query={encoded}",
            })
            suggestions.append({
                "title": "Roadmap.sh Developer Guides",
                "url": "https://roadmap.sh",
            })

    return suggestions[:3]

