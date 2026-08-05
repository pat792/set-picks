# Seamless auth & no-lag entry — path to top-tier feel

**Status:** Decision / roadmap doc (2026-08-04; soak recalibrated 2026-08-04). Delivery epic [#856](https://github.com/pat792/set-picks/issues/856).  
**T0a:** [#857](https://github.com/pat792/set-picks/issues/857) — `route_group` + auth timing emitters (shipped in train; register GA4 dims per runbook).  
**T0b:** [#858](https://github.com/pat792/set-picks/issues/858) — hard-ready Google CTA (immediate warm + gate + sync click path).  
**T1:** [#859](https://github.com/pat792/set-picks/issues/859) — Safari/iOS → `signInWithRedirect` (+ popup→redirect on `popup-blocked`). Parallel: [#867](https://github.com/pat792/set-picks/issues/867) Safari Private “Reduce Protections” banner triage.  
**T2:** [#860](https://github.com/pat792/set-picks/issues/860) — marketing → `/login` CTA intent prefetch + login-shell `firebase-core` modulepreload + leave/continue chrome (**shipped; hop lag not closed — see §8**).  
**T2.5 Phase A:** [#880](https://github.com/pat792/set-picks/issues/880) — idle speculative download-warm (**shipped; soak for hop bands**).  
**T2.5 Phase B (placeholder):** [#881](https://github.com/pat792/set-picks/issues/881) — thin login Vite entry; **gated** on #880 soak (do not start until unblocked).

**Standing rules today:** `docs/AUTH_BOOT_PRACTICES.md` (#850 + rule **2b** from #858 + #860 login-shell preload nuance).  
**Related:** `docs/RELEASE_TRAIN_COLD_OPEN.md` · predecessor [#835](https://github.com/pat792/set-picks/issues/835) · children: T0a [#857](https://github.com/pat792/set-picks/issues/857) · T0b [#858](https://github.com/pat792/set-picks/issues/858) · T1 [#859](https://github.com/pat792/set-picks/issues/859) · T2 [#860](https://github.com/pat792/set-picks/issues/860) · **T2.5A [#880](https://github.com/pat792/set-picks/issues/880)** · **T2.5B [#881](https://github.com/pat792/set-picks/issues/881)** · T3 [#861](https://github.com/pat792/set-picks/issues/861).

This answers: how top-tier platforms feel instant; what we can close in this repo; what needs reconfiguration; and a staged path that starts by killing the **new** first-tap Google errors (absent on the old modal path). **§8 is the soak verdict + authoritative next solution for marketing Sign in / Create account load.**

---

## 1) What “top-tier” platforms actually do

They do **not** magically make a cold 300KB+ Auth SDK + popup feel free. They arrange the product so the user rarely pays that cost at the moment of the Google tap.

### Entry / paint (no-lag public pages)


| Pattern                          | Examples / shape                                                         | What it buys                                                           | What we have                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Thin document + deferred app** | Marketing site / docs / landing separate from the authenticated app      | Instant HTML/CSS; no Auth on SERP/GenAI cold opens                     | **Have** — dual-entry marketing (#832); `/tour-stats`* on marketing too (#853). Auth CTAs hard-nav to `/login`.                                           |
| **SSR / edge HTML shell**        | Next/Remix/Firebase Hosting SSR, prerender                               | First paint without waiting on client graph                            | **Partial** — branded `login/index.html` + SEO prerender shells; not full SSR of React. Enough for marketing/login chrome; not the auth-lag gap.          |
| **Session-aware boot**           | Cookie / IndexedDB hint → skip marketing, go dashboard                   | Returning users never see auth chrome                                  | **Have** — persisted session hint + dashboard/email boot (#773 / #804). Anon visitors still see marketing/`/login`.                                       |
| **Prefetch on intent**           | Hover/focus “Log in” preloads auth route + Auth SDK                      | Hard-nav to `/login` already warm                                      | **Partial (#860)** — desktop hover/focus can warm UI bytes; **mobile tap starts prefetch too late**. Does **not** close cold private Safari hop (see §8). |
| **Speculative idle warm**        | After landing paints, download auth shell + Auth SDK bytes in background | By the time the user taps Sign in / Create account, HTTP cache is warm | **Have (#880)** — post-paint idle download of `/login` + UI + `firebase-core`; no `initializeApp` on marketing.                                           |
| **Thin auth entry**              | Dedicated auth micro-bundle (not full app graph)                         | Hop parses far fewer bytes than dashboard SPA                          | **Gap → T2.5 Phase B (#881)** if Phase A still short (placeholder; gated).                                                                                 |


### Auth (seamless Google / email)


| Pattern                                                     | What top-tier does                                                                                             | What we do                                                                                                                                                                      |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Auth SDK ready before CTA is live**                    | Auth route loads Firebase Auth (or GIS) as part of becoming interactive; button disabled or hidden until ready | **Have (#858)** — immediate `warmLoginAuthSurface` after paint; Google disabled until Auth + click modules ready (“Preparing sign-in…”).                                        |
| **B. Click handler is sync into OAuth**                     | No `await` download/init between tap and `signInWithPopup` / redirect / GIS                                    | **Have (#858)** — warm holds Auth + modules; ready click path skips `ensureAuthReady` / dynamic-import (fallback remains for modals / warm failure).                            |
| **C. App Check / backend off OAuth path**                   | reCAPTCHA / attestation after credential or parallel; never in front of account picker                         | **Have** — `#850`: `ensureAuthReady` does not await App Check; Check only before Firestore (`AUTH_BOOT_PRACTICES`). Must not regress.                                           |
| **D. Mobile prefers redirect (or popup→redirect fallback)** | Firebase docs: redirect preferred on mobile; many apps try popup then fall back on `popup-blocked`             | **Have (#859)** — Safari / iOS / in-app → redirect; desktop Chromium/Firefox popup; `auth/popup-blocked` → one-shot redirect. Custom `authDomain` + `/__/auth` proxy unchanged. |
| **E. Dedicated auth surface / host**                        | `accounts.`* or dedicated auth app with Auth always in the graph                                               | **Partial** — full-page `/login` on app document (#834); not a separate auth host. Thin login entry (T2.5B) is the practical next step before a host split.                     |
| **F. Google Identity Services (GIS) button**                | Google-owned button/iframe owns the gesture                                                                    | **Gap** — Firebase `GoogleAuthProvider` + popup/redirect only. **Does not fix marketing→login hop latency.** Tier 3 optional *after* hop feels fast.                            |
| **G. Returning session invisible**                          | Silent restore; auth UI only for signed-out                                                                    | **Have** — session hint + AuthProvider restore on dashboard/email (#773); signed-in `/login` → dashboard.                                                                       |


**Bottom line:** “Instant Google” on best platforms ≈ **Auth already loaded + no work in the gesture + often redirect on mobile + users often already signed in.** Instant **marketing → auth form** ≈ **auth document/bytes already warm (or same document) + thin auth graph** — not leave chrome alone.

---

## 2) Why the old modal felt fine (and `/login` regressed)

Old splash/invite **modal** path (`SplashAuthModals`):

1. User was already on the **app document** (Firebase/AuthProvider in play, or soon to be).
2. First click was often **“Sign in” / “Create account”** → modal opens → `ensureAppCheckNow()` + dashboard prefetch **without awaiting before Google**.
3. Second click was **Continue with Google** → Auth/`splashAuthApi` usually already warm → popup inside the gesture.

New `/login` path (#834 / #835):

1. Hard-nav from marketing → **anon `/login` deliberately has no firebase modulepreload** (pre-#860); after #860, login shell may modulepreload `firebase-core`, but marketing still starts Auth at zero on arrival.
2. Form paints with Auth **cold** until post-paint warm.
3. First interaction is often **Continue with Google itself**.
4. Soft idle-warm (#850) can lose to a fast Safari tap → `await ensureAuthReady()` + dynamic imports steal the gesture → **first-tap error** (new); second tap works. **Closed by T0b (#858).**

So the Google first-tap regression was **not** “popup stopped working.” It was **we removed the modal’s natural intent buffer and deferred Auth onto the Google button.** That reliability gap is closed. The **marketing → form hop** is a separate, structural cost (dual-entry), still open after T2 (§8).

---

## 3) Gaps: closable today vs needs reconfiguration

### Closable in current architecture (no redesign)


| Gap                         | Symptom                                    | Close with                                                                                            | Gets us to top-tier?                                                             |
| --------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Soft idle-warm race         | First Google tap error; second works       | **Hard gate:** disable Google until Auth + sign-in modules ready                                      | **Closed (#858)** — restores modal-era first-tap reliability                     |
| Click still dynamic-imports | Extra await before popup                   | Prefetch `splashAuthApi` + `completeGoogleSplashAuth`; click path sync into `signInWithPopup`         | **Closed (#858)** — pairs with hard gate                                         |
| Idle delayed up to 800ms    | Warm starts late                           | Start Auth warm **immediately after paint** on `/login` (keep marketing Firebase-free on first paint) | **Closed (#858)** — `warmPath: immediate`                                        |
| Mobile no hover warm        | `pointerenter` useless on touch            | Gate + immediate warm; optional `pointerdown` kick                                                    | **Yes (partial)** — touch parity for Google CTA; **not** for marketing→login hop |
| App Check in front of OAuth | Fixed in #850; must not regress            | Keep `AUTH_BOOT_PRACTICES` rule 4                                                                     | **Yes (already)** — hold the line; regressing drops us below tier                |
| CTA leave feels dead        | White/blank after Sign in / Create account | Honest leave chrome (“Taking you to sign in/up…”)                                                     | **Closed (v1.51.1)** — honesty only; does not shorten hop                        |


### Needs reconfiguration (real ceiling lifts)


| Gap                                        | Why we can’t fully match top-tier today                                                                                                                            | Reconfiguration                                                                                                                         | Gets us to top-tier?                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Safari popup residual flakiness            | Even with perfect sequencing, Safari/ITP/popup blockers remain; Firebase prefers redirect on mobile                                                                | **Safari/iOS → `signInWithRedirect`** (+ popup→redirect on `popup-blocked`). Redirect plumbing + custom `authDomain` / `/__/auth` proxy | **Closed (#859)** — mobile reliability floor                       |
| Auth page still “feels heavy” after OAuth  | Post-auth: AuthProvider wake, profile/`whenFirebaseReady`, dashboard chunk                                                                                         | Keep dashboard/setup prefetch; consider eager AuthProvider on `/login` once warm starts; measure profile path                           | **Yes (partial)** — post-login snappiness; not the first-tap error |
| Marketing→login still a full document swap | Dual-entry hard-nav is correct for cold marketing; touch has no hover; private Safari is cold cache; login boots app graph (~440KB `firebase-core` + React + auth) | **T2.5:** Phase A [#880] idle speculative download-warm (**shipped**) → Phase B [#881] thin login entry if soak still short             | **Phase A shipped — soak hop bands** (§4 Tier 2.5, §8)             |
| GIS / federated button                     | Not integrated                                                                                                                                                     | Later: Google Identity Services → `signInWithCredential` if we want Google-rendered CTA                                                 | **No for hop lag** — optional chrome after T2.5                    |
| True SSR auth shell                        | Vite SPA + branded `login/index.html` shell                                                                                                                        | Only if paint of login chrome itself is still the complaint after T2.5                                                                  | **Optional** — only if login *paint* (not hop download) remains    |


**Not a security vulnerability** for the first-tap error. Custom auth domain + auth proxy are the *right* Firebase setup for redirect. CSP is still Report-Only for framing — separate from this race (see #412 post-mortem).

**Honest non-goal without reconfiguration:** matching same-document SPA hop feel while keeping **marketing first paint Firebase-free** and warming **only** on CTA leave (too late on mobile).

---

## 4) Solution set (documented options)

### Tier 0 — Quick wins (restore modal-era reliability) — **shipped (#858)**

**Goal:** Eliminate first-tap “Something went wrong” / popup-blocked class on private Safari.  
**Accept:** brief disabled/“Preparing sign-in…” on Google CTA if Auth is still downloading.  
**Keep:** marketing `/` Firebase-free on cold first paint; App Check off OAuth path.

1. On `/login` paint: start `warmLoginAuthSurface()` **immediately** (not only `requestIdleCallback`).
2. Expand warm to include **everything the click path imports** (`splashAuthApi`, `completeGoogleSplashAuth`, Google provider construct).
3. Expose `authSurfaceReady` (promise/state); **disable Continue with Google until ready**.
4. Click handler: if ready, call `signInWithPopup` with **no chunk `await`s** (Auth instance already held).
5. Human AC: private Safari, cold `/login`, **first** Continue with Google opens account picker (or starts redirect — Tier 1).

### Tier 1 — Match Firebase mobile guidance — **shipped (#859)**

**Goal:** Reliability floor of top-tier mobile web auth.

1. Safari / iOS / in-app: prefer `**signInWithRedirect**` via `shouldPreferGoogleRedirectAuth` (stash + `useGoogleRedirectCompletion`). Android Chrome stays popup unless WebView.
2. Desktop Chromium/Firefox: keep popup.
3. On `auth/popup-blocked` → one-shot redirect fallback.

### Tier 2 — CTA intent prefetch (marketing → login) — **shipped (#860); hop not closed**

**Goal (original, oversold):** Virtually no lag between marketing Sign in and ready Google CTA.  
**Goal (actual, post-soak):** Honest leave chrome + desktop hover warm + earlier `firebase-core` download **after** `/login` arrives.

What shipped:

1. Marketing Sign in / Create account CTAs: on pointer/focus/leave, `prefetchLoginIntent()` injects `<link rel="prefetch">` for `/login` + LoginPage UI modulepreload URLs **without** initializing Auth on marketing (firebase-* hrefs filtered out of marketing prefetch).
2. `firebase-core` modulepreload **only** on `dist/login/index.html` (explicit inject; App Check / Storage stay blocked). Marketing strip unchanged.
3. Session flag → `warmLoginAuthSurface({ warmPath: 'intent' })` when prefetch contributed.
4. Leave / Google continue chrome covers the wait (“Taking you to sign in/up…”, “Logging you in…”, etc.).

**What it did not buy:** mobile cold tap→form parity. On touch, prefetch and navigation start together; marketing unloads before warm finishes. Field: ~**5–6s** Sign in / Create account → interactive form on Safari private (§8).

### Tier 2.5 — Authoritative hop ceiling — Phase A **[#880](https://github.com/pat792/set-picks/issues/880)** shipped; Phase B **[#881](https://github.com/pat792/set-picks/issues/881)** placeholder

**Problem statement:** Sign in and Create account share one hard-nav to `/login?…`. The user-visible wait is **document tear-down + cold fetch/parse of the app login graph**, not OAuth and not GIS. Leave chrome narrates that wait; it does not shrink it.

**Constraints (non-negotiable):**

- Marketing **first paint** stays Firebase-free (no `initializeApp`, no `AuthProvider`).
- App Check stays off the OAuth gesture path.
- Do **not** lead with GIS for this lag.

#### Phase A — Speculative idle warm (ship first)

After marketing has painted (post-LCP / `requestIdleCallback` or short timeout ~1–2s after interactive), **download-only** prefetch:


| Asset                          | Why                                                   |
| ------------------------------ | ----------------------------------------------------- |
| `/login` HTML                  | Document ready in HTTP cache                          |
| LoginPage + login boot closure | Form UI chunks ready                                  |
| `firebase-core` (~440KB today) | Auth SDK bytes ready **without execute** on marketing |


On CTA leave, navigation hits warm cache → parse/execute on `/login` only → existing T0 immediate warm enables Google.

**Benefits:**

- Works on **mobile** (no hover required) for the common case: user reads the hero, then taps.
- Sign in and Create account both improve (same hop; only query/intent differs).
- Preserves SERP/GenAI cold-open win: first paint of `/` still has no Firebase execute.
- Composes with T2 leave chrome (shorter narrated wait) and T0 gate (faster `paint_to_ready` when bytes already resident).

**Tradeoffs:**

- Visitors who never auth download ~login-critical bytes after idle (bandwidth). Mitigate with idle delay + once-per-session guard + abort if user navigates elsewhere.
- Network panel on `/` may show `firebase-core` **after** idle — AC must shift from “never until leave” to “never on first paint / never execute until `/login`”.
- Instant tap right after first paint (before idle warm finishes) still pays most of the cold hop — acceptable residual; Phase B addresses structural weight.

#### Phase B — Thin login entry — **[#881](https://github.com/pat792/set-picks/issues/881)** (placeholder; only if Phase A still short after soak)

Dedicated Vite entry (e.g. `loginMain`) that mounts login + auth only — **not** the full dashboard app graph pulled today via `app.html` / shared boot. **Do not start** until #880 soaks and product unblocks #881.

**Benefits:**

- Cuts parse/eval work on every hop even when cache is cold.
- Pairs with Phase A: warm downloads a smaller graph; cold residual is smaller.
- Moves us toward pattern E (dedicated auth surface) without a separate `auth.` host.

**Tradeoffs:** higher engineering cost (routing, shared auth code, boot preload scripts, QA). Do only if Phase A misses §8 targets.

#### Expected improvements (Sign in **and** Create account)

Same path for both CTAs. Baseline from soak (2026-08-04): cold **mobile Safari private**, marketing → interactive auth form ≈ **5–6s**.


| Stage                                                   | Typical tap→interactive form (mobile Safari private) | Notes                                                  |
| ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| **Today (T2)**                                          | ~5–6s                                                | Leave chrome honest; bytes mostly cold on tap          |
| **After T2.5 Phase A** (idle warm completed before tap) | **~1.5–3s**                                          | Dominated by parse/execute + React mount, not download |
| **After T2.5 Phase A+B**                                | **~0.8–2s**                                          | Thinner graph; closer to “form was already coming”     |
| **Instant tap before idle warm**                        | Still near baseline until warm finishes              | Residual; measure with `warm_path=speculative` vs cold |


Desktop with hover (T2) already better than mobile; Phase A mainly lifts **touch** and **private** cold sessions.

**Telemetry:** extend `warm_path` with `speculative` (idle) vs `intent` (CTA) vs `immediate` (landed cold on `/login`). Track `auth_surface_timing.paint_to_ready` and a new optional `auth_hop_timing` (marketing CTA click → login paint / form interactive) if we can mark across documents via `sessionStorage` timestamps.

### Tier 3 — Optional chrome / deeper split (only after T2.5)


| Option                                 | When                                                               |
| -------------------------------------- | ------------------------------------------------------------------ |
| GIS Google button                      | Want Google-owned gesture / brand button — **not** a hop fix       |
| Broader redirect-default               | Popup still flakes after Tier 0+1 (unlikely primary)               |
| Separate `auth.` host / micro-frontend | Multi-product SSO later — overkill now if thin login entry lands   |
| SSR login                              | Login chrome paint still slow after T2.5 download/parse feels fine |


---

## 5) Recommended path (order)

```text
DONE (Tier 0)    → Kill first-tap errors; hard-ready CTA
DONE (Tier 1)    → Safari/touch redirect (or popup→redirect)
DONE (Tier 2)    → Leave chrome + desktop intent prefetch + login-shell firebase-core preload
DONE (Tier 2.5A) → #880 idle speculative warm → soak hop bands
MAYBE (Tier 2.5B)→ #881 thin login entry only if #880 still short (placeholder)
LATER (Tier 3)   → GIS / host split only if product still wants more chrome (not for hop lag)
```

**Do not** put Firebase **execute** (`initializeApp` / AuthProvider) back on marketing `/`.  
**Do not** await App Check before OAuth.  
**Do** treat “Auth ready before Google enabled” as the modal-era invariant (closed).  
**Do not** treat T2 leave chrome as a hop performance win.  
**Do not** start with GIS for marketing→login latency.  
**Do** allow idle **download** of `firebase-core` on marketing after first paint (#880).

### Success metrics


| Metric                                    | Pass                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| Private Safari cold `/login`              | First Google action succeeds (picker or redirect) — no prior error banner                    |
| Private Safari cold `/`                   | No Firebase **execute** on first paint; after T2.5, idle may **download** `firebase-core`    |
| Marketing Sign in / Create account → form | See §8 targets after T2.5                                                                    |
| Chromium smoke                            | Existing `qa:*` still green                                                                  |
| Regression watch                          | `/tour-stats` stays marketing entry (#853); splash LCP not regressed by aggressive idle warm |
| Field (GA4)                               | See §7 — `web_vital` by route group + auth timing / error rates                              |


### Revise standing rule?

`AUTH_BOOT_PRACTICES` rule 1 / 2: Marketing cold **first paint** stays Firebase-free. After idle (#880), download-only prefetch of login + `firebase-core` is allowed; **execute** still only on `/login`. Rule **2b** shipped with #858.

---

## 6) Decision checklist

- [x] Approve Tier 0 as the immediate hotfix (hard gate > soft idle).
- [x] Tier 1 redirect-on-Safari shipped.
- [x] Confirm we will **not** reopen marketing Firebase **execute** for auth feel.
- [x] Human Safari private-window is the release gate (agents cannot prove WebKit).
- [x] §7 telemetry shipped with Tier 0.
- [x] T2 soak: hop lag still open on mobile private (~5–6s) — T2 recalibrated (§8).
- [x] **Approve Tier 2.5 Phase A (#880)** as the authoritative hop fix (ship first).
- [ ] Human Safari private AC for tap→form after Phase A; unblock or close Phase B placeholder (#881) from numbers.

---

## 7) Telemetry — listeners for content + auth load

Build on what already ships; fill the holes so Tier 0–2.5 changes are measurable in prod GA4 (not only private Safari anecdotes).

**Existing (keep):**


| Signal                             | Where                                                                              | Use for this train                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `web_vital` (LCP/FCP/TTFB/INP/CLS) | `webVitals.js` + `routeGroup.js` (#801) · `[WEB_VITALS_RUM.md](WEB_VITALS_RUM.md)` | Content / shell paint by `route_group` + `navigation_type`                           |
| `page_view`                        | `Ga4RouteListener`                                                                 | Funnel volume by path                                                                |
| `auth_error` / `login` / `sign_up` | `authAnalytics.js` · `[AUTH_TELEMETRY_RUNBOOK.md](AUTH_TELEMETRY_RUNBOOK.md)`      | Google failure codes (`popup-blocked`, etc.), success rate by `method` + `auth_flow` |


**Hole today:** `/login`, `/tour-stats`*, and marketing educational routes all collapse into `route_group = other`, so content vs auth RUM cannot be split in Explorations.

### 7.1 Quick win — fix `route_group` cardinality

Extend `resolveRouteGroup` (stable GA4 dimension — register new values once):


| Path                                                                    | New `route_group` | Why                             |
| ----------------------------------------------------------------------- | ----------------- | ------------------------------- |
| `/login`                                                                | `login`           | Auth entry RUM (today: `other`) |
| `/`, already `splash`                                                   | `splash`          | unchanged                       |
| `/how-it-works`, `/how-scoring-works`, `/phish-setlist-prediction-game` | `marketing`       | Content cold-open vs splash     |
| `/tour-stats*`                                                          | `tour_stats`      | #853 marketing-entry soak       |
| invite/join/dashboard/setup                                             | unchanged         |                                 |


**Listener:** none new — existing `web_vital` emitter picks up groups automatically.  
**GA4:** register `route_group` values if Explorations filter by exact enum; compare p75 LCP/FCP/TTFB: `splash` / `marketing` / `tour_stats` / `login` / `dashboard`.

### 7.2 Auth interaction timings (ship with Tier 0)

Custom events (prod-only via `ga4Event`). Use `performance.now()` deltas; round ms; cap/omit absurd outliers (>60s).


| Event                                   | When                                                                                                       | Params                                                                                                                                                                                                                                  | Answers                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `auth_surface_timing`                   | Once per `/login` visit when Auth surface becomes ready (gate enables Google)                              | `phase`: `paint_to_ready` · `value` (ms) · `route_group=login` · `navigation_type` · `warm_path`: `immediate` | `idle` | `intent` | `speculative`                                                                                       | Did Tier 0 / T2.5 shrink time-to-ready?                               |
| `auth_google_timing`                    | After Google attempt settles (success or error)                                                            | `phase`: `click_to_popup` (ms from click until `signInWithPopup`/`Redirect` invoked) · optional `phase`: `credential_to_nav` (ms until leave `/login`) · `method=google` · `auth_flow` · `outcome`: `success` | `error` · `error_code?` | Is click path sync (near-0 `click_to_popup`)? Post-OAuth still heavy? |
| `auth_cta_gated` (optional, low volume) | First paint of disabled Google CTA                                                                         | `route_group=login`                                                                                                                                                                                                                     | Prove gate is active (DebugView / rare Exploration)                   |
| `auth_hop_timing` (T2.5)                | Optional: marketing CTA click timestamp in `sessionStorage` → measure on `/login` paint / form interactive | `phase`: `cta_to_form` · `intent`: `signin` | `signup` · `warm_path`                                                                                                                                                                    | Did speculative warm shrink Sign in / Create account hop?             |


**Marks (implementation sketch):**

```text
login paint     → performance.mark('auth_login_paint')
surface ready   → mark('auth_surface_ready') + measure → auth_surface_timing
Google click    → mark('auth_google_click')
popup/redirect  → mark('auth_google_oauth_start') + measure click→start → auth_google_timing phase=click_to_popup
login success   → measure oauth_start→navigate → phase=credential_to_nav
```

Wire from `LoginPage` / `warmLoginAuthSurface` / `useSplashSignIn|Up.handleGoogle` — keep emitters in `authAnalytics.js` next to existing auth events.

### 7.3 Auth quality listeners (already half there)


| Check after Tier 0/1       | How                                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First-tap failures drop    | `auth_error` where `method=google` and `error_code` in (`auth/popup-blocked`, `auth/cancelled-popup-request`, `unknown`) — rate vs `login`+`sign_up` google |
| Redirect adoption (Tier 1) | `login` / `auth_error` split by `auth_flow` (`popup` | `redirect`) — register `auth_flow` as custom dimension if not already                                |
| Content not regressed      | p75 `web_vital` LCP for `splash` / `marketing` / `tour_stats` unchanged vs pre-Tier-0 week                                                                  |
| Hop after T2.5             | `auth_hop_timing` / `cta_to_form` p75 by `intent` + `warm_path=speculative`                                                                                 |


### 7.4 What not to add


| Skip                                 | Why                                                   |
| ------------------------------------ | ----------------------------------------------------- |
| Per-chunk download timings to GA4    | Noisy; Network panel / human Safari enough for Tier 0 |
| Emitting RUM on localhost/preview    | Same host gate as #801                                |
| Replacing human Safari AC            | Chromium QA + GA4 cannot prove WebKit gesture         |
| Dual systems (Vercel Speed Insights) | Optional later; one RUM path first                    |


### 7.5 Implementation order with tiers

1. **T0a (#857):** `route_group` splits (§7.1) + `auth_surface_timing` + `auth_google_timing` `click_to_popup` (§7.2). Update `AUTH_TELEMETRY_RUNBOOK.md` + `WEB_VITALS_RUM.md` + register GA4 dims/metrics.
2. **T0b (#858):** hard-ready Google CTA; expect `warm_path=immediate` and near-0 `click_to_popup` p75 after soak.
3. **With Tier 1:** ensure `auth_flow` on all google success/error; Exploration by flow.
4. **With Tier 2:** optional `warm_path=intent` on `auth_surface_timing` when marketing CTA prefetch shortens `paint_to_ready`.
5. **With Tier 2.5:** `warm_path=speculative` + optional `auth_hop_timing` `cta_to_form` for Sign in / Create account.

### 7.6 Soak dashboard (manual GA4 recipe)

1. Explore → Free form, last 7 days, device mobile, browser Safari (when sample allows).
2. **Content:** `web_vital` / LCP p75 by `route_group` ∈ {`splash`,`marketing`,`tour_stats`}.
3. **Auth ready:** `auth_surface_timing` / `paint_to_ready` p75.
4. **Auth click:** `auth_google_timing` / `click_to_popup` p75 (target: ~0–50ms after Tier 0).
5. **Auth errors:** `auth_error` count / google attempts — expect drop vs week before Tier 0.
6. **Hop (after T2.5):** `auth_hop_timing` / `cta_to_form` p75 for `intent=signin|signup` when `warm_path=speculative`.

---

## 8) Soak verdict (2026-08-04) — T2 recalibration + next decision

### What T0–T2 actually closed


| Tier  | Outcome                                                                                                                            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| T0–T1 | **Google first-tap / reliability** on `/login` (original epic pain)                                                                |
| T2    | Honest leave chrome + desktop hover warm + login-shell `firebase-core` preload after arrival — **not** top-tier marketing→auth hop |


### Field finding

Cold **mobile Safari private**: marketing **Sign in** and **Create account** → interactive auth form still ≈ **5–6 seconds**. Hero wordmark flash was intermittent and not reproduced; not the auth-path blocker.

### Why the hop is expensive (architecture, not unfinished T2 polish)

1. Dual-entry hard-nav: leave marketing document → fetch `/login` → boot app entry + React (~~176KB) + auth graph + `firebase-core` (~~440KB).
2. Touch has no hover — T2 prefetch starts with the tap and loses the race to unload.
3. Private Safari ≈ cold cache every session.
4. Leave chrome covers perception of a dead page; it does not reduce work.

Earlier drafts underweighted this and marked the document-swap gap “Closed (#860)” with a “virtually no lag” goal. That claim is **withdrawn**. The hop was knowable from dual-entry; the miss was declaring SPA parity before mobile private soak.

### Authoritative next solution

**Tier 2.5** — see §4:

1. **Phase A [#880]:** post-paint idle speculative **download** of `/login` + critical modules + `firebase-core` (no execute on marketing).  
2. **Phase B [#881] (placeholder, if needed):** thin login Vite entry so the hop is not the full app graph.  
3. **Not GIS-first** — GIS changes Google button ownership, not hop latency.

### Resulting improvements (target)


| Path                                    | Before (soak)                  | After Phase A (idle warm done)                | After Phase A+B      |
| --------------------------------------- | ------------------------------ | --------------------------------------------- | -------------------- |
| Sign in → form                          | ~5–6s                          | ~1.5–3s                                       | ~0.8–2s              |
| Create account → form                   | ~5–6s                          | ~1.5–3s                                       | ~0.8–2s              |
| Continue with Google (once on `/login`) | Already gated/reliable (T0–T1) | Faster `paint_to_ready` when bytes prefetched | Same + thinner parse |


Human Safari private remains the release gate. Agents cannot verify WebKit hop timing.