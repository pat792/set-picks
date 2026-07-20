"""L2 human-gated social / BD demand-gen publish (epic #695).

Flow: draft → approve (EiC/CCO) → publish
Publish without SOCIAL_PUBLISH_WEBHOOK writes a local "ready for manual post" artifact.
With webhook set, POSTs JSON after approval (still requires dry_run=False).

Never auto-posts to network APIs in this maturity — adapters can be added later.
"""

from __future__ import annotations

import json
import os
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

Kind = Literal["social", "bd"]
Status = Literal["draft", "approved", "published"]

CREW_ROOT = Path(__file__).resolve().parents[1]
# output/demand_gen/{social|bd}/{draft|approved|published}/
SOCIAL_ROOT = CREW_ROOT / "output" / "demand_gen"
ALLOWED_APPROVERS = frozenset({"eic", "cco", "editor_in_chief", "chief_customer_officer"})
ALLOWED_PLATFORMS = frozenset(
    {"x", "bluesky", "linkedin", "instagram", "threads", "facebook", "email_outreach"}
)


@dataclass
class ToolResult:
    ok: bool
    dry_run: bool
    message: str
    data: dict[str, Any] = field(default_factory=dict)


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _slug(platform: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", platform.lower()).strip("-") or "post"


def _dir(kind: Kind, status: Status) -> Path:
    path = SOCIAL_ROOT / kind / status
    path.mkdir(parents=True, exist_ok=True)
    return path


def _path_for(kind: Kind, status: Status, draft_id: str) -> Path:
    return _dir(kind, status) / f"{draft_id}.json"


def _find_draft(draft_id: str, kind: Kind | None = None) -> tuple[Kind, Status, Path, dict[str, Any]] | None:
    kinds: tuple[Kind, ...] = (kind,) if kind else ("social", "bd")
    for k in kinds:
        for status in ("draft", "approved", "published"):
            path = _path_for(k, status, draft_id)
            if path.is_file():
                return k, status, path, json.loads(path.read_text(encoding="utf-8"))
    return None


def social_draft_pack(
    platform: str,
    body: str,
    *,
    kind: Kind = "social",
    title: str = "",
    dry_run: bool = True,
    persist: bool = True,
) -> ToolResult:
    """Create a draft pack. persist=False returns payload only (tests / dry planning)."""
    platform_key = platform.lower().strip()
    if platform_key not in ALLOWED_PLATFORMS:
        return ToolResult(
            False,
            dry_run,
            f"Unsupported platform: {platform}",
            {"allowed": sorted(ALLOWED_PLATFORMS)},
        )
    if not (body or "").strip():
        return ToolResult(False, dry_run, "Body is required", {})

    draft_id = f"{_slug(platform_key)}-{uuid.uuid4().hex[:10]}"
    payload = {
        "id": draft_id,
        "kind": kind,
        "platform": platform_key,
        "title": title or f"{kind} draft for {platform_key}",
        "body": body.strip(),
        "status": "draft",
        "created_at": _now(),
        "approved_by": None,
        "approved_at": None,
        "published_at": None,
        "publish_requires": "L2: approve (EiC/CCO) then publish with dry_run=False",
    }

    if dry_run or not persist:
        return ToolResult(
            True,
            True if dry_run else False,
            "Draft pack prepared (not persisted)" if dry_run or not persist else "Draft created",
            payload,
        )

    path = _path_for(kind, "draft", draft_id)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    payload["path"] = str(path)
    return ToolResult(True, False, f"Draft persisted: {draft_id}", payload)


def approve_social_draft(
    draft_id: str,
    *,
    approver: str,
    kind: Kind | None = None,
    dry_run: bool = False,
) -> ToolResult:
    """Move draft → approved. Approver must be EiC or CCO (or aliases)."""
    who = approver.strip().lower().replace("-", "_").replace(" ", "_")
    if who not in ALLOWED_APPROVERS:
        return ToolResult(
            False,
            dry_run,
            f"Approver not allowed: {approver}",
            {"allowed": sorted(ALLOWED_APPROVERS)},
        )

    found = _find_draft(draft_id, kind)
    if not found:
        return ToolResult(False, dry_run, f"Draft not found: {draft_id}", {})
    k, status, path, payload = found
    if status == "published":
        return ToolResult(False, dry_run, "Already published", payload)
    if status == "approved":
        return ToolResult(True, dry_run, "Already approved", payload)

    payload["status"] = "approved"
    payload["approved_by"] = who
    payload["approved_at"] = _now()

    if dry_run:
        return ToolResult(True, True, "dry_run: would approve draft", payload)

    new_path = _path_for(k, "approved", draft_id)
    new_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    path.unlink(missing_ok=True)
    payload["path"] = str(new_path)
    return ToolResult(True, False, f"Approved by {who}: {draft_id}", payload)


def social_publish(
    platform: str | None = None,
    body: str | None = None,
    *,
    draft_id: str | None = None,
    approved: bool = False,
    dry_run: bool = True,
    kind: Kind | None = None,
) -> ToolResult:
    """Publish an approved draft (or refuse).

    Gates:
    1. dry_run must be False
    2. draft must exist in approved/ OR approved=True with inline platform/body (legacy)
    3. CREW_SOCIAL_PUBLISH_ENABLED must be '1' or 'true' for non-dry publish
    """
    enabled = os.environ.get("CREW_SOCIAL_PUBLISH_ENABLED", "").lower() in {"1", "true", "yes"}

    payload: dict[str, Any] | None = None
    k: Kind = kind or "social"
    path: Path | None = None

    if draft_id:
        found = _find_draft(draft_id, kind)
        if not found:
            return ToolResult(False, dry_run, f"Draft not found: {draft_id}", {})
        k, status, path, payload = found
        if status == "published":
            return ToolResult(True, dry_run, "Already published", payload)
        if status != "approved":
            return ToolResult(
                False,
                dry_run,
                "Draft not approved — EiC/CCO must approve first",
                payload,
            )
        approved = True
        platform = payload.get("platform")
        body = payload.get("body")
    else:
        if not approved or not platform or not body:
            return ToolResult(
                True,
                True,
                "Publish blocked: dry_run or missing approval — draft only",
                {"platform": platform, "body": body, "approved": approved},
            )
        payload = {
            "id": f"inline-{uuid.uuid4().hex[:8]}",
            "kind": k,
            "platform": platform,
            "body": body,
            "status": "approved",
            "approved_by": "inline",
            "approved_at": _now(),
        }

    if dry_run:
        return ToolResult(
            True,
            True,
            "dry_run: would publish approved pack (no side effects)",
            {**payload, "publish_enabled_env": enabled},
        )

    if not enabled:
        return ToolResult(
            False,
            False,
            "Set CREW_SOCIAL_PUBLISH_ENABLED=true to publish (human gate)",
            payload,
        )

    assert payload is not None
    published_at = _now()
    payload["status"] = "published"
    payload["published_at"] = published_at
    payload["delivery"] = "local_queue"

    webhook = os.environ.get("SOCIAL_PUBLISH_WEBHOOK", "").strip()
    if webhook:
        req = Request(
            webhook,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "SetlistPickemLeadershipCrew/0.1"},
            method="POST",
        )
        try:
            with urlopen(req, timeout=20) as resp:  # noqa: S310 — explicit webhook opt-in
                payload["delivery"] = "webhook"
                payload["webhook_status"] = getattr(resp, "status", None) or resp.getcode()
        except (HTTPError, URLError, TimeoutError) as exc:
            return ToolResult(
                False,
                False,
                f"Webhook publish failed: {exc}",
                payload,
            )

    out = _path_for(k, "published", payload["id"])
    out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    if path and path.is_file() and path != out:
        path.unlink(missing_ok=True)
    payload["path"] = str(out)

    return ToolResult(
        True,
        False,
        f"Published to {payload['delivery']}: {payload['id']}",
        payload,
    )


def list_packs(kind: Kind = "social", status: Status | None = None) -> list[dict[str, Any]]:
    statuses: tuple[Status, ...] = (status,) if status else ("draft", "approved", "published")
    items: list[dict[str, Any]] = []
    for st in statuses:
        folder = _dir(kind, st)
        for path in sorted(folder.glob("*.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            data["_path"] = str(path)
            items.append(data)
    return items
