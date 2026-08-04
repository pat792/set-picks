# Release train — cold-open / acquisition load

**Goal:** Instant-feeling public marketing cold opens without regressing authenticated boot (email CTA, dashboard, setup).

**Do not revive:** issue #831 hand-built HTML stub (lost branding, scoring graphics, live tour stats).

---

## Train phases

| Phase | Issue | Scope | Status |
|-------|-------|--------|--------|
| **A — Marketing entry** | #832 | Real React splash/marketing UI via a **second Vite entry** with no `firebase-core` / `AuthProvider` on the critical path. Auth CTAs → `/login` (app shell). | Merged → staging (PR #838, v1.47.0) |
| **A UI pickup** | #837 | Splash laptop spacing: tighten header → hero wordmark → copy (**ships in the #832 PR**). | Shipped in #838 |
| **A follow** | #827 | Public `/tour-stats` long spinner (App Check / data gate) — keep interactive UI. | Merged → staging (PR #839, v1.47.1) |
| **B — Outbound** | #830 | Email / push / invite link inventory; retarget `/?login=true` → `/login`. Depends on A. | Merged → staging (PR #842, v1.47.3) |
| **C — Auth UX** | #834 | Inline full-page `/login` (replace modal-on-route hybrid). Invite VIP keeps modals. | Merged → staging (PR #843, v1.48.0) |
| **C follow** | epic #835 | App-shell splash → `/login`; hard-nav Home; auth CTA polish; remove Get Started chooser. | v1.48.1–1.48.2 |
| **D — Invite parity** | #844 | Inline auth on `/invite` + `/join` VIP (same panel chrome as `/login`). | **Held** — not in this promote |

**Promote rule:** Ship A–C (+ C follow) `staging` → `main` when AC soak passes. Phase D (#844) stays open and ships later.

---

## Non-negotiables

- Public hard opens show **today’s** product UI (not SEO text shells).
- `/dashboard/*` + `/setup` keep `#773` branded boot + `DashboardRoute` preload.
- Visual parity spot-check before merge (home, scoring, tour stats).

---

## Local verify (after build)

```bash
npm run build && npm run preview
# Private window: /, /how-it-works — Network must not request firebase-core until /login
# /login — inline forms (no role=dialog)
# From /login → Home — full load of marketing /; Sign in again → /login (not modal)
# /join/:code and /invite/:handle — still modal auth until #844
```
