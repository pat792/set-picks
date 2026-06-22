# Comms measurement plan

Instrumentation for triggered communications. Mirrors the pattern in `docs/AUTH_TELEMETRY_RUNBOOK.md`.

GA4 property: **set-picks** (`527619709`). Comms events should register on **production only** (same gate as `src/shared/lib/ga4.js`).

## 1. Events to emit

Deliver through a future `src/features/comms/model/commsAnalytics.js` (or extend `authAnalytics` only where lifecycle overlaps). Client events use `ga4Event`; server delivery logs use Cloud Functions structured logs + optional GA4 Measurement Protocol.

| Event | When | Params |
|-------|------|--------|
| `comms_delivered` | Server wrote inbox row or sent FCM | `trigger_id`, `template_id`, `channel`, `variant`, `message_id` |
| `comms_opened` | User opens inbox message or expands bell item | `trigger_id`, `template_id`, `channel`, `message_id` |
| `comms_dismissed` | User dismisses without reading | `trigger_id`, `template_id`, `message_id` |
| `comms_cta_click` | User taps CTA in message | `trigger_id`, `template_id`, `cta`, `destination` |
| `comms_push_tap` | Notification click opens app | `trigger_id`, `template_id`, `message_id` |
| `comms_pref_changed` | User toggles notification pref | `pref_key`, `enabled` |

### v1 requirement

Even single-variant templates pass `variant: control` on every `comms_*` event so A/B is a config change later.

## 2. GA4 custom dimensions (register once)

Admin → Property → Custom definitions → Event-scoped:

| Display name | Event parameter |
|--------------|-----------------|
| `comms_trigger_id` | `trigger_id` |
| `comms_template_id` | `template_id` |
| `comms_channel` | `channel` |
| `comms_variant` | `variant` |
| `comms_cta` | `cta` |

Historical data is not backfilled after registration.

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
| Cloud Functions logs | Server-side `comms_delivered` audit |

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
