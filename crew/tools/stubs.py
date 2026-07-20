"""L0 dry-run tool stubs for Leadership Ops Crew (epic #695).

All tools default to dry_run=True. Live side effects require explicit
dry_run=False AND maturity L1+ (research) / L2+ (publish) / L3 (affiliate inject).
Adapt tools as the team learns — see docs/LEADERSHIP_CREW.md.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlparse


# Starter allowlist — expand via crew/knowledge/allowlists/domains.md + PR
DEFAULT_ALLOWLIST = {
    "www.setlistpickem.com",
    "setlistpickem.com",
    "github.com",
    "developers.google.com",
}


@dataclass
class ToolResult:
    ok: bool
    dry_run: bool
    message: str
    data: dict[str, Any] = field(default_factory=dict)


def _host(url: str) -> str:
    return (urlparse(url).hostname or "").lower()


def web_fetch_allowlisted(
    url: str,
    *,
    dry_run: bool = True,
    allowlist: set[str] | None = None,
) -> ToolResult:
    """L1 research stub. L0 always dry-runs a plan; never fetches when dry_run."""
    allowed = allowlist or DEFAULT_ALLOWLIST
    host = _host(url)
    if host not in allowed and not any(host.endswith("." + a) for a in allowed):
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
            {"url": url, "host": host, "maturity_required": "L1"},
        )
    return ToolResult(
        False,
        False,
        "Live fetch not enabled in L0 scaffold — promote to L1 and implement HTTP client",
        {"url": url},
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
        "Live social publish not wired in L0 — enable L2 integration explicitly",
        {"platform": platform},
    )


def affiliate_catalog_research(
    network: str,
    *,
    dry_run: bool = True,
) -> ToolResult:
    """L1 research stub for affiliate networks."""
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
        "Live affiliate catalog research not enabled in L0",
        {"network": network},
    )


def lead_pack_export(
    leads: list[dict[str, Any]],
    *,
    dry_run: bool = True,
) -> ToolResult:
    """Export lead pack to structured data (no CRM write in L0)."""
    return ToolResult(
        True,
        dry_run,
        f"{'dry_run: would export' if dry_run else 'Exported'} {len(leads)} leads (local only)",
        {"count": len(leads), "leads": leads, "crm_write": False},
    )
