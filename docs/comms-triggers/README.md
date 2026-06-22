# Comms triggers & squad operating system

This directory is the **canonical home** for triggered, templated communications on Setlist Pick'em. The Cursor **comms squad** (four project skills under `.cursor/skills/comms-*`) operates on these artifacts.

## Documents

| File | Purpose |
|------|---------|
| [FRAMEWORK.md](./FRAMEWORK.md) | **TTDMOM** operating model: Trigger → Template → Deliver → Measure → Optimize → Monetize |
| [TRIGGER_CATALOG.md](./TRIGGER_CATALOG.md) | Human-readable v1 trigger inventory (status, channels, prefs, dedup) |
| [catalog.json](./catalog.json) | Machine-readable trigger specs for agents and future orchestration |
| [MEASUREMENT_PLAN.md](./MEASUREMENT_PLAN.md) | GA4 comms events, dimensions, funnels |
| [EXPERIMENT_PLAYBOOK.md](./EXPERIMENT_PLAYBOOK.md) | A/B rules, variant assignment, ship/kill criteria |
| [COMMERCIAL_PHASE3.md](./COMMERCIAL_PHASE3.md) | Sponsor / affiliate / offer gates (Phase 3) |

## Related repo paths

| Path | Role |
|------|------|
| `content/comms/` | Editorial drafts (drafter skill) |
| `src/features/comms/registry.js` | Template registry + supported channels |
| `users/{uid}/commsInbox/{messageId}` | In-app delivery |
| `fcm_notification_log` | Push dedup log |
| `functions/*` | Orchestration (architect skill) |

## GitHub epics

- **#272** — Push / in-app / email channel epic
- **#120** — In-app comms (inbox, toasts)
- **#370** / **#371** — Scheduled recap automation follow-ups

## Invoke the squad in Cursor

| Skill | Invoke when |
|-------|-------------|
| `comms-analyst` | Cohorts, GA4, engagement reports, experiment readouts |
| `comms-triggers` | New trigger specs, catalog updates, backlog grooming |
| `comms-drafter` | Copy in `content/comms/`, sync to implementation modules |
| `comms-architect` | Delivery pipeline, prefs, dedup, Cloud Functions, rollout |
