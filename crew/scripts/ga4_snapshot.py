"""Fetch a GA4 facts snapshot for Leadership Ops Optimize (#697).

Uses Application Default Credentials (same as docs/GA4_MCP_SETUP.md).
Default property: 527619709 (override with GA4_PROPERTY_ID).

Usage:
  crew/.venv/bin/python -m crew.scripts.ga4_snapshot
  crew/.venv/bin/python -m crew.scripts.ga4_snapshot --window last_7_days
  crew/.venv/bin/python -m crew.scripts.ga4_snapshot --from-file path/to/export.md

Or export via Cursor GA4 MCP and pass --from-file.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

CREW_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = CREW_ROOT.parent
INTEL_DIR = CREW_ROOT / "output" / "intel"
DEFAULT_PROPERTY = os.environ.get("GA4_PROPERTY_ID", "527619709")

PICKS_LOCK_EVENTS = [
    "comms_delivered",
    "comms_opened",
    "comms_cta_click",
    "submit_picks",
    "edit_picks",
    "picks_page_interactive",
    "login",
    "session_start",
    "first_visit",
    "sign_up",
    "push_nudge_cta_clicked",
]


def _window_to_dates(window: str) -> tuple[str, str]:
    w = window.strip().lower().replace(" ", "_")
    if w in {"last_7_days", "7days", "7d"}:
        return "7daysAgo", "yesterday"
    if w in {"last_14_days", "14days", "14d"}:
        return "14daysAgo", "yesterday"
    if w in {"last_30_days", "30days", "30d"}:
        return "30daysAgo", "yesterday"
    # Pass-through custom: start,end
    if "," in window:
        start, end = window.split(",", 1)
        return start.strip(), end.strip()
    return "7daysAgo", "yesterday"


def fetch_ga4_rows(property_id: str, start: str, end: str) -> list[dict[str, str]]:
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange,
        Dimension,
        Filter,
        FilterExpression,
        Metric,
        OrderBy,
        RunReportRequest,
    )

    client = BetaAnalyticsDataClient()
    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[Dimension(name="eventName")],
        metrics=[Metric(name="eventCount"), Metric(name="totalUsers")],
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimension_filter=FilterExpression(
            filter=Filter(
                field_name="eventName",
                in_list_filter=Filter.InListFilter(
                    values=PICKS_LOCK_EVENTS,
                    case_sensitive=True,
                ),
            )
        ),
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="eventCount"), desc=True)],
        limit=50,
    )
    response = client.run_report(request)
    rows: list[dict[str, str]] = []
    for row in response.rows:
        rows.append(
            {
                "eventName": row.dimension_values[0].value,
                "eventCount": row.metric_values[0].value,
                "totalUsers": row.metric_values[1].value,
            }
        )
    return rows


def render_markdown(
    *,
    property_id: str,
    window: str,
    start: str,
    end: str,
    rows: list[dict[str, str]],
    source: str,
) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        f"# GA4 snapshot — picks_lock evidence",
        "",
        f"- **Generated:** {stamp}",
        f"- **Property:** `{property_id}`",
        f"- **Window label:** `{window}`",
        f"- **Date range:** `{start}` → `{end}`",
        f"- **Source:** {source}",
        f"- **Issues:** #697 / epic #695",
        "",
        "## Facts-only rules for crew agents",
        "",
        "1. Cite **only** numbers that appear in this file.",
        "2. If a metric is missing, write **`unknown`** — never invent percentages or baselines.",
        "3. Optimize goal `picks_lock` = reminder/comms → open/CTA → pick submitted before lock.",
        "4. Do not expand into generic acquisition/social OKRs unless optimize_for says so.",
        "5. **Email plane:** `comms_opened` / `comms_cta_click` are in-app (not Resend opens / email clicks).",
        "   If those are ~0 for an email-heavy trigger, require UTM session rows (§C) or mark email engagement **unknown**.",
        "6. Full recipe: `crew/knowledge/optimize_snapshot_recipe.md` (sections A–D).",
        "",
        "## Event counts (filtered)",
        "",
        "| eventName | eventCount | totalUsers |",
        "|-----------|------------|------------|",
    ]
    for r in rows:
        lines.append(
            f"| `{r['eventName']}` | {r['eventCount']} | {r['totalUsers']} |"
        )
    if not rows:
        lines.append("| _(no rows)_ | — | — |")

    # Highlight picks_lock-ish funnel if present
    by_name = {r["eventName"]: r for r in rows}
    lines.extend(
        [
            "",
            "## picks_lock funnel lens (raw counts only)",
            "",
            f"- `comms_delivered`: {by_name.get('comms_delivered', {}).get('eventCount', 'unknown')}",
            f"- `comms_opened`: {by_name.get('comms_opened', {}).get('eventCount', 'unknown')}",
            f"- `comms_cta_click`: {by_name.get('comms_cta_click', {}).get('eventCount', 'unknown')}",
            f"- `picks_page_interactive`: {by_name.get('picks_page_interactive', {}).get('eventCount', 'unknown')}",
            f"- `submit_picks`: {by_name.get('submit_picks', {}).get('eventCount', 'unknown')}",
            f"- `edit_picks`: {by_name.get('edit_picks', {}).get('eventCount', 'unknown')}",
            "",
            "## B — Trigger × channel (fill via MCP or mark unknown)",
            "",
            "| trigger_id | channel | eventName | eventCount | totalUsers |",
            "|------------|---------|-----------|------------|------------|",
            "| `picks_lock_reminder` | inApp / email / push | delivered / opened / cta | unknown | unknown |",
            "",
            "_ADC `ga4_snapshot` without MCP only fills §A. Cursor must add §B–§C before Optimize pack._",
            "",
            "## C — Email UTM proxy (mandatory for picks_lock)",
            "",
            "| sessionSource | sessionMedium | campaign / content | eventName | eventCount | totalUsers |",
            "|---------------|---------------|--------------------|-----------|------------|------------|",
            "| email | comms | picks-lock-reminder | session_start / picks_page_interactive / submit_picks | unknown | unknown |",
            "",
            "_If this table stays unknown, do **not** claim email lock-reminder has zero engagement._",
            "",
            "## Machine JSON",
            "",
            "```json",
            json.dumps(
                {
                    "property_id": property_id,
                    "window": window,
                    "start": start,
                    "end": end,
                    "rows": rows,
                    "recipe": "crew/knowledge/optimize_snapshot_recipe.md",
                    "sections_required": ["A_aggregates", "B_trigger_channel", "C_email_utm"],
                },
                indent=2,
            ),
            "```",
            "",
        ]
    )
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))

    parser = argparse.ArgumentParser(description="Write GA4 facts snapshot for Optimize")
    parser.add_argument("--window", default="last_7_days")
    parser.add_argument("--property-id", default=DEFAULT_PROPERTY)
    parser.add_argument(
        "--from-file",
        type=Path,
        help="Copy/normalize an existing MCP export instead of calling the API",
    )
    parser.add_argument(
        "--out",
        type=Path,
        help="Output path (default: crew/output/intel/ga4-picks_lock-<stamp>.md)",
    )
    args = parser.parse_args(argv)

    INTEL_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = args.out or (INTEL_DIR / f"ga4-picks_lock-{stamp}.md")

    if args.from_file:
        text = args.from_file.read_text(encoding="utf-8")
        header = (
            f"<!-- Imported for crew Optimize; source={args.from_file} -->\n"
            f"<!-- Facts-only: do not invent metrics beyond this file. -->\n\n"
        )
        out.write_text(header + text, encoding="utf-8")
        print(f"Wrote {out}")
        return 0

    start, end = _window_to_dates(args.window)
    try:
        rows = fetch_ga4_rows(args.property_id, start, end)
    except Exception as exc:  # noqa: BLE001
        print(
            f"ERROR: GA4 fetch failed ({exc}).\n"
            "Fix ADC per docs/GA4_MCP_SETUP.md, or export via Cursor GA4 MCP and use --from-file.",
            file=sys.stderr,
        )
        return 1

    md = render_markdown(
        property_id=str(args.property_id),
        window=args.window,
        start=start,
        end=end,
        rows=rows,
        source="google-analytics-data (ADC)",
    )
    out.write_text(md, encoding="utf-8")
    print(f"Wrote {out} ({len(rows)} events)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
