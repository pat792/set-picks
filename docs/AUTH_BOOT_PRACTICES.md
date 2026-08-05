# Auth / Firebase boot practices (#850 / #858)

Standing rules for app-document auth and any surface that opens Google/`signInWithPopup` or touches Firestore under App Check. Learned from the v1.48.4 Safari hotfix (#850) and Tier 0 hard-ready Google CTA (#858); apply on invite/join and further `/login` feel work without re-deriving.

**Related:** `docs/RELEASE_TRAIN_COLD_OPEN.md` · `docs/OUTBOUND_AUTH_HANDOFF.md` · `docs/API.md` (`/login`) · **roadmap / top-tier gap close:** `docs/AUTH_SEAMLESS_PATH.md` · code: `src/shared/lib/ensureFirebase.js`, `src/features/auth/model/warmLoginAuthSurface.js`

---

## Rules

1. **Marketing `/` stays Firebase-free on cold open.** Second Vite entry (`index.html` → `marketingMain`). Auth CTAs hard-navigate to `/login` (app document). Do not put `AuthProvider` / `firebase-core` back on the marketing critical path.

1b. **Public `/tour-stats*` is marketing too (#853).** Paint chrome from the marketing entry; load App Check + Firestore only inside `fetchPublicTourStats*` (and a parallel page kick). Do not put tour-stats back on `app.html` / `AuthProvider` — #835 login firebase-deferral regressed that path after #827.

2. **Paint auth UI before Auth init when the user is anonymous on `/login`.** Branded `login/index.html` + deferred `ensureFirebase` / AuthProvider. The static boot shell must be **login chrome** (header + auth-card skeleton) — never the dashboard bottom-tab skeleton (marketing CTAs hard-nav here; a dashboard flash reads as a broken hop). Session hint and Google redirect return remain eager (user already mid-flow). **#860:** `login/index.html` may `<link rel="modulepreload">` `firebase-core` (download only — still no `initializeApp` until warm/CTA). Marketing `/` and `/tour-stats*` must not.

2b. **Google CTA must not be enabled until Auth surface is ready (#858).** Soft idle-warm alone is insufficient on Safari. On `/login`, disable Continue with Google (brief “Preparing sign-in…” OK) until `warmLoginAuthSurface` has Auth + click-path modules (`splashAuthApi`, `completeGoogleSplashAuth`, Google provider). When ready, the click path must call `signInWithPopup` / redirect with **no** `await ensureAuthReady()` or dynamic-import on the hot path.

3. **After auth chrome paints: warm Auth immediately.** On `/login`, call `warmLoginAuthSurface` right after form paint (not only `requestIdleCallback`) so Auth SDK + `requestAuthBoot` + click modules run before the CTA enables. Use `warmPath: 'intent'` when marketing CTA prefetch marked the visit (#860); otherwise `'immediate'`. Prefetch post-auth chunks (`dashboard` / `setup`) in the same warm.

4. **Never await App Check before `signInWithPopup` / email Auth CTAs.** Safari drops the user gesture if the click awaits reCAPTCHA Enterprise / App Check. Use `ensureAuthReady()` (Auth only + fire-and-forget `kickAppCheckWarm`) on fallback paths; warm path already kicked Check in parallel. First enabled tap must open the account picker.

5. **Await App Check only before Firestore.** Profile/consent/`public_tour_stats` reads and writes go through `whenFirebaseReady` / `ensureAppCheckNow` paths. Kick Check early in parallel; do not serialize it in front of OAuth.

6. **Safari / iOS / in-app browsers prefer redirect (#859).** `shouldPreferGoogleRedirectAuth` → `signInWithRedirect` (reuses stash + `useGoogleRedirectCompletion`). Desktop Chromium/Firefox keep popup; Android Chrome keeps popup unless in-app WebView. On `auth/popup-blocked`, one-shot redirect fallback. Map `auth/popup-blocked` to clear copy when popup path remains.

7. **Cloud Playwright ≠ Safari.** `scripts/qa/*` is Chromium-only. Ship any gesture/App Check sequencing change with a **human Safari** private-window check plus Chromium smoke.

---

## Anti-patterns

| Do not | Why |
|--------|-----|
| `await ensureAppCheckNow()` (or `whenFirebaseReady`) inside the Google button handler before `signInWithPopup` | Breaks Safari first-tap (#850) |
| Enable Google while Auth/click modules are still downloading | First-tap race (#858); soft idle-warm alone loses to fast Safari taps |
| Defer Auth until CTA with **no** post-paint warm | Cold Auth download steals the gesture / feels stuck |
| Warm App Check by blocking first paint of marketing `/` | Undoes dual-entry win (#832) |
| Claim “verified on Safari” from `qa:cache` / `qa:chunks` alone | Harness cannot run WebKit |

---

## Quick verify

```bash
# /login — form visible quickly; Google shows Preparing… then enables
# Network: App Check must not gate the Google OAuth request
# Private Safari: first enabled Continue with Google starts redirect (no prior failed click)
# Desktop Chromium: popup path unchanged for happy path
# Marketing / — still no firebase-core on cold open
```
