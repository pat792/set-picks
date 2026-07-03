# Release train — Sprint 5/6 rollup

**Goal:** Land remaining Sprint 5 carryover + a focused Sprint 6 hardening slice as **many PRs into `staging`**, then **one** `staging → main` promote + SemVer tag.

**Baseline:** `main` and `staging` are aligned at **1.11.0** (2026-07-03). Comms phase-1 code is already on `main`; adapters are gated by `COMMS_EVENT_ADAPTERS_ENABLED` (canary path documented in #438 / #461).

**Pattern:** Same as the comms rollup (`1.10.0`): continuous merges to `staging`, freeze promotes to `main` until the train is green, one production release entry that rolls up intermediate staging versions.

**Tracking:** Parent issues stay open until their train AC is met. Placeholders (#424–#427) are umbrellas — close them when their in-train children ship, or leave open if deferred children remain.

---

## In train vs out of train

### IN — ship in this promote

| Issue | Sprint | Type | Notes |
|-------|--------|------|-------|
| [#417](https://github.com/pat792/set-picks/issues/417) | 5 | Code | Pool standings from membership (new pools only) |
| [#418](https://github.com/pat792/set-picks/issues/418) | 5 | Code | Profile cluster **Phase 1** (IA split + redirects) |
| [#461](https://github.com/pat792/set-picks/issues/461) | 5 / #441 | Code + secret | Server `comms_delivered` → GA4 Measurement Protocol |
| [#291](https://github.com/pat792/set-picks/issues/291) | 5 | Ops (GA4 Admin) | Register `method` / `error_code` custom dimensions |
| [#438](https://github.com/pat792/set-picks/issues/438) | 5 | Ops | Remaining post-deploy checklist (Functions, Auth templates, adapter gate) |
| [#441](https://github.com/pat792/set-picks/issues/441) | 5 | Epic close | Close when #461 + measurement dims + adapter enablement AC met |
| [#272](https://github.com/pat792/set-picks/issues/272) | 5 | Epic close | Children already shipped; close after smoke on push/install |
| [#412](https://github.com/pat792/set-picks/issues/412) | 6 / #411 | Code | CSP + security headers (report-only → enforce) |
| [#413](https://github.com/pat792/set-picks/issues/413) | 6 / #411 | Config | Version Firestore composite indexes in repo |
| [#414](https://github.com/pat792/set-picks/issues/414) | 6 / #411 | Config | Dependabot / npm audit baseline |
| [#411](https://github.com/pat792/set-picks/issues/411) | 6 | Epic partial | Close only if #412–#414 land; leave open if #415–#416 slip |
| [#424](https://github.com/pat792/set-picks/issues/424) | 6 | Placeholder | Close when security slice above is done |

### STRETCH — land on `staging` if capacity; do not block promote

| Issue | Notes |
|-------|-------|
| [#301](https://github.com/pat792/set-picks/issues/301) | Multi-band Phase 0 — additive contracts only, no UX/Firestore writes |
| [#415](https://github.com/pat792/set-picks/issues/415) | Cap/paginate large pool reads |
| [#416](https://github.com/pat792/set-picks/issues/416) | Reduce redundant live grading on setlist writes |

### OUT — explicit defer (Sprint 7+ / separate train)

| Issue | Why |
|-------|-----|
| [#121](https://github.com/pat792/set-picks/issues/121), [#426](https://github.com/pat792/set-picks/issues/426) | Ads / monetization — separate risk and CMP story |
| [#425](https://github.com/pat792/set-picks/issues/425) beyond #301 | Multi-band Phase 1+ needs commercial posture |
| [#427](https://github.com/pat792/set-picks/issues/427) children | Tech debt / research (#145, #168, #396, #227, #122, #80, #42) |
| [#418](https://github.com/pat792/set-picks/issues/418) Phases 2–4 | Notifications UX polish, inbox scale, identity extensions — follow-on PRs OK on staging **after** promote if not ready |
| [#93](https://github.com/pat792/set-picks/issues/93) | Password-reset PRD — not required for profile IA Phase 1 |

---

## Merge order (waves)

Merge each wave to **`staging` only**. Do **not** open `staging → main` until Wave 5.

```text
Wave 0  Docs / train plan
        • This manifest
        • Comms send/routing/tracking docs (branch cursor/comms-send-routing-tracking-docs)

Wave 1  Low-risk platform (parallel PRs)
        • #413 firestore.indexes.json (export from Firebase, commit)
        • #414 .github/dependabot.yml
        • #301 multi-band Phase 0 (optional stretch)

Wave 2  Product (Sprint 5 carryover)
        • #417 pool standings from membership
        • #418 Profile cluster Phase 1 (routes, layout, redirects, meta)

Wave 3  Comms observability closeout
        • #461 GA4 Measurement Protocol for comms_delivered
        • #291 GA4 Admin: register auth + comms custom dimensions (human)

Wave 4  Security headers
        • #412 CSP report-only on preview → enforce on prod (tiered)

Wave 5  Stretch (optional) then promote freeze
        • #415 / #416 if ready
        • Staging soak + QA checklist
        • One staging → main PR
        • Tag vX.Y.0 (MINOR — new routes/schema fields/callables as applicable)
        • #438 remaining ops (Functions deploy, Auth email templates, adapter gate verify)
        • Close #272, #441, #424 (and #411 if stretch slipped)
```

**Hotfix rule:** If prod needs a fix mid-train, branch from `main`, ship, then merge `main` → `staging` before continuing train PRs.

---

## Flag / config gates

| Gate | Default on train | Promote-day action |
|------|------------------|--------------------|
| `COMMS_EVENT_ADAPTERS_ENABLED` | Already canaried per #461 notes; verify on live revisions | Confirm `"true"` on all adapter + hook-host exports via deploy manifest |
| `RESEND_API_KEY` / `RESEND_WEBHOOK_SECRET` | Bound on email path | Confirm bound on scoring/rollup hosts (#460) |
| `GA4_MEASUREMENT_ID` + `GA4_MP_API_SECRET` (#461) | Unset → no-op send | Set measurement id param + MP secret, redeploy comms hosts, canary one `runCommsTrigger` |
| GA4 custom dimensions (#291 + #461) | Not registered | Human: Admin → register `method`, `error_code`, `comms_*` event params |
| CSP (#412) | Report-Only on preview first | Flip to enforce only after report-only is clean |
| `pools.standingsScope` (#417) | Absent = `legacy` | New pools write `from_membership`; no migration |
| Multi-band (#301) | Phish-only registry | No user-visible switcher |

Incomplete features must land **dark** (flags / absent fields / no UX) rather than blocking merge to `staging`.

---

## Versioning for the train

1. Each feature PR may bump `package.json` + `CHANGELOG` on `staging` (PATCH/MINOR per change).
2. On promote day, write **one** production `CHANGELOG` entry that rolls up the train (same style as `1.10.0`).
3. Tag **only** on `main` after promote (`npm run release:gate:full` → `npm run release:publish -- --confirm`).
4. Expected bump: **MINOR** (`1.12.0` or whatever is current+1) — new profile routes, pool schema field, GA4 secret, security headers.

---

## Promote-day checklist

- [ ] All **IN** issues merged to `staging` (or explicitly waived in this doc)
- [ ] `npm run lint` / `npm test` / `npm run verify:dashboard-meta` / `npm run verify:dashboard-ui` green on staging tip
- [ ] Functions tests green if Functions touched (`cd functions && npm test`)
- [ ] Manual QA: new pool starts at zero; legacy pool unchanged; profile cluster redirects; push/install smoke
- [ ] `staging → main` PR opened and merged
- [ ] Release tag published
- [ ] #438 ops completed (or residual items filed as post-release follow-ups)
- [ ] #291 / #461 GA4 dimensions registered (no backfill — register before relying on reports)
- [ ] Close epics/placeholders that met AC

---

## PR hygiene

- Branch: `feat/<issue#>-<kebab-slug>` (one primary issue per PR; mention related issues in body).
- Base: **`staging`**.
- Do not open promote PRs until Wave 5.
- Agents: no autonomous approve/merge of the promote PR.

---

## Work log

| Date | Wave | PR / action | Notes |
|------|------|-------------|-------|
| 2026-07-03 | 0 | Manifest authored | Train defined |
| 2026-07-03 | 2 | PR #471 | #417 pool standings from membership merged to staging (1.12.0); **issue #417 closed** |
| 2026-07-03 | 2 | PR #472 | #418 Profile cluster Phase 1 (1.13.0); **#418 Phase 1 noted, epic left open for Phases 2–4** |
| 2026-07-03 | 2 | PR #473 | Visible invite code + join-my-pool share copy (1.14.0) |
| 2026-07-03 | 3 | PR #474 | #461 GA4 MP for `comms_delivered` (1.15.0); Functions deploy + canary; **#461 and #291 closed**; #441 measurement bullets updated |
| 2026-07-03 | 3 | fix commits on staging | `commsDeliverySecrets` validate; await MP posts (Cloud Functions freeze) |
| 2026-07-03 | 4 | `feat/412-csp-security-headers` | #412 CSP Report-Only + security headers (1.16.0) |
