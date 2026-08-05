# Auth / Firebase boot practices (#850)

Standing rules for app-document auth and any surface that opens Google/`signInWithPopup` or touches Firestore under App Check. Learned from the v1.48.4 Safari hotfix (#850); apply on Phase E work (`/tour-stats`, invite/join, further `/login` feel) without re-deriving.

**Related:** `docs/RELEASE_TRAIN_COLD_OPEN.md` · `docs/OUTBOUND_AUTH_HANDOFF.md` · `docs/API.md` (`/login`) · code: `src/shared/lib/ensureFirebase.js`, `src/features/auth/model/warmLoginAuthSurface.js`

---

## Rules

1. **Marketing `/` stays Firebase-free on cold open.** Second Vite entry (`index.html` → `marketingMain`). Auth CTAs hard-navigate to `/login` (app document). Do not put `AuthProvider` / `firebase-core` back on the marketing critical path.

1b. **Public `/tour-stats*` is marketing too (#853).** Paint chrome from the marketing entry; load App Check + Firestore only inside `fetchPublicTourStats*` (and a parallel page kick). Do not put tour-stats back on `app.html` / `AuthProvider` — #835 login firebase-deferral regressed that path after #827.

2. **Paint auth UI before firebase-core when the user is anonymous on `/login`.** Branded `login/index.html` + deferred `ensureFirebase`. Session hint and Google redirect return remain eager (user already mid-flow).

3. **After auth chrome paints: idle-warm Auth.** On `/login`, call `warmLoginAuthSurface()` (or equivalent) so Auth SDK + `requestAuthBoot` run before Continue with Google. Prefetch post-auth chunks (`dashboard` / `setup`) and `splashAuthApi` in the same warm.

4. **Never await App Check before `signInWithPopup` / email Auth CTAs.** Safari drops the user gesture if the click awaits reCAPTCHA Enterprise / App Check. Use `ensureAuthReady()` (Auth only + fire-and-forget `kickAppCheckWarm`). First tap must open the account picker.

5. **Await App Check only before Firestore.** Profile/consent/`public_tour_stats` reads and writes go through `whenFirebaseReady` / `ensureAppCheckNow` paths. Kick Check early in parallel; do not serialize it in front of OAuth.

6. **In-app browsers may still use redirect.** `isLikelyInAppBrowser` → redirect flow; popup remains default elsewhere. Map `auth/popup-blocked` to clear copy.

7. **Cloud Playwright ≠ Safari.** `scripts/qa/*` is Chromium-only. Ship any gesture/App Check sequencing change with a **human Safari** private-window check plus Chromium smoke.

---

## Anti-patterns

| Do not | Why |
|--------|-----|
| `await ensureAppCheckNow()` (or `whenFirebaseReady`) inside the Google button handler before `signInWithPopup` | Breaks Safari first-tap (#850) |
| Defer Auth until CTA with **no** post-paint warm | Cold Auth download steals the gesture / feels stuck |
| Warm App Check by blocking first paint of marketing `/` | Undoes dual-entry win (#832) |
| Claim “verified on Safari” from `qa:cache` / `qa:chunks` alone | Harness cannot run WebKit |

---

## Quick verify

```bash
# /login — form visible quickly; firebase-core may idle-warm after paint
# Network: App Check must not gate the Google popup request
# Private Safari: first Continue with Google opens account picker (no prior failed click)
# Marketing / — still no firebase-core on cold open
```
