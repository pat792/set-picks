# Release train — Sprint 6 (platform hardening & scale)

**Goal:** Land Sprint 6 board items as **many PRs into `staging`**, then **one** `staging → main` promote + SemVer tag.

**Baseline:** `main` and `staging` are aligned at **1.18.1** (2026-07-03). Prior train (`docs/RELEASE_TRAIN_SPRINT_5_6.md`) promoted as **v1.18.0** and closed Sprint 5 carryover + security children (#412–#416).

**Pattern:** Continuous merges to `staging`, freeze promotes to `main` until the train is green, one production release entry that rolls up intermediate staging versions.

**Tracking:** Parent issues stay open until their train AC is met. Placeholders (#424) close when their in-train children are done.

---

## In train vs out of train

### IN — ship in this promote

| Issue | Type | Notes |
|-------|------|-------|
| [#328](https://github.com/pat792/set-picks/issues/328) | Code | Last-show winner banner purple→red gradient (style only) |
| [#396](https://github.com/pat792/set-picks/issues/396) | Code | Explicit legal re-consent for legacy users + versioned policy bumps |
| [#93](https://github.com/pat792/set-picks/issues/93) | Close / ops | Password-reset flow already shipped; confirm AC + Auth email template checklist |
| [#411](https://github.com/pat792/set-picks/issues/411) | Epic close | All children (#412–#416) shipped in v1.18.0 |
| [#424](https://github.com/pat792/set-picks/issues/424) | Placeholder close | Security slice complete when #411 closes |
| [#441](https://github.com/pat792/set-picks/issues/441) | Epic close | v1 AC met (adapters, Resend, measurement, prefs, inbox templates); P2 deferred |

### OUT — explicit defer (Sprint 7+ / backlog)

| Issue | Why |
|-------|-----|
| [#300](https://github.com/pat792/set-picks/issues/300) / [#301](https://github.com/pat792/set-picks/issues/301) / [#425](https://github.com/pat792/set-picks/issues/425) | Multi-band — Sprint 7 |
| Ads (#419–#423, #121, #426) | Separate monetization / CMP train |
| Tech debt / research (#427 children, #298, #227, #168, #166, #145, #122, #73, #42, #29, #335) | Backlog |
| #441 P2 (variant registry, War Room demote, recap query chunking, inbox TTL) | Follow-on issues if needed; not promote blockers |

---

## Merge order (waves)

Merge each wave to **`staging` only**. Do **not** open `staging → main` until Wave 4.

```text
Wave 0  Docs / train plan
        • This manifest

Wave 1  Low-risk UI
        • #328 last-show winner banner gradient

Wave 2  Product / legal
        • #396 explicit re-consent gate (versioned legalConsent + blocking modal)

Wave 3  Epic / issue closeout (no code or docs-only)
        • Close #411, #424 (security children already on main)
        • Close #93 (password reset shipped; Auth template ops residual in docs/FIREBASE_AUTH_EMAIL_TEMPLATES.md)
        • Close #441 (v1 AC met; note P2 deferrals)

Wave 4  Promote freeze
        • Staging soak + QA checklist
        • One staging → main PR
        • Tag vX.Y.0 (MINOR if #396 lands; PATCH if only #328)
```

**Hotfix rule:** If prod needs a fix mid-train, branch from `main`, ship, then merge `main` → `staging` before continuing train PRs.

---

## Flag / config gates

| Gate | Default on train | Promote-day action |
|------|------------------|--------------------|
| Legal versions (`LEGAL_TERMS_VERSION` / `LEGAL_PRIVACY_VERSION`) | Initial ids match published docs | Bump only for material policy edits (runbook) |
| Password-reset Action URL | App continueUrl `/password-reset-complete` | Confirm Firebase Auth template Action URL on prod domain (`docs/FIREBASE_AUTH_EMAIL_TEMPLATES.md`) |
| `COMMS_EVENT_ADAPTERS_ENABLED` | Already `true` on prod from prior train | Smoke one trigger if touching Functions (not expected this train) |

Incomplete features must land **dark** (flags / absent fields / no UX) rather than blocking merge to `staging`.

---

## Versioning for the train

1. Each feature PR may bump `package.json` + `CHANGELOG` on `staging` (PATCH/MINOR per change).
2. On promote day, write **one** production `CHANGELOG` entry that rolls up the train (same style as `1.18.0` / `1.10.0`).
3. Tag **only** on `main` after promote (`npm run release:gate:full` → `npm run release:publish -- --confirm`).
4. Expected tip bump: **MINOR** (`1.19.0`) if #396 adds `users.legalConsent` versions; **PATCH** if only #328 ships.

---

## Promote-day checklist

- [ ] All **IN** issues merged to `staging` or closed with evidence in this doc
- [ ] `npm run lint` / `npm test` / `npm run verify:dashboard-meta` / `npm run verify:dashboard-ui` green on staging tip
- [ ] Manual QA: last-show banner gradient; legacy user without consent sees blocking modal; accept writes versions; password-reset smoke if Auth templates updated
- [ ] `staging → main` PR opened and merged
- [ ] Release tag published
- [ ] Close remaining open IN issues (#328, #396 if not auto-closed)

---

## PR hygiene

- Branch: `feat/<issue#>-<kebab-slug>` (one primary issue per PR; mention related issues in body).
- Base: **`staging`**.
- Do not open promote PRs until Wave 4.
- Agents: no autonomous approve/merge of the promote PR.

---

## Work log

| Date | Wave | PR / action | Notes |
|------|------|-------------|-------|
| 2026-07-03 | 0 | Manifest authored | Train defined from board Sprint 6 column |
