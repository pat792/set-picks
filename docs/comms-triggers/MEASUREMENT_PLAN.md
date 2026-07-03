# Comms measurement plan

Instrumentation for triggered communications. Mirrors the pattern in `docs/AUTH_TELEMETRY_RUNBOOK.md`.

GA4 property: **set-picks** (`527619709`). Comms events should register on **production only** (same gate as `src/shared/lib/ga4.js`).

## 1. Events to emit

Client engagement events use `ga4Event` via `src/features/comms/model/commsAnalytics.js`. Server delivery emits structured Cloud Logging **and** GA4 Measurement Protocol (`functions/commsGa4Measurement.js`, wired from `deliverCommsTrigger` on real non-dry-run channel success — #461).

| Event | When | Params |
|-------|------|--------|
| `comms_delivered` | Server wrote inbox row, sent FCM, or sent email (per channel) | `comms_trigger_id`, `comms_template_id`, `comms_channel`, `comms_variant` (MP + logs; `user_id` = Firebase uid on MP) |
| `comms_opened` | User opens inbox message or expands bell item | `trigger_id`, `template_id`, `channel`, `message_id` |
| `comms_dismissed` | User dismisses without reading | `trigger_id`, `template_id`, `message_id` |
| `comms_cta_click` | User taps CTA in message | `trigger_id`, `template_id`, `cta`, `destination` |
| `comms_push_tap` | Notification click opens app | `trigger_id`, `template_id`, `message_id` |
| `comms_pref_changed` | User toggles notification pref | `pref_key`, `enabled` |

### v1 requirement

Even single-variant templates pass `variant: control` on every `comms_*` event so A/B is a config change later.

## 2. GA4 custom dimensions (register once)

Admin → Property → Custom definitions → Event-scoped. Event parameter names match client + server emitters (`comms_*` prefix):

| Display name | Event parameter |
|--------------|-----------------|
| Comms trigger id | `comms_trigger_id` |
| Comms template id | `comms_template_id` |
| Comms channel | `comms_channel` |
| Comms variant | `comms_variant` |
| Comms CTA | `comms_cta` |

Also register auth dimensions from #291 (`method`, `error_code`) in the same Admin pass.

Historical data is not backfilled after registration.

### Server MP credentials (ops)

| Var | Where | Notes |
|-----|-------|-------|
| `GA4_MEASUREMENT_ID` | Functions param / `.env.set-picks` | Same `G-…` as `VITE_GA_MEASUREMENT_ID` |
| `GA4_MP_API_SECRET` | Secret Manager (`firebase functions:secrets:set GA4_MP_API_SECRET`) | GA4 Admin → Data stream → Measurement Protocol API secrets |

Gate: both set, project `set-picks`, not Functions emulator. Unset secret → no-op (safe for local/CI).

## 3. Funnels per trigger family

### Lifecycle (`first_login_welcome`, `profile_incomplete_nudge`, `return_after_14d`)

```text
Eligible users → comms_delivered → comms_opened → comms_cta_click → login within 7d / pick submitted
```

### Show calendar (`picks_lock_*`, `show_tonight_teaser`)

```text
Eligible → comms_delivered → comms_push_tap → pick submitted before lock
```

Primary metric: **pick submission rate before lock** among reminded users vs holdout (when experiments run).

### Results (`tour_recap_*`, `post_show_*`)

```text
Eligible → comms_delivered → comms_opened → dashboard visit within 24h
```

## 4. Analyst reporting cadence

| Cadence | Report |
|---------|--------|
| Weekly (show weeks) | Picks-lock funnel, push tap rate, pref opt-out rate |
| Monthly | Full catalog review: deliver/open/CTA by `trigger_id` |
| Per experiment | Variant comparison per EXPERIMENT_PLAYBOOK.md |

### Data sources

| Source | Use |
|--------|-----|
| GA4 MCP `run_report` | Event counts, cohorts |
| GA4 MCP `run_realtime_report` | Show-day spikes |
| Firestore | `fcm_notification_log` delivery counts, `commsInbox` readAt |
| Cloud Functions logs | Server-side `comms_delivered` audit (always) |
| GA4 MP (`comms_delivered`) | Server delivery counts in GA4 (when MP secret bound) |

## 5. Squad KPIs

| Phase | KPI |
|-------|-----|
| V1 | 100% P0 triggers log `comms_delivered`; zero duplicate dedup failures |
| Optimize | Statistically significant lift on primary metric for ≥1 experiment |
| Monetize | Sponsor CTR without ↑ `comms_pref_changed` (commercial off) |

## 6. Implementation checklist (per new trigger)

- [ ] `trigger_id` in catalog.json matches GA4 param
- [ ] Server logs delivery with template_id + variant
- [ ] Client logs open/CTA in inbox UI (`CommsInboxSection`, push deep links)
- [ ] Custom dimensions registered before launch
- [ ] Dry-run QA on staging preview (human browser for inbox UI)
