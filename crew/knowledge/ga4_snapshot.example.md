# GA4 snapshot — example schema (not live data)

- **Property:** `527619709`
- **Window:** `last_7_days`
- **Source:** replace via `python -m crew.scripts.ga4_snapshot` or Cursor GA4 MCP + `--from-file`

## Facts-only rules for crew agents

1. Cite **only** numbers that appear in a real snapshot file under `crew/output/intel/`.
2. If a metric is missing, write **`unknown`** — never invent percentages.
3. `picks_lock` = reminder/comms → open/CTA → pick before lock.

## Event counts (filtered)

| eventName | eventCount | totalUsers |
|-----------|------------|------------|
| `comms_delivered` | unknown | unknown |
| `submit_picks` | unknown | unknown |

See issue #697 and `docs/GA4_MCP_SETUP.md`.
