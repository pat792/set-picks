# Comms triggers & squad operating system

This directory is the **canonical home** for triggered, templated communications on Setlist Pick'em. The Cursor **comms squad** (four project skills under `.cursor/skills/comms-*`) operates on these artifacts.

## Documents

| File | Purpose |
|------|---------|
| [FRAMEWORK.md](./FRAMEWORK.md) | **TTDMOM** operating model: Trigger → Template → Deliver → Measure → Optimize → Monetize |
| [ECOSYSTEM.md](./ECOSYSTEM.md) | **Flow diagram + process descriptions** — event → orchestrator → channels → measurement, and the develop/curate/deploy/optimize processes |
| [TRIGGER_CATALOG.md](./TRIGGER_CATALOG.md) | Human-readable v1 trigger inventory (status, channels, prefs, dedup) |
| [catalog.json](./catalog.json) | Machine-readable trigger specs for agents and future orchestration |
| [MEASUREMENT_PLAN.md](./MEASUREMENT_PLAN.md) | GA4 comms events, dimensions, funnels |
| [CTA_ROUTE_AUDIT.md](./CTA_ROUTE_AUDIT.md) | In-app/email CTA label ↔ destination matrix (#551) |
| [EXPERIMENT_PLAYBOOK.md](./EXPERIMENT_PLAYBOOK.md) | A/B rules, variant assignment, ship/kill criteria |
| [OPTIMIZE_AUTONOMY.md](./OPTIMIZE_AUTONOMY.md) | **Optimize autonomy L0** — cycle order, PM pack template, draft-only gate (#573) |
| [EMAIL_INBOX_BADGE.md](./EMAIL_INBOX_BADGE.md) | Inbox sender badge (BIMI/DMARC) vs in-body email logo (#498) |
| [COMMERCIAL_PHASE3.md](./COMMERCIAL_PHASE3.md) | Sponsor / affiliate / offer gates (Phase 3) |

## Related repo paths

| Path | Role |
|------|------|
| `content/comms/` | Editorial drafts (drafter skill) |
| `src/features/comms/registry.js` | Recap template registry + supported channels |
| `src/features/notifications/ui/commsTemplates/commsTemplateRegistry.jsx` | In-app template renderer registry (`templateId` → body) |
| `src/features/comms/model/commsAnalytics.js` | Client comms measurement (opened/cta/push_tap/pref_changed) |
| `/comms-preview` (dev build) | In-app template preview gallery |
| `functions/commsDelivery.js` | Shared delivery orchestrator (#439) |
| `functions/commsCatalog.js` / `functions/commsTemplates.js` | Catalog + server template resolvers |
| `users/{uid}/commsInbox/{messageId}` | In-app channel worker (Admin SDK) |
| `functions/commsPushWorker.js` / `functions/fcmMessagingCore.js` | Push channel worker (FCM) |
| `functions/commsEmailWorker.js` | Email channel worker (Resend, #442) |
| `comms/emailBranding.cjs` | Shared in-body email logo URL |
| `fcm_notification_log` | Shared delivery / dedup log |

## Delivery model

Fully **automated and event-driven** (no manual War Room sends in production): system event → shared orchestrator → prefs/dedup/fatigue/render → `inApp` + `push` + `email` workers. See [FRAMEWORK.md](./FRAMEWORK.md) §"Layer 3 — DELIVER", [ECOSYSTEM.md](./ECOSYSTEM.md), and the [comms-architect skill](../../.cursor/skills/comms-architect/SKILL.md).

## GitHub epics

- **#441** — Fully-automated, event-driven comms across in-app, push & email (Resend)
- **#439** — Shared delivery orchestrator · **#440** — 7 v1 triggers · **#442** — Resend email channel
- **#272** — Push / in-app / email channel epic
- **#120** — In-app comms (inbox, toasts)
- **#370** / **#371** — Scheduled recap automation follow-ups
- **#573** — Optimize autonomy (playbook → scheduled packs → decisioning); start at [OPTIMIZE_AUTONOMY.md](./OPTIMIZE_AUTONOMY.md)

## Invoke the squad in Cursor

| Skill | Invoke when |
|-------|-------------|
| `comms-analyst` | Cohorts, GA4, engagement reports, experiment readouts |
| `comms-triggers` | New trigger specs, catalog updates, backlog grooming |
| `comms-drafter` | Copy in `content/comms/`, sync to implementation modules |
| `comms-architect` | Delivery pipeline, prefs, dedup, Cloud Functions, rollout |
