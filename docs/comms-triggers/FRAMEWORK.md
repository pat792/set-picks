# TTDMOM — Comms operating framework

**Trigger → Template → Deliver → Measure → Optimize → Monetize**

This framework governs how the comms squad develops triggered, templated communications that deploy automatically to eligible users, then iterates with analytics and experiments, and eventually introduces commercial slots.

## Principles

1. **No message ships without a Trigger Spec** in [TRIGGER_CATALOG.md](./TRIGGER_CATALOG.md) and [catalog.json](./catalog.json).
2. **Templates are versioned** (`v1.0.0` semver) and registered in `src/features/comms/registry.js`.
3. **Delivery is server-orchestrated** — Cloud Functions / Admin SDK only; clients never create inbox rows.
4. **Measurement hooks ship with v1** — even single-variant templates log `variant: control` for future A/B.
5. **Commercial comms are a separate class** — gated until Phase 3 criteria in [COMMERCIAL_PHASE3.md](./COMMERCIAL_PHASE3.md).

## Phases

| Phase | Goal | Exit criteria |
|-------|------|---------------|
| **1 — V1 baseline** | Reliable triggered comms for P0/P1 events | Every P0 row in catalog is `shipped` or `in_progress` with dry-run + dedup + prefs |
| **2 — Optimize** | Improve engagement and retention | [EXPERIMENT_PLAYBOOK.md](./EXPERIMENT_PLAYBOOK.md) live; monthly catalog review |
| **3 — Monetize** | Sponsor / affiliate / offer slots | Commercial gates met; `commercial` templates in registry |

## Layer 1 — TRIGGER

A **Trigger Spec** defines *what fires*, not copy.

Required fields: `triggerId`, `eventSource`, `eventCondition`, `audience`, `eligibility`, `channels`, `templateId`, `dedupKey`, `priority`, `phase`, `status`.

### Trigger taxonomy

| Family | Examples |
|--------|----------|
| `lifecycle` | First login, profile incomplete, return after N days |
| `show_calendar` | Picks lock reminders, show tonight |
| `live_game` | Post-show win/near-miss, live setlist (prefs-gated) |
| `results_recap` | Tour/show recap (Sphere model) |
| `social_pools` | Pool invite, standings (future) |
| `system` | Push canary, ops-only |
| `commercial` | Sponsor footer, affiliate CTA (Phase 3 only) |

### Priority

| Priority | Meaning |
|----------|---------|
| **P0** | Lifecycle + picks lock — ship in v1 wave 1–2 |
| **P1** | Engagement + results — v1 wave 2–3 |
| **P2** | Experimental / live realtime |
| **P3** | Commercial |

## Layer 2 — TEMPLATE

Templates link editorial drafts to runtime builders.

| Artifact | Location |
|----------|----------|
| Editorial draft | `content/comms/tours/`, `shows/`, `lifecycle/` |
| Runtime builders | `src/features/<domain>/model/` |
| Registry | `src/features/comms/registry.js` |
| In-app renderer | `src/features/notifications/ui/` |

### Channel strategy

| Channel | Use |
|---------|-----|
| `inApp` | Rich personalized body in `commsInbox` |
| `push` | Short teaser + deep link (often → inbox) |
| `emailAbbreviated` | Re-engagement subject + CTA |
| `emailFull` | Long-form recap (#272) |

**Proven v1 pattern:** push tease → full message in inbox (Sphere recap).

## Layer 3 — DELIVER

```text
Event → Orchestrator → registry + prefs + dedup → channel writers
```

### Non-negotiables

- **Idempotency** — `fcm_notification_log` or fixed `commsInbox` doc id
- **Prefs** — `notificationPrefs.reminders`, `.results`, `.nearMiss`, etc.
- **Dry run** — callables default `dryRun: true` before execute
- **Rollout** — canary user → cohort % → full audience

### Implementation types

| Type | When |
|------|------|
| `scheduled` | Picks lock window, nightly cohort jobs |
| `event_driven` | Firestore `onCreate` / auth lifecycle |
| `batch` | Tour recap aggregation |
| `realtime` | Live setlist poll hooks (P2) |

## Layer 4 — MEASURE

See [MEASUREMENT_PLAN.md](./MEASUREMENT_PLAN.md). Every trigger owns a funnel:

```text
Eligible → Delivered → Opened/Tapped → CTA → Retention action
```

## Layer 5 — OPTIMIZE

Monthly cadence (show weeks: weekly):

1. **Analyst** — cohort + funnel report
2. **Triggers** — update catalog (new / deprecate)
3. **Drafter** — copy revisions (new semver)
4. **Architect** — channel mix, experiments, rollout

Fatigue caps: max pushes per user per show day; suppress P2 when P0 fired same day.

## Layer 6 — MONETIZE

See [COMMERCIAL_PHASE3.md](./COMMERCIAL_PHASE3.md). Commercial never overrides P0 lifecycle or picks-lock messages.

## V1 launch waves

| Wave | Triggers | Type | Notes |
|------|----------|------|-------|
| W0 | `picks_lock_reminder` | `automated` | Shipped; push-only today |
| W1 | `account_welcome` | `event_triggered` | Firestore onCreate |
| W1 | `picks_confirmed` | `event_triggered` | Picks locked confirmation |
| W2 | `tour_countdown` | `automated` | Daily cron T-10/5/1 |
| W2 | `tour_engagement_reminder` | `event_triggered` | After show 1 graded |
| W3 | `show_recap` | `event_triggered` | After grading; replaces Sphere one-off |
| W3 | `tour_rankings_daily` | `automated` | Next-morning standings |
| W4 | `score_first_points` | `event_triggered` | Live scoring hook |
| W4 | `score_leader` | `event_triggered` | Live leaderboard hook |
| W5 | A/B on W1–W3 copy | — | Requires measurement baseline |
| Phase 3 | `commercial_sponsor_recap_footer` | — | After W5 gates |

## Squad RACI

| Layer | Analyst | Triggers | Drafter | Architect |
|-------|---------|----------|---------|-----------|
| TRIGGER | Cohorts | Specs | — | Orchestration |
| TEMPLATE | Variant ideas | templateId link | Copy + tests | Channels |
| DELIVER | Canary metrics | QA checklist | Preview | CF deploy |
| MEASURE | Reports | Catalog updates | Copy proposals | Instrumentation |
| OPTIMIZE | Experiment design | Backlog | Variants | Rollout |
| MONETIZE | ROI tiers | Commercial specs | Sponsor copy | Slots + caps |
