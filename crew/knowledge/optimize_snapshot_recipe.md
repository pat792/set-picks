# Optimize GA4 snapshot recipe (Leadership + squad)

**Property:** `527619709` · **Canon:** `docs/comms-triggers/MEASUREMENT_PLAN.md`  
**Lesson (2026-07-20):** Aggregate `comms_opened` / `comms_cta_click` **understate email**. Never conclude “no lock-reminder engagement” from those events alone.

## Minimum sections every `picks_lock` snapshot MUST include

Fill via Cursor GA4 MCP (`run_report`), then `ga4_snapshot --from-file` (or paste into `crew/output/intel/`).

### A — Aggregate events (existing)

`comms_delivered`, `comms_opened`, `comms_cta_click`, `picks_page_interactive`, `submit_picks`, `edit_picks`, plus context (`session_start`, `login`, …). Window: `7daysAgo` → `yesterday` (or stated window). Prefer **this vs prior 7d**.

### B — Trigger × channel (`comms_*` custom dims)

Filter `eventName` in (`comms_delivered`, `comms_opened`, `comms_cta_click`).  
Dimensions: `eventName`, `customEvent:comms_trigger_id`, `customEvent:comms_channel`.  
**Required row:** `picks_lock_reminder` × `inApp` | `email` | `push`.

### C — Email engagement proxy (UTM sessions) — **mandatory**

Do **not** use `comms_cta_click` for email CTAs (inbox-only). Instead:

| Filter | Dimensions | Metrics |
|--------|------------|---------|
| `sessionSource` = `email` **or** `sessionMedium` = `comms` | `eventName`, `sessionCampaignName`, `sessionManualAdContent`, `sessionSource`, `sessionMedium` | `eventCount`, `totalUsers` |

Highlight rows where `sessionManualAdContent` / campaign contains `picks-lock-reminder` / `picks_lock_reminder` for:

- `session_start`
- `picks_page_interactive`
- `submit_picks`
- `edit_picks`
- `comms_email_landed` (often under-fires — note if sparse)

### D — Send-hour vs picks hour (suggestive only)

- `comms_delivered` + `picks_lock_reminder` by `hour` × `customEvent:comms_channel`
- `submit_picks` / `picks_page_interactive` by `hour`  
Label **HYPOTHESIS** until delivery-log join (#698).

## Channel-plane cheat sheet

| Channel | Open / attention | Click / land | Conversion |
|---------|------------------|--------------|------------|
| **inApp** | `comms_opened` | `comms_cta_click` | `submit_picks` (join via #698) |
| **email** | Resend opens (#512) — **not** in GA today | UTM sessions (`email`/`comms`) + `comms_email_landed` | `submit_picks` in those sessions |
| **push** | `comms_push_tap` / open instrumentation | deep link land | `submit_picks` |

## Challenge rule (pipeline `challenge_evidence`)

Before the final pack ships, Data Architect / Insights must list **≥2 alternate planes** (UTM, Resend, delivery-log, push tap) that could **falsify** an “open cliff” claim, or mark them `unknown` with a follow-up MCP query list. Agents may **request** additional MCP queries; they must not invent numbers.
