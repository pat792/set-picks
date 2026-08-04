# Release train — cold-open / acquisition load

**Goal:** Instant-feeling public marketing cold opens without regressing authenticated boot (email CTA, dashboard, setup).

**Do not revive:** issue #831 hand-built HTML stub (lost branding, scoring graphics, live tour stats).

---

## Train phases

| Phase | Issue | Scope | Status |
|-------|-------|--------|--------|
| **A — Marketing entry** | #832 | Real React splash/marketing UI via a **second Vite entry** with no `firebase-core` / `AuthProvider` on the critical path. Auth CTAs → `/login` (app shell). | Merged → staging (PR #838, v1.47.0) |
| **A UI pickup** | #837 | Splash laptop spacing: tighten header → hero wordmark → copy (**ships in the #832 PR**). | Shipped in #838 |
| **A follow** | #827 | Public `/tour-stats` long spinner (App Check / data gate) — keep interactive UI. | PR #839 → staging (v1.47.1) |
| **B — Outbound** | #830 | Email / push / invite link inventory; retarget `/?login=true` → `/login`. Depends on A. | Next after #827 |

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
```
