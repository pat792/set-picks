# Backlog groom — 2026-05-20

> **2026-05-20 follow-up:** Creating Sprint 6 via `updateProjectV2Field` initially **replaced** the iteration list and orphaned Sprint 1–4 IDs on closed issues. Restored by redefining all six sprints (1–4 appear under **completed iterations** on the project) and bulk-reassigning board items from a pre-groom snapshot + close-date fallback. Do not call `updateProjectV2Field` with only new iterations — always include the full sprint history.
>
> **Sprint 1 correction:** The close-date fallback wrongly assigned ~19 pre-board issues to Sprint 1 (API showed 20; GitHub UI showed **0** because those items were never on the board during Sprint 1). Accurate Sprint 1 = **[#87](https://github.com/pat792/set-picks/issues/87) only** (board snapshot). Sprint 1 iteration extended to **21 days** (through 2026-04-10) so #87’s Apr 9 close date appears under the completed sprint filter.

**Sprint:** [Sprint 5: Growth & Engagement](https://github.com/users/pat792/projects/1) (2026-05-16 → 2026-05-30)

**Signals:** GA4 last 30 days (property `527619709`, production hostnames only).

## Engagement snapshot

| Surface | Page views | Insight |
|---------|------------|---------|
| `/dashboard/standings` | 2,863 | Core loop; `view_leaderboard` 3,092 events |
| `/dashboard` (Picks) | 876 | Second hub |
| `/` (splash) | 745 | Acquisition; 120 `first_visit` |
| `/dashboard/pools` | 715 | Social growth |
| `/dashboard/profile` | 508 | Settings + install + notifications entry |
| `/join/*` | 61+ | Invite funnel — OG/SEO matter |

**Users:** 121 new vs 31 returning (30d); returning users drive session volume (543 sessions). Focus = **convert new → repeat** and **deepen standings/pools**.

## Sprint 5 — committed (after groom)

| Issue | Rationale |
|-------|-----------|
| [#295](https://github.com/pat792/set-picks/issues/295) | Past tours picker — standings is #1 surface |
| [#339](https://github.com/pat792/set-picks/issues/339) | Public SEO routes — splash + discovery |
| [#128](https://github.com/pat792/set-picks/issues/128) | Dynamic OG for `/join` links |
| [#272](https://github.com/pat792/set-picks/issues/272) | PWA / install epic — `a2hs_*` telemetry active |
| [#383](https://github.com/pat792/set-picks/issues/383), [#384](https://github.com/pat792/set-picks/issues/384) | PWA perf + push UX |
| [#120](https://github.com/pat792/set-picks/issues/120) | In-app comms for lifecycle emails |
| [#370](https://github.com/pat792/set-picks/issues/370) | **Added** — comms templates → inbox |
| [#291](https://github.com/pat792/set-picks/issues/291) | **Added** — GA4 `method` / `error_code` for auth funnel |
| [#328](https://github.com/pat792/set-picks/issues/328) | **Added** — quick standings UX win |
| [#417](https://github.com/pat792/set-picks/issues/417) | **Added** — pool standings fairness (pools traffic) |
| [#418](https://github.com/pat792/set-picks/issues/418) | **Added** — Profile cluster epic (profile PVs) |

## Moved to backlog (cleared Sprint)

| Issue | Rationale |
|-------|-----------|
| [#145](https://github.com/pat792/set-picks/issues/145) | Firestore rename — tech debt, no engagement lift |
| [#168](https://github.com/pat792/set-picks/issues/168) | Catalog observability — ops, not growth sprint |
| [#122](https://github.com/pat792/set-picks/issues/122) | UX analysis — research, not shippable slice |
| [#227](https://github.com/pat792/set-picks/issues/227) | Bustout tiers — defer behind tour/standings UX |
| [#42](https://github.com/pat792/set-picks/issues/42) | Stale Sprint 2 assignment on closed epic track |

## Deferred (no sprint) — platform / monetization

| Issue | Rationale |
|-------|-----------|
| [#419](https://github.com/pat792/set-picks/issues/419)–[#423](https://github.com/pat792/set-picks/issues/423) | Ads program — monetization after engagement base; #121 Phase 1 not sprint-critical |
| [#300](https://github.com/pat792/set-picks/issues/300), [#301](https://github.com/pat792/set-picks/issues/301) | Multi-band — expansion, not current-user retention |
| [#411](https://github.com/pat792/set-picks/issues/411)–[#416](https://github.com/pat792/set-picks/issues/416) | Security epic — important; schedule Sprint 6 or parallel ops window |
| [#80](https://github.com/pat792/set-picks/issues/80) | Perf epic — revisit before next tour spike |
| [#396](https://github.com/pat792/set-picks/issues/396) | Re-consent — compliance, not growth |

## Sprint 6 — placeholders (2026-05-30 → 2026-06-13)

**Iteration:** `Sprint 6: Platform hardening & scale` on [project #1](https://github.com/users/pat792/projects/1).

| Placeholder | Issue | Pulls in |
|-------------|-------|----------|
| Security & platform hardening | [#424](https://github.com/pat792/set-picks/issues/424) | #411–#416 (linked: #411, #412 on board) |
| Multi-band expansion | [#425](https://github.com/pat792/set-picks/issues/425) | #300, #301 (linked: #301) |
| Monetization & ads | [#426](https://github.com/pat792/set-picks/issues/426) | #419–#423 (linked: #121) |
| Tech debt, compliance & game depth | [#427](https://github.com/pat792/set-picks/issues/427) | #145, #168, #396, #227, #122, #80, #42 |

Plan Sprint 6 during Sprint 5 closeout; expand placeholders into concrete sprint commits.
