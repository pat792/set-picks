"""#933 SEO title/H1 scan — allowlisted homepage GET → registry gap notes.

Usage (from repo root):
  python3 -m crew.scripts.seo_title_h1_scan --dry-run
  python3 -m crew.scripts.seo_title_h1_scan

Extracts ``<title>``, meta description, and H1–H3 only. Diffs against
``docs/seo/query-registry.json``. Writes ``crew/output/intel/seo-gap-*.md``
(gitignored). Never commits scraped HTML corpora.

Refuses: Google/Bing SERP HTML, ToS-omitted hosts, PII/account paths,
off-allowlist hosts, robots Disallow paths, aggressive URL counts.
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from crew.tools.allowlist import (
    MAX_URLS_PER_RUN,
    MIN_FETCH_INTERVAL_S,
    host_allowed,
    load_allowlist,
    refuse_url,
)
from crew.tools.seo_extract import (
    extract_title_headings,
    load_query_registry,
    match_registry_queries,
    match_watch_phrases,
    summarize_gaps,
)
from crew.tools.stubs import web_fetch_allowlisted

CREW_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = CREW_ROOT / "output" / "intel"
OUR_HOST_SUFFIXES = ("setlistpickem.com",)

# First-party crawlable surfaces + one competitor homepage (allowlisted).
# phishpicks.net 308s to phish.jampicks.com — one document GET of `/` only.
DEFAULT_URLS = [
    "https://www.setlistpickem.com/phish-setlist-prediction-game",
    "https://www.setlistpickem.com/tour-stats",
    "https://www.setlistpickem.com/tour-stats/2026-summer-tour",
    "https://www.setlistpickem.com/llms.txt",
    "https://phishpicks.net/",
]


def _is_our_host(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return any(host == s or host.endswith("." + s) for s in OUR_HOST_SUFFIXES)


def fetch_headings(url: str, *, allowlist: set[str]) -> dict:
    """Allowlisted GET that keeps HTML long enough to extract headings."""
    from urllib.error import HTTPError, URLError
    from urllib.request import Request, urlopen

    from crew.tools.stubs import FETCH_TIMEOUT_S, USER_AGENT

    refused = refuse_url(url)
    if refused:
        return {"ok": False, "message": refused, "extracted": None}
    host = (urlparse(url).hostname or "").lower()
    if not host_allowed(host, allowlist):
        return {"ok": False, "message": f"Host not on allowlist: {host}", "extracted": None}

    req = Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html,text/plain,*/*"},
        method="GET",
    )
    try:
        with urlopen(req, timeout=FETCH_TIMEOUT_S) as resp:  # noqa: S310 — allowlist + refuse gated
            status = getattr(resp, "status", None) or resp.getcode()
            content_type = (resp.headers.get("Content-Type") or "").split(";")[0].strip()
            raw = resp.read(80_000)
    except HTTPError as exc:
        return {"ok": False, "message": f"HTTP error {exc.code}", "status": exc.code, "extracted": None}
    except (URLError, TimeoutError) as exc:
        return {"ok": False, "message": f"URL error: {exc}", "extracted": None}

    text = raw.decode("utf-8", errors="replace")
    extracted = extract_title_headings(text)
    return {
        "ok": True,
        "message": "Fetched allowlisted URL (headings only)",
        "status": status,
        "content_type": content_type,
        "extracted": extracted,
    }


def run_scan(*, dry_run: bool, urls: list[str]) -> Path:
    if len(urls) > MAX_URLS_PER_RUN:
        raise SystemExit(
            f"Refused: {len(urls)} URLs exceeds MAX_URLS_PER_RUN={MAX_URLS_PER_RUN} "
            "(aggressive crawl guard)."
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out_md = OUTPUT_DIR / f"seo-gap-{day}-{stamp}.md"
    out_json = OUTPUT_DIR / f"seo-gap-{day}-{stamp}.json"

    allowlist = load_allowlist()
    registry = load_query_registry()
    queries = registry.get("queries") or []
    results: list[dict] = []

    lines = [
        f"# SEO title/H1 gap scan — {stamp}",
        "",
        f"- **Issue:** #933 · **Epic:** #926 · **Registry:** #931",
        f"- **Maturity:** L1 ({'dry_run' if dry_run else 'live fetch'})",
        f"- **Interval:** {MIN_FETCH_INTERVAL_S}s between live GETs · max {MAX_URLS_PER_RUN} URLs",
        f"- **Extract:** title + meta description + H1–H3 only (no article bodies, no setlists)",
        f"- **Refuse:** SERP HTML, ToS-omitted hosts, PII paths, off-allowlist, robots Disallow",
        f"- **Durable brief:** `content/marketing/933-competitor-title-h1-gap-brief.md`",
        f"- **Do not** recommend `/phish-picks` (#975 gated)",
        "",
        "## Fetches",
        "",
    ]

    last_live = 0.0
    for url in urls:
        if not dry_run and last_live:
            elapsed = time.monotonic() - last_live
            if elapsed < MIN_FETCH_INTERVAL_S:
                time.sleep(MIN_FETCH_INTERVAL_S - elapsed)

        refused = refuse_url(url)
        host = (urlparse(url).hostname or "").lower()
        our = _is_our_host(url)
        row: dict = {
            "url": url,
            "host": host,
            "our_host": our,
            "ok": False,
            "dry_run": dry_run,
            "extracted": None,
            "registry_matches": [],
            "watch_phrases": [],
            "gaps": None,
        }

        if refused:
            row["message"] = refused
        elif not host_allowed(host, allowlist):
            row["message"] = f"Host not on allowlist: {host}"
        elif dry_run:
            planned = web_fetch_allowlisted(url, dry_run=True, allowlist=allowlist)
            row["ok"] = planned.ok
            row["message"] = planned.message
        else:
            fetched = fetch_headings(url, allowlist=allowlist)
            last_live = time.monotonic()
            row["ok"] = bool(fetched.get("ok"))
            row["message"] = fetched.get("message", "")
            row["status"] = fetched.get("status")
            row["content_type"] = fetched.get("content_type")
            extracted = fetched.get("extracted")
            if extracted:
                row["extracted"] = extracted
                matches = match_registry_queries(extracted, queries)
                row["registry_matches"] = matches
                row["watch_phrases"] = match_watch_phrases(extracted)
                row["gaps"] = summarize_gaps(matches, our_host=our)

        results.append(row)

        lines.append(f"### {url}")
        lines.append("")
        lines.append(f"- ok: `{row.get('ok')}`")
        lines.append(f"- {row.get('message')}")
        extracted = row.get("extracted") or {}
        if extracted:
            if extracted.get("title"):
                lines.append(f"- **title:** {extracted['title']}")
            if extracted.get("meta_description"):
                lines.append(f"- **meta:** {extracted['meta_description']}")
            if extracted.get("h1"):
                lines.append(f"- **h1:** {'; '.join(extracted['h1'])}")
            if extracted.get("h2"):
                lines.append(f"- **h2:** {'; '.join(extracted['h2'][:8])}")
            if extracted.get("h3"):
                lines.append(f"- **h3:** {'; '.join(extracted['h3'][:8])}")
            if row.get("watch_phrases"):
                lines.append(f"- **watch phrases:** {', '.join(row['watch_phrases'])}")
            gaps = row.get("gaps") or {}
            if gaps.get("p0_hits"):
                lines.append(f"- **P0 hits:** {', '.join(gaps['p0_hits'])}")
            if gaps.get("p0_misses"):
                lines.append(f"- **P0 misses (expected on a competitor homepage):** {', '.join(gaps['p0_misses'])}")
        lines.append("")

    lines.extend(
        [
            "## Policy reminders",
            "",
            "- Aggregates only on `/tour-stats*` — never full night setlists.",
            "- No `/phish-picks` doorway (#975). C7 stays on `/phish-setlist-prediction-game` (#973).",
            "- Do not scrape Google/Bing SERP HTML. Do not commit this output.",
            "- Cadence: weekly with E1 pack (#932); optional post-show micro-sweep after a calendar night.",
            "",
            "## Marketing digest",
            "",
            "Promote durable findings into "
            "`content/marketing/933-competitor-title-h1-gap-brief.md` "
            "(Market Intel → Marketing Specialist → EiC). This file is ephemeral.",
            "",
        ]
    )

    out_md.write_text("\n".join(lines), encoding="utf-8")
    out_json.write_text(json.dumps(results, indent=2), encoding="utf-8")
    return out_md


def main() -> None:
    parser = argparse.ArgumentParser(description="L1 allowlisted SEO title/H1 scan (#933)")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Plan fetches only (no network)",
    )
    parser.add_argument(
        "--url",
        action="append",
        dest="urls",
        help="Override/add URL (repeatable). Default first-party + phishpicks.net homepage.",
    )
    args = parser.parse_args()
    urls = args.urls or DEFAULT_URLS
    path = run_scan(dry_run=args.dry_run, urls=urls)
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
