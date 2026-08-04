# Release train — Cold-open / acquisition load

**Goal:** Ship marketing cold opens without Firebase on the critical path, keep real product UI (branding, scoring graphics, live tour stats), and finish outbound auth handoff — as many small PRs into `staging`, then one `staging` → `main` promote after the train is green.

**Theme:** Dual Vite entry (marketing vs app) + public tour-stats HTTP + auth handoff. Not HTML stubs.

**Baseline:** `main` / `staging` at **1.46.5** (2026-08-04) after #826 cold-open patch. Wave 1 targets **1.47.0**.

**Pattern:** Continuous merges to `staging`, no direct feature PRs to `main`, no `staging` → `main` promote until IN-train AC passes.

**Primary epic:** [#835](https://github.com/pat792/set-picks/issues/835) — Cold-open / acquisition load — marketing entry without Firebase.

**Diagnosis:** `crew/output/intel/load-speed-diagnosis-20260803T205829Z.md`

---

## In train vs out of train

### IN — ship in this train

| Issue | Type | Notes |
|-------|------|-------|
| [#826](https://github.com/pat792/set-picks/issues/826) | Foundation | Shipped in `1.46.5` — preload/shell flash patch |
| [#832](https://github.com/pat792/set-picks/issues/832) | Bucket A | Dual marketing entry; no `firebase-core` on public hard opens |
| [#827](https://github.com/pat792/set-picks/issues/827) | Tour stats | `GET /api/public-tour-stats` + marketing HTTP fetch |
| [#830](https://github.com/pat792/set-picks/issues/830) | Bucket B | Outbound link audit + `/login` handoff inventory |
| [#834](https://github.com/pat792/set-picks/issues/834) | Auth UX | Inline full-page `/login` (Wave 2; optional before promote) |

**Closed / historical (do not revive):**

| Issue | Notes |
|-------|-------|
| [#829](https://github.com/pat792/set-picks/issues/829) | Superseded by #832 |
| [#831](https://github.com/pat792/set-picks/issues/831) | Rejected HTML stub PR |
| [#833](https://github.com/pat792/set-picks/issues/833) | Chore: retarget #830 → #832 |

### OUT — separate trains

| Issue | Why |
|-------|-----|
| [#657](https://github.com/pat792/set-picks/issues/657) | SEO/GEO crawl corpus — complementary; do not absorb |
| [#733](https://github.com/pat792/set-picks/issues/733) | Invite perf follow-ons |
| [#764](https://github.com/pat792/set-picks/issues/764) | Dashboard IA |

---

## Merge order (waves)

Merge each wave to **`staging` only**.

```text
Wave 0  Foundation (done)
        * #826 → 1.46.5 on main

Wave 1  Dual entry + tour-stats JSON + handoff inventory → 1.47.0
        * #832 marketing-main / app.html / /login hybrid
        * #827 public-tour-stats API
        * #830 inventory in docs/OUTBOUND_AUTH_HANDOFF.md

Wave 2  Auth page polish (optional before promote)
        * #834 inline full-page /login forms

Wave 3  Promote freeze
        * Staging soak + human visual parity + firebase-core CI assert
        * One staging → main PR when epic IN AC met
```

---

## Acceptance checklist (promote freeze)

- [ ] Marketing hard opens (`/`, `/how-it-works`, `/how-scoring-works`, `/tour-stats`) show real product UI
- [ ] Built marketing HTML / entry graph has no `firebase-core` on critical path
- [ ] `/login?mode=signin|signup` works (hybrid OK until #834)
- [ ] Invite OG/browser shell uses app entry (`spa-boot` / `app.html`)
- [ ] Email/push `/dashboard/*` still on app boot path (#773)
- [ ] Field RUM or lab re-measure vs Aug 3 baseline logged on epic #835
- [ ] Epic children closed or residual follow-ups filed

---

## Changelog

| Date | Event |
|------|-------|
| 2026-08-04 | Epic #835 opened; Wave 1 PR for #832/#827/#830 |
