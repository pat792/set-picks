"""L1 market intel sweep — allowlisted read-only fetches → local markdown.

Usage (from repo root):
  python3.13 -m crew.scripts.market_intel_sweep
  python3.13 -m crew.scripts.market_intel_sweep --dry-run

Output lands in crew/output/intel/ (gitignored). Epic #695.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from crew.tools.allowlist import load_allowlist
from crew.tools.stubs import web_fetch_allowlisted

CREW_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = CREW_ROOT / "output" / "intel"

# First-wave sources: our own public surfaces + GitHub (allowlisted)
DEFAULT_URLS = [
    "https://www.setlistpickem.com/",
    "https://www.setlistpickem.com/llms.txt",
    "https://www.setlistpickem.com/sitemap.xml",
    "https://www.setlistpickem.com/robots.txt",
    "https://github.com/pat792/set-picks",
]


def run_sweep(*, dry_run: bool, urls: list[str]) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_md = OUTPUT_DIR / f"sweep-{stamp}.md"
    out_json = OUTPUT_DIR / f"sweep-{stamp}.json"

    allowlist = load_allowlist()
    results = []
    lines = [
        f"# Market intel sweep — {stamp}",
        "",
        f"- **Maturity:** L1 ({'dry_run' if dry_run else 'live fetch'})",
        f"- **Epic:** #695",
        f"- **Allowlist hosts:** {', '.join(sorted(allowlist))}",
        "",
        "## Fetches",
        "",
    ]

    for url in urls:
        result = web_fetch_allowlisted(url, dry_run=dry_run, allowlist=allowlist)
        payload = {
            "url": url,
            "ok": result.ok,
            "dry_run": result.dry_run,
            "message": result.message,
            "data": {k: v for k, v in result.data.items() if k != "excerpt"},
        }
        if result.data.get("excerpt"):
            payload["excerpt_preview"] = result.data["excerpt"][:500]
        results.append(payload)

        lines.append(f"### {url}")
        lines.append("")
        lines.append(f"- ok: `{result.ok}`")
        lines.append(f"- {result.message}")
        if result.data.get("status") is not None:
            lines.append(f"- status: `{result.data.get('status')}`")
        if result.data.get("content_type"):
            lines.append(f"- content-type: `{result.data['content_type']}`")
        excerpt = result.data.get("excerpt")
        if excerpt:
            lines.append("")
            lines.append("<details><summary>Excerpt</summary>")
            lines.append("")
            lines.append("```")
            lines.append(excerpt[:2000])
            lines.append("```")
            lines.append("")
            lines.append("</details>")
        lines.append("")

    lines.extend(
        [
            "## Marketing digest (stub)",
            "",
            "Synthesize implications for acquisition/SEO in a follow-up with "
            "`marketing-specialist` / `customer-insights-analyst` skills. "
            "This sweep only collects allowlisted public text.",
            "",
            "## Adaptation note",
            "",
            "If hosts or URLs should change, edit `crew/knowledge/allowlists/domains.md` "
            "and comment on epic #695.",
            "",
        ]
    )

    out_md.write_text("\n".join(lines), encoding="utf-8")
    out_json.write_text(json.dumps(results, indent=2), encoding="utf-8")
    return out_md


def main() -> None:
    parser = argparse.ArgumentParser(description="L1 allowlisted market intel sweep")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Plan fetches only (no network)",
    )
    parser.add_argument(
        "--url",
        action="append",
        dest="urls",
        help="Override/add URL (repeatable). Default set used if omitted.",
    )
    args = parser.parse_args()
    urls = args.urls or DEFAULT_URLS
    path = run_sweep(dry_run=args.dry_run, urls=urls)
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
