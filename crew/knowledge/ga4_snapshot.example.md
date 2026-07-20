# GA4 snapshot — example schema (not live data)

- **Property:** `527619709`
- **Window:** `last_7_days`
- **Source:** replace via `python -m crew.scripts.ga4_snapshot` or Cursor GA4 MCP + `--from-file`
- **Recipe:** `crew/knowledge/optimize_snapshot_recipe.md` (sections A–D)

## Facts-only rules for crew agents

1. Cite **only** numbers that appear in a real snapshot file under `crew/output/intel/`.
2. If a metric is missing, write **`unknown`** — never invent percentages.
3. `picks_lock` = reminder/comms → open/CTA → pick before lock.
4. `comms_opened` / `comms_cta_click` ≠ email opens/clicks — require §C UTM rows before judging email.

## A — Event counts (filtered)

| eventName | eventCount | totalUsers |
|-----------|------------|------------|
| `comms_delivered` | unknown | unknown |
| `comms_opened` | unknown | unknown |
| `comms_cta_click` | unknown | unknown |
| `picks_page_interactive` | unknown | unknown |
| `submit_picks` | unknown | unknown |

## B — Trigger × channel

| trigger_id | channel | eventName | eventCount | totalUsers |
|------------|---------|-----------|------------|------------|
| `picks_lock_reminder` | email | `comms_delivered` | unknown | unknown |

## C — Email UTM proxy

| sessionSource | sessionMedium | content | eventName | eventCount | totalUsers |
|---------------|---------------|---------|-----------|------------|------------|
| email | comms | picks-lock-reminder | `submit_picks` | unknown | unknown |

See issue #697, #698, and `docs/GA4_MCP_SETUP.md`.
