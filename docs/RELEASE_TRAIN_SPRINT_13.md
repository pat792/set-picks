# Release train — Sprint 13

**Goal:** Ship Sprint 13 game-depth / data work as many small PRs into `staging`, then one `staging` → `main` promote after the train is green.

**Theme:** Predictive song recommendations (#646), plus adjacent setlist/scoring depth that does not block the prediction critical path.

**Baseline:** `main` and `staging` are aligned at **1.35.4** on 2026-07-21 (`v1.35.4`). Hold all Sprint 13 train PRs in `staging` until promote freeze.

**Pattern:** Continuous merges to `staging`, no direct feature PRs to `main`, no `staging` → `main` promote PR until the train acceptance checklist passes.

**Primary epic:** [#646](https://github.com/pat792/set-picks/issues/646) — Predictive song picker and recommendation framework (children #647–#653).

---

## In train vs out of train

### IN — ship in this train (prediction critical path)

| Issue | Type | Notes |
|-------|------|-------|
| [#647](https://github.com/pat792/set-picks/issues/647) | Ops / Storage | Archive dated `song-catalog` snapshots; docs schedule correction |
| [#648](https://github.com/pat792/set-picks/issues/648) | Offline / scripts | Historical setlist dataset + leakage-safe backtest harness |
| [#649](https://github.com/pat792/set-picks/issues/649) | Model | Calibrate explainable play/slot model; freeze `modelVersion` |
| [#650](https://github.com/pat792/set-picks/issues/650) | Functions / Storage | Versioned `pick-recommendations` artifact + refresh |
| [#651](https://github.com/pat792/set-picks/issues/651) | Feature / UI | Prediction Lab panel (first player-facing surface) |
| [#652](https://github.com/pat792/set-picks/issues/652) | Feature / UI | Default-off Predictive Mode — **product-gated** after #651 evidence |
| [#653](https://github.com/pat792/set-picks/issues/653) | Schema / analytics | Provenance, outcome metrics, tour recalibration / rollback |

**Dependency order:** `#647 → #648 → #649 → #650 → #651 → #652`; `#653` tracks `#651`/`#652`.

**Go / no-go:** After #649, freeze only if the combined model beats popularity / gap / recency baselines on documented metrics. If not, stop player-facing waves and recalibrate offline — do not ship #651/#652 dark with a weak model.

### STRETCH — land on `staging` if capacity; do not block promote

| Issue | Notes |
|-------|-------|
| [#644](https://github.com/pat792/set-picks/issues/644) | Setlist automation resilience + admin polling alerts |
| [#626](https://github.com/pat792/set-picks/issues/626) | Reconcile stale bustout / song-gap snapshots |
| [#645](https://github.com/pat792/set-picks/issues/645) | Scoring decision spike — product decisions only; implementation only if locked early enough not to thrash #649 eval |
| [#712](https://github.com/pat792/set-picks/issues/712) | Badge catalog expansion — unrelated surface; merge only if green and non-blocking |

### OUT — explicit defer (separate train or later sprint)

| Issue | Why |
|-------|------|
| [#300](https://github.com/pat792/set-picks/issues/300), [#301](https://github.com/pat792/set-picks/issues/301), [#425](https://github.com/pat792/set-picks/issues/425), [#605](https://github.com/pat792/set-picks/issues/605), [#606](https://github.com/pat792/set-picks/issues/606) | Multi-band — parked in milestone for visibility; do not ride this prediction train |
| [#646](https://github.com/pat792/set-picks/issues/646) epic close | Close only when IN children meet epic AC (or residual follow-ups are filed) |

---

## Merge order (waves)

Merge each wave to **`staging` only**. Keep PRs small enough to review independently.

```text
Wave 0  Train manifest
        * This document
        * Confirm staging/main baseline at v1.35.4

Wave 1  Snapshot foundation (no player-facing change)
        * #647 archive dated song-catalog snapshots + SONG_CATALOG docs

Wave 2  Offline evaluation (no player-facing change)
        * #648 leakage-safe dataset + backtest harness
        * #649 calibrate + freeze modelVersion (GO/NO-GO gate)

Wave 3  Recommendation artifact (dark to clients until UI)
        * #650 pick-recommendations Storage artifact + refresh + API docs

Wave 4  First player surface
        * #651 Prediction Lab panel (opt-in, default-collapsed)
        * Thin #653 provenance/analytics hooks if needed for Lab measurement

Wave 5  Second surface (gated)
        * #652 Predictive Mode — only if Wave 4 evidence supports value without excessive herding
        * Remainder of #653 metrics / recalibration checklist / rollback controls

Wave 6  Promote freeze
        * Staging soak + QA checklist
        * One staging → main PR
        * Release gate on staging tip
        * Release tag after promote when user requests (`release:publish`)
```

**Hotfix rule:** If production needs a fix mid-train, branch from `main`, ship the hotfix, then fast-forward or merge `main` back into `staging` before continuing train PRs.

**Incomplete features rule:** Offline/model/artifact work may land on `staging` with no UI. Player surfaces stay opt-in / default-off. Never auto-fill picks.

---

## Versioning for the train

1. Each feature PR follows repo SemVer and may bump `package.json` + `CHANGELOG.md` on `staging`.
2. Docs-only train planning (Wave 0) does **not** require a version bump.
3. New Storage artifacts, optional pick metadata fields, callables, or env vars require `docs/API.md` in the same PR.
4. Expected train promote bump is **MINOR** once #650/#651 (and optionally #652/#653 schema) ship user- or API-visible surfaces. Pure offline #648/#649 may stay PATCH or unreleased-script-only until artifact/UI lands.
5. On promote day, write one production changelog entry that summarizes the full train.
6. After `staging` → `main` promote, agents MAY publish the release tag only when the user explicitly requests it.

---

## Gates and risk notes

| Area | Gate |
|------|------|
| Leakage | #648/#649 must not use target-night `songGaps` / official setlist as candidate features |
| Model quality | #649 must beat documented baselines before Wave 4 |
| Storage / client path | #650 mirrors song-catalog: Storage + TTL + stale/fallback; no Firestore per keystroke |
| FSD | Recommendation orchestration in `features/picks`; `SongAutocomplete` stays generic (injected options/ranker only) |
| Herding | #652 ships only after #651 analytics show value without collapse of pick diversity |
| Scoring (#645) | If Model X encore / bustout tiers land mid-train, re-run #649 eval before promote |
| Dashboard | Unlikely for this epic; if routes change, extend `verify:dashboard-meta` / `verify:dashboard-ui` |
| Functions | Catalog archive + recommendation publish touch Functions — run `cd functions && npm test` (after `emails:build` if needed) |

---

## Promote-day checklist

- [ ] All **IN** issues merged to `staging` or explicitly waived here (especially #652 product gate)
- [ ] #649 go/no-go recorded (model beats baselines or Wave 4+ waived)
- [ ] Open Dependabot PRs either merged green or deferred without blocking the train
- [ ] `npm run lint` green on staging tip
- [ ] `npm test` green on staging tip
- [ ] `npm run verify:dashboard-meta` / `verify:dashboard-ui` if dashboard touched
- [ ] Functions tests green if Functions code changed
- [ ] Firestore rules / Storage rules tests green if rules changed
- [ ] Manual QA: Lab panel apply/exclude, Predictive Mode off=unchanged, artifact missing fallback, no auto-fill
- [ ] One `staging` → `main` promote PR opened and merged
- [ ] Release tag published after promote when user requests
- [ ] #646 closed or residual follow-ups filed

---

## PR hygiene

- Branch: `feat/<issue#>-<kebab-slug>` for issue work; docs/train branch: `feat/sprint13-release-train`.
- Base: **`staging`**.
- PR bodies include `Closes #<issue>` for issue PRs (Wave 0 has no close), plus `## Summary` and `## Test plan`.
- Do not open promote PRs until Wave 6.
- Agents may comment/review when asked, but may not approve, request changes, merge, or force-push without explicit user command. Tagging / `release:publish` requires an explicit user promote/tag/release request after `main` is updated.

---

## Effort snapshot (planning)

Agent-assisted eng-day ranges used to size waves (not a commit):

| Wave | Issues | Est. days |
|------|--------|-----------|
| 1 | #647 | 0.5–1 |
| 2 | #648–#649 | 7–13 |
| 3 | #650 | 2–3.5 |
| 4 | #651 (+ thin #653) | 2.5–4 |
| 5 | #652 + #653 remainder | 3.5–6.5 |
| **IN total** | | **~16–28** |

---

## Work log

| Date | Wave | PR / action | Notes |
|------|------|-------------|-------|
| 2026-07-21 | Baseline | Confirm `main`/`staging` at **1.35.4** | Fast-forward train branch to `main` tip |
| 2026-07-21 | 0 | [#714](https://github.com/pat792/set-picks/pull/714) merged | Manifest on staging |
| 2026-07-21 | 1 | [#715](https://github.com/pat792/set-picks/pull/715) merged + deployed | #647 archives verified (`…/archive/2026-07-22T04-55-51Z.json`); issue closed |
| 2026-07-21 | 2 | [#716](https://github.com/pat792/set-picks/pull/716) (#648) | Offline import + leakage-safe baseline harness |
| 2026-07-21 | 2 | #649 in flight | Combined explainable model `v0.1.0-explainable` + go/no-go |
