# Release train — cold-open / acquisition load

**Goal:** Instant-feeling public marketing cold opens without regressing authenticated boot (email CTA, dashboard, setup).

**Do not revive:** issue #831 hand-built HTML stub (lost branding, scoring graphics, live tour stats).

**Auth / App Check sequencing (standing):** `docs/AUTH_BOOT_PRACTICES.md` — immediate warm + hard-ready Google CTA (#858); never await App Check before `signInWithPopup` (#850).  
**Top-tier auth feel:** `docs/AUTH_SEAMLESS_PATH.md` · delivery epic [#856](https://github.com/pat792/set-picks/issues/856) (T0a–T3: #857–#861; T0b #858 hard-ready Google).

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
| **C paint** | epic #835 | Content-first marketing boot (no full-screen “Loading…”); lazy sibling marketing routes; idle GA. | **v1.48.3** |
| **C login boot** | epic #835 | Anon `/login`: paint form first; Firebase off critical path. | **v1.48.3** |
| **C login Safari hotfix** | #850 | Idle-warm Auth on `/login`; never await App Check before Google popup. | **v1.48.4** |
| **D — Invite parity** | #844 | Inline auth on `/invite` + `/join` VIP (same panel chrome as `/login`). | **Held** — not in this promote |
| **E1 — Public tour-stats** | #853 | Regression after #835 login firebase defer: move `/tour-stats*` to marketing entry; Firebase only at fetch. Bundle `AUTH_BOOT_PRACTICES.md`. | **In flight** |
| **E2 — Auth residual** | #844 (+ feel) | Invite/join inline auth; further `/login` feel. | **Held** |

**Field verdict (2026-08-04):** Marketing dual-entry worked. Public `/tour-stats` regressed after auth-surface firebase defer (#835) while still on `app.html` — E1 restores it. Auth residual is E2.

**Promote rule:** Ship A–C (+ C follow) `staging` → `main` when marketing soak is enough. Phase D (#844) and Phase E (#853 + auth residual) stay open and ship later.

---

## Non-negotiables

- Public hard opens show **today’s** product UI (not SEO text shells).
- `/dashboard/*` + `/setup` keep `#773` branded boot + `DashboardRoute` preload.
- Visual parity spot-check before merge (home, scoring, tour stats).

---

## Local verify (after build)

```bash
npm run build && npm run preview
# Gate on Slow 3G / Fast 3G + private mobile against **local** `vite preview`
# or **prod** — not Vercel preview/staging SSO (auth wall ≠ anon cold open).
# Private window: / — HTML shows H1/copy immediately under a thin top bar (not full-screen Loading…)
# Network: no firebase-core on /; no HowItWorks/Scoring/Phish page chunks until those routes
# /login — form visible quickly; firebase-core warms immediately after paint (not before)
# /login — Google disabled until Auth ready (“Preparing…”); first enabled Safari tap opens picker
# /login — Continue with Google must not wait on App Check
# /login — inline forms (no role=dialog); session hint / Google redirect still complete
# From /login → Home — full load of marketing /; Sign in again → /login (not modal)
# /join/:code and /invite/:handle — still modal auth until #844
# /tour-stats — marketing entry (no AuthProvider); skeleton chrome; firebase after fetch
# Network: no firebase-core modulepreload on /tour-stats shell; Auth CTA → /login
```
