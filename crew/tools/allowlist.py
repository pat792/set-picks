"""Allowlist loader for L1 market intel (epic #695)."""

from __future__ import annotations

from pathlib import Path

_CREW_ROOT = Path(__file__).resolve().parents[1]
_ALLOWLIST_PATH = _CREW_ROOT / "knowledge" / "allowlists" / "domains.md"

# Fallback if file missing
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
