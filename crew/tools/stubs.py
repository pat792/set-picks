"""Leadership Ops Crew tools (epic #695).

L1: allowlisted read-only HTTP fetch when dry_run=False.
L2+: social publish still gated. L3 affiliate inject not enabled.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from .allowlist import DEFAULT_ALLOWLIST, host_allowed, load_allowlist

USER_AGENT = (
    "SetlistPickemLeadershipCrew/0.1 "
    "(+https://github.com/pat792/set-picks; epic-695; research-only)"
)
MAX_BODY_CHARS = 80_000
FETCH_TIMEOUT_S = 20


@dataclass
class ToolResult:
    ok: bool
    dry_run: bool
    message: str
    data: dict[str, Any] = field(default_factory=dict)


def _host(url: str) -> str:
    return (urlparse(url).hostname or "").lower()


def _strip_html(text: str) -> str:
    """Lightweight text extraction for intel digests (not a full HTML parser)."""
    no_script = re.sub(
        r"<script[\s\S]*?</script>|<style[\s\S]*?</style>",
        " ",
        text,
        flags=re.IGNORECASE,
    )
    plain = re.sub(r"<[^>]+>", " ", no_script)
    plain = re.sub(r"\s+", " ", plain).strip()
    return plain


def web_fetch_allowlisted(
    url: str,
    *,
    dry_run: bool = True,
    allowlist: set[str] | None = None,
    max_chars: int = MAX_BODY_CHARS,
) -> ToolResult:
    """Allowlisted GET. dry_run=True plans only; False performs read-only fetch (L1)."""
    allowed = allowlist if allowlist is not None else load_allowlist()
    host = _host(url)
    if not host_allowed(host, allowed):
        return ToolResult(
            False,
            dry_run,
            f"Host not on allowlist: {host}",
            {"url": url, "host": host},
        )
    if dry_run:
        return ToolResult(
            True,
            True,
            "dry_run: would fetch allowlisted URL (no network call)",
            {"url": url, "host": host, "maturity": "L1"},
        )

    req = Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html,text/plain,*/*"},
        method="GET",
    )
    try:
        with urlopen(req, timeout=FETCH_TIMEOUT_S) as resp:  # noqa: S310 — allowlist gated
            status = getattr(resp, "status", None) or resp.getcode()
            content_type = (resp.headers.get("Content-Type") or "").split(";")[0].strip()
            raw = resp.read(max_chars + 1)
    except HTTPError as exc:
        return ToolResult(
            False,
            False,
            f"HTTP error {exc.code}",
            {"url": url, "host": host, "status": exc.code},
        )
    except URLError as exc:
        return ToolResult(
            False,
            False,
            f"URL error: {exc.reason}",
            {"url": url, "host": host},
        )
    except TimeoutError:
        return ToolResult(
            False,
            False,
            "Fetch timed out",
            {"url": url, "host": host, "timeout_s": FETCH_TIMEOUT_S},
        )

    truncated = len(raw) > max_chars
    body_bytes = raw[:max_chars]
    try:
        text = body_bytes.decode("utf-8", errors="replace")
    except Exception:  # noqa: BLE001
        text = body_bytes.decode("latin-1", errors="replace")

    excerpt = _strip_html(text) if "html" in content_type.lower() or text.lstrip().startswith("<") else text
    excerpt = excerpt[:12_000]

    return ToolResult(
        True,
        False,
        "Fetched allowlisted URL",
        {
            "url": url,
            "host": host,
            "status": status,
            "content_type": content_type,
            "truncated": truncated,
            "char_count": len(text),
            "excerpt": excerpt,
            "maturity": "L1",
        },
    )


def social_draft_pack(
    platform: str,
    body: str,
    *,
    dry_run: bool = True,
) -> ToolResult:
    """Always safe: returns a draft pack structure."""
    return ToolResult(
        True,
        dry_run,
        "Draft social pack created (not published)",
        {
            "platform": platform,
            "body": body,
            "status": "draft",
            "publish_requires": "L2 + EiC/CCO approval",
        },
    )


def social_publish(
    platform: str,
    body: str,
    *,
    dry_run: bool = True,
    approved: bool = False,
) -> ToolResult:
    """L2 human-gated publish. Refuses unless approved and not dry_run."""
    if dry_run or not approved:
        return ToolResult(
            True,
            True,
            "Publish blocked: dry_run or missing approval — draft only",
            {"platform": platform, "body": body, "approved": approved},
        )
    return ToolResult(
        False,
        False,
        "Live social publish not wired — enable L2 integration explicitly",
        {"platform": platform},
    )


def affiliate_catalog_research(
    network: str,
    *,
    dry_run: bool = True,
) -> ToolResult:
    """Affiliate network research — L1 can later reuse web_fetch_allowlisted."""
    if dry_run:
        return ToolResult(
            True,
            True,
            f"dry_run: would research affiliate network '{network}'",
            {"network": network, "maturity_required": "L1"},
        )
    return ToolResult(
        False,
        False,
        "Affiliate catalog research: pass allowlisted URLs through web_fetch_allowlisted",
        {"network": network},
    )


def lead_pack_export(
    leads: list[dict[str, Any]],
    *,
    dry_run: bool = True,
) -> ToolResult:
    """Export lead pack to structured data (no CRM write)."""
    return ToolResult(
        True,
        dry_run,
        f"{'dry_run: would export' if dry_run else 'Exported'} {len(leads)} leads (local only)",
        {"count": len(leads), "leads": leads, "crm_write": False},
    )


# Re-export for callers that imported DEFAULT_ALLOWLIST from stubs
__all__ = [
    "DEFAULT_ALLOWLIST",
    "ToolResult",
    "web_fetch_allowlisted",
    "social_draft_pack",
    "social_publish",
    "affiliate_catalog_research",
    "lead_pack_export",
    "load_allowlist",
    "host_allowed",
]
