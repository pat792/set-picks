"""Allowlist + refuse rules for L1 market intel (epic #695 / #933)."""

from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse

_CREW_ROOT = Path(__file__).resolve().parents[1]
_ALLOWLIST_PATH = _CREW_ROOT / "knowledge" / "allowlists" / "domains.md"

# Fallback if file missing — first-party only (never auto-add competitor hosts).
DEFAULT_ALLOWLIST = frozenset(
    {
        "www.setlistpickem.com",
        "setlistpickem.com",
        "github.com",
        "www.github.com",
        "developers.google.com",
        "support.google.com",
    }
)

# Google/Bing SERP HTML — never fetch, even if someone adds the host to domains.md.
REFUSED_SERP_HOST_SUFFIXES = (
    "google.com",
    "google.co.uk",
    "google.ca",
    "bing.com",
    "duckduckgo.com",
    "search.yahoo.com",
    "yandex.com",
    "yandex.ru",
)

# Hosts reviewed 2026-09-03 and omitted (ToS scrape ban or unverifiable).
REFUSED_TOS_HOSTS = frozenset(
    {
        "callingit.live",
        "www.callingit.live",
        "ihoz.com",
        "www.ihoz.com",
        "phantasytour.com",
        "www.phantasytour.com",
    }
)

# Account / PII / admin paths — never fetch on any host.
REFUSED_PII_PATH_PREFIXES = (
    "/profile",
    "/account",
    "/users/",
    "/messages",
    "/admin",
    "/onboarding",
    "/login",
    "/register",
)

# robots.txt Disallow from the 2026-09-03 phish.jampicks.com review.
# Scanner also refuses these even if a caller passes --url.
REFUSED_HOST_PATHS = {
    "phish.jampicks.com": (
        "/api/",
        "/admin",
        "/picks",
        "/profile",
        "/messages",
        "/onboarding",
    ),
    "phishpicks.net": (
        "/api/",
        "/admin",
        "/picks",
        "/profile",
        "/messages",
        "/onboarding",
    ),
    "www.phishpicks.net": (
        "/api/",
        "/admin",
        "/picks",
        "/profile",
        "/messages",
        "/onboarding",
    ),
}

# L1 crawl politeness — SEO scanner (and any caller) must honor these.
MIN_FETCH_INTERVAL_S = 2.0
MAX_URLS_PER_RUN = 12


def load_allowlist(path: Path | None = None) -> set[str]:
    """Parse hostname lines from domains.md (ignore # comments and blanks)."""
    target = path or _ALLOWLIST_PATH
    hosts: set[str] = set()
    if not target.is_file():
        return set(DEFAULT_ALLOWLIST)
    for line in target.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#"):
            continue
        # Strip accidental schemes
        host = raw.replace("https://", "").replace("http://", "").split("/")[0].lower()
        if host:
            hosts.add(host)
    return hosts or set(DEFAULT_ALLOWLIST)


def host_allowed(hostname: str, allowlist: set[str] | None = None) -> bool:
    allowed = allowlist if allowlist is not None else load_allowlist()
    host = (hostname or "").lower().rstrip(".")
    if not host:
        return False
    if host in allowed:
        return True
    return any(host.endswith("." + a) for a in allowed)


def _is_serp_host(host: str) -> bool:
    return any(host == suffix or host.endswith("." + suffix) for suffix in REFUSED_SERP_HOST_SUFFIXES)


def _path_matches_prefix(path: str, prefix: str) -> bool:
    if prefix.endswith("/"):
        return path == prefix.rstrip("/") or path.startswith(prefix)
    return path == prefix or path.startswith(prefix + "/")


def refuse_url(url: str) -> str | None:
    """Return a refuse reason, or None if the URL is not on the hard-refuse list.

    Allowlist is a separate check (`host_allowed`). Refuse wins even if a host
    is later added to domains.md (SERP / ToS / PII).
    """
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower().rstrip(".")
    path = parsed.path or "/"
    if not host:
        return "Refused: missing hostname"
    if _is_serp_host(host):
        return (
            f"Refused: Google/Bing SERP HTML scraping is not allowed ({host}). "
            "Spot-checks are visual / URL Inspection only."
        )
    if host in REFUSED_TOS_HOSTS:
        return (
            f"Refused: {host} is omitted from the #933 allowlist "
            "(ToS scrape ban or unverifiable robots/ToS)."
        )
    for prefix in REFUSED_PII_PATH_PREFIXES:
        if _path_matches_prefix(path, prefix):
            return f"Refused: PII / account path {prefix} is never fetched"
    for prefix in REFUSED_HOST_PATHS.get(host, ()):
        if _path_matches_prefix(path, prefix):
            return f"Refused: robots.txt Disallow {prefix} on {host}"
    return None
