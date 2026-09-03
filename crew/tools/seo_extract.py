"""Title / heading extractor + registry phrase diff (#933).

Extracts only ``<title>``, meta description, and H1–H3 text.
Does not return article bodies or setlist lists.
"""

from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

_CREW_ROOT = Path(__file__).resolve().parents[1]
_REPO_ROOT = _CREW_ROOT.parent
DEFAULT_REGISTRY_PATH = _REPO_ROOT / "docs" / "seo" / "query-registry.json"

# Fan / playbook phrases to flag in title/headings (issue #933).
WATCH_PHRASES = (
    "bustout",
    "unique songs",
    "setlist stats",
    "tour stats",
    "song frequency",
    "prediction",
    "picks",
    "pick'em",
    "pick em",
    "fantasy setlist",
)

_WS = re.compile(r"\s+")
_TAGS = re.compile(r"<[^>]+>")


def normalize_text(value: str) -> str:
    return _WS.sub(" ", (value or "").replace("\xa0", " ")).strip()


def _decode_entities(text: str) -> str:
    return (
        text.replace("&#x27;", "'")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
        .replace("&amp;", "&")
        .replace("&quot;", '"')
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&mdash;", "—")
        .replace("&ndash;", "–")
    )


class _HeadingParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.meta_description = ""
        self.h1: list[str] = []
        self.h2: list[str] = []
        self.h3: list[str] = []
        self._capture: str | None = None
        self._buf: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        name = tag.lower()
        if name in {"script", "style", "noscript"}:
            self._skip_depth += 1
            return
        if self._skip_depth:
            return
        attr = {k.lower(): (v or "") for k, v in attrs}
        if name == "meta":
            meta_name = attr.get("name", "").lower()
            prop = attr.get("property", "").lower()
            if meta_name == "description" or prop == "og:description":
                content = normalize_text(attr.get("content", ""))
                if content and not self.meta_description:
                    self.meta_description = content
            return
        if name == "title" and not self.title_parts:
            self._capture = "title"
            self._buf = []
        elif name in {"h1", "h2", "h3"}:
            self._capture = name
            self._buf = []

    def handle_endtag(self, tag: str) -> None:
        name = tag.lower()
        if name in {"script", "style", "noscript"} and self._skip_depth:
            self._skip_depth -= 1
            return
        if self._capture and name == self._capture:
            text = normalize_text("".join(self._buf))
            if self._capture == "title":
                if text:
                    self.title_parts.append(text)
            elif text:
                getattr(self, self._capture).append(text)
            self._capture = None
            self._buf = []

    def handle_data(self, data: str) -> None:
        if self._skip_depth or not self._capture:
            return
        self._buf.append(data)

    def handle_entityref(self, name: str) -> None:
        if self._capture:
            self._buf.append(self.unescape(f"&{name};"))

    def handle_charref(self, name: str) -> None:
        if self._capture:
            self._buf.append(self.unescape(f"&#{name};"))


def extract_title_headings(html: str) -> dict[str, Any]:
    """Return title / meta / H1–H3 only. Never includes body copy."""
    parser = _HeadingParser()
    try:
        parser.feed(html or "")
        parser.close()
    except Exception:  # noqa: BLE001 — tolerate broken competitor HTML
        title_m = re.search(r"<title[^>]*>(.*?)</title>", html or "", flags=re.I | re.S)
        title = normalize_text(_TAGS.sub("", _decode_entities(title_m.group(1)))) if title_m else ""
        return {
            "title": title,
            "meta_description": "",
            "h1": [],
            "h2": [],
            "h3": [],
        }
    return {
        "title": parser.title_parts[0] if parser.title_parts else "",
        "meta_description": parser.meta_description,
        "h1": parser.h1[:12],
        "h2": parser.h2[:24],
        "h3": parser.h3[:24],
    }


def heading_blob(extracted: dict[str, Any]) -> str:
    parts = [
        extracted.get("title") or "",
        extracted.get("meta_description") or "",
        *extracted.get("h1", []),
        *extracted.get("h2", []),
        *extracted.get("h3", []),
    ]
    return normalize_text(" ".join(parts)).lower()


def load_query_registry(path: Path | None = None) -> dict[str, Any]:
    target = path or DEFAULT_REGISTRY_PATH
    return json.loads(target.read_text(encoding="utf-8"))


def _query_needles(query: str) -> list[str]:
    q = normalize_text(query).lower()
    needles = [q]
    # Apostrophe / hyphen variants used in the playbook.
    if "pick'em" in q:
        needles.append(q.replace("pick'em", "pick em"))
        needles.append(q.replace("pick'em", "pickem"))
    if "pick em" in q:
        needles.append(q.replace("pick em", "pick'em"))
        needles.append(q.replace("pick em", "pickem"))
    return needles


def _query_tokens(query: str) -> list[str]:
    q = normalize_text(query).lower().replace("pick'em", "pickem")
    return [tok for tok in re.split(r"[^a-z0-9]+", q) if len(tok) >= 2]


def query_hits_blob(query: str, blob: str) -> bool:
    """Exact phrase, or every query token present (so C1 hits inside C6-style titles)."""
    if any(n and n in blob for n in _query_needles(query)):
        return True
    tokens = _query_tokens(query)
    if not tokens:
        return False
    return all(tok in blob for tok in tokens)


def match_registry_queries(
    extracted: dict[str, Any],
    queries: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Diff extracted title/headings against registry query strings."""
    blob = heading_blob(extracted)
    rows = []
    for row in queries:
        qid = row.get("id", "")
        query = row.get("query", "")
        hit = query_hits_blob(query, blob)
        rows.append(
            {
                "id": qid,
                "query": query,
                "intent": row.get("intent"),
                "priority": row.get("priority"),
                "targetPath": row.get("targetPath"),
                "hit": hit,
            }
        )
    return rows


def match_watch_phrases(extracted: dict[str, Any]) -> list[str]:
    blob = heading_blob(extracted)
    return [phrase for phrase in WATCH_PHRASES if phrase in blob]


def summarize_gaps(
    matches: list[dict[str, Any]],
    *,
    our_host: bool,
) -> dict[str, Any]:
    hits = [m for m in matches if m["hit"]]
    misses = [m for m in matches if not m["hit"]]
    return {
        "our_host": our_host,
        "hit_ids": [m["id"] for m in hits],
        "miss_ids": [m["id"] for m in misses],
        "p0_hits": [m["id"] for m in hits if m.get("priority") == "P0"],
        "p0_misses": [m["id"] for m in misses if m.get("priority") == "P0"],
    }
