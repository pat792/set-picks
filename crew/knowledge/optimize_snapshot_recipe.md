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
Label **HYPOTHESIS** for hour-of-day patterns; prefer §E for true conversion %.

### E — Delivery-log ↔ picks conversion (#698) — **required for `optimize_for=picks_lock`**

```bash
npm run comms:picks-lock-conversion -- --days 14 --write
# or: --show-dates 2026-07-31,2026-08-01 --write
```

Artifact: `crew/output/intel/picks_lock-conversion-<stamp>.md`

| Join | Definition |
|------|------------|
| Delivery cohort | `fcm_notification_log` where `triggerId=picks_lock_reminder`, doc id `reminder_{YYYY-MM-DD}_{uid}` |
| Converted before lock | Non-empty `picks/{showDate}_{uid}` with `updatedAt` &lt; venue-local lock (`resolvePicksLockHm` + show `timeZone`; earlier `show_lock_state.picksLockedAt` wins) |
| Channel split | Non-exclusive over `channels[]` (successful send planes) |

If the file is missing, pack `submit (attrib)` = `unknown` and score `WAIT_EVIDENCE: #698` / re-run the CLI. Do **not** invent conversion % from GA4 aggregates alone.

## Channel-plane cheat sheet

| Channel | Open / attention | Click / land | Conversion |
|---------|------------------|--------------|------------|
| **inApp** | `comms_opened` | `comms_cta_click` | §E delivery-log join |
| **email** | Resend opens (#512) — **not** in GA today | UTM sessions (`email`/`comms`) + `comms_email_landed` | §E (channel row) + UTM submit proxy |
| **push** | `comms_push_tap` / open instrumentation | deep link land | §E (channel row) |

## Challenge rule (pipeline `challenge_evidence`)

Before the final pack ships, Data Architect / Insights must list **≥2 alternate planes** (UTM, Resend, delivery-log, push tap) that could **falsify** an “open cliff” claim, or mark them `unknown` with a follow-up MCP query list. Agents may **request** additional MCP queries; they must not invent numbers.
