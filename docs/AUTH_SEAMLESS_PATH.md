# Seamless auth & no-lag entry — path to top-tier feel

**Status:** Decision / roadmap doc (2026-08-04). Delivery epic [#856](https://github.com/pat792/set-picks/issues/856).  
**T0a:** [#857](https://github.com/pat792/set-picks/issues/857) — `route_group` + auth timing emitters (shipped in train; register GA4 dims per runbook).  
**T0b:** [#858](https://github.com/pat792/set-picks/issues/858) — hard-ready Google CTA (immediate warm + gate + sync click path).  
**T1:** [#859](https://github.com/pat792/set-picks/issues/859) — Safari/iOS → `signInWithRedirect` (+ popup→redirect on `popup-blocked`). Parallel: [#867](https://github.com/pat792/set-picks/issues/867) Safari Private “Reduce Protections” banner triage.  

**Standing rules today:** `docs/AUTH_BOOT_PRACTICES.md` (#850 + rule **2b** from #858).  
**Related:** `docs/RELEASE_TRAIN_COLD_OPEN.md` · predecessor [#835](https://github.com/pat792/set-picks/issues/835) · children: T0a [#857](https://github.com/pat792/set-picks/issues/857) · T0b [#858](https://github.com/pat792/set-picks/issues/858) · T1 [#859](https://github.com/pat792/set-picks/issues/859) · T2 [#860](https://github.com/pat792/set-picks/issues/860) · T3 [#861](https://github.com/pat792/set-picks/issues/861).

This answers: how top-tier platforms feel instant; what we can close in this repo; what needs reconfiguration; and a staged path that starts by killing the **new** first-tap Google errors (absent on the old modal path).

---

## 1) What “top-tier” platforms actually do

They do **not** magically make a cold 300KB+ Auth SDK + popup feel free. They arrange the product so the user rarely pays that cost at the moment of the Google tap.

### Entry / paint (no-lag public pages)

| Pattern | Examples / shape | What it buys | What we have |
|--------|-------------------|--------------|--------------|
| **Thin document + deferred app** | Marketing site / docs / landing separate from the authenticated app | Instant HTML/CSS; no Auth on SERP/GenAI cold opens | **Have** — dual-entry marketing (#832); `/tour-stats*` on marketing too (#853). Auth CTAs hard-nav to `/login`. |
| **SSR / edge HTML shell** | Next/Remix/Firebase Hosting SSR, prerender | First paint without waiting on client graph | **Partial** — branded `login/index.html` + SEO prerender shells; not full SSR of React. Enough for marketing/login chrome; not the auth-lag gap. |
| **Session-aware boot** | Cookie / IndexedDB hint → skip marketing, go dashboard | Returning users never see auth chrome | **Have** — persisted session hint + dashboard/email boot (#773 / #804). Anon visitors still see marketing/`/login`. |
| **Prefetch on intent** | Hover/focus “Log in” preloads auth route + Auth SDK | Hard-nav to `/login` already warm | **Gap** — marketing Sign in is a cold hard-nav; Auth warm starts only after `/login` paints (soft idle today). Tier 2. |

### Auth (seamless Google / email)

| Pattern | What top-tier does | What we do |
|--------|--------------------|------------|
| **A. Auth SDK ready before CTA is live** | Auth route loads Firebase Auth (or GIS) as part of becoming interactive; button disabled or hidden until ready | **Have (#858)** — immediate `warmLoginAuthSurface` after paint; Google disabled until Auth + click modules ready (“Preparing sign-in…”). |
| **B. Click handler is sync into OAuth** | No `await` download/init between tap and `signInWithPopup` / redirect / GIS | **Have (#858)** — warm holds Auth + modules; ready click path skips `ensureAuthReady` / dynamic-import (fallback remains for modals / warm failure). |
| **C. App Check / backend off OAuth path** | reCAPTCHA / attestation after credential or parallel; never in front of account picker | **Have** — `#850`: `ensureAuthReady` does not await App Check; Check only before Firestore (`AUTH_BOOT_PRACTICES`). Must not regress. |
| **D. Mobile prefers redirect (or popup→redirect fallback)** | Firebase docs: redirect preferred on mobile; many apps try popup then fall back on `popup-blocked` | **Have (#859)** — Safari / iOS / in-app → redirect; desktop Chromium/Firefox popup; `auth/popup-blocked` → one-shot redirect. Custom `authDomain` + `/__/auth` proxy unchanged. |
| **E. Dedicated auth surface / host** | `accounts.*` or dedicated auth app with Auth always in the graph | **Partial** — full-page `/login` on app document (#834); not a separate auth host. Enough for Tier 0–1; Tier 3 only if needed. |
| **F. Google Identity Services (GIS) button** | Google-owned button/iframe owns the gesture | **Gap** — Firebase `GoogleAuthProvider` + popup/redirect only. Tier 3 optional. |
| **G. Returning session invisible** | Silent restore; auth UI only for signed-out | **Have** — session hint + AuthProvider restore on dashboard/email (#773); signed-in `/login` → dashboard. |

**Bottom line:** “Instant Google” on best platforms ≈ **Auth already loaded + no work in the gesture + often redirect on mobile + users often already signed in.** It is product sequencing, not a secret API.

---

## 2) Why the old modal felt fine (and `/login` regressed)

Old splash/invite **modal** path (`SplashAuthModals`):

1. User was already on the **app document** (Firebase/AuthProvider in play, or soon to be).
2. First click was often **“Sign in” / “Create account”** → modal opens → `ensureAppCheckNow()` + dashboard prefetch **without awaiting before Google**.
3. Second click was **Continue with Google** → Auth/`splashAuthApi` usually already warm → popup inside the gesture.

New `/login` path (#834 / #835):

1. Hard-nav from marketing → **anon `/login` deliberately has no firebase modulepreload**.
2. Form paints with Auth **cold**.
3. First interaction is often **Continue with Google itself**.
4. Soft idle-warm (#850) can lose to a fast Safari tap → `await ensureAuthReady()` + dynamic imports steal the gesture → **first-tap error** (new); second tap works.

So the regression is not “popup stopped working.” It is **we removed the modal’s natural intent buffer and deferred Auth onto the Google button.**

---

## 3) Gaps: closable today vs needs reconfiguration

### Closable in current architecture (no redesign)

| Gap | Symptom | Close with | Gets us to top-tier? |
|-----|---------|------------|----------------------|
| Soft idle-warm race | First Google tap error; second works | **Hard gate:** disable Google until Auth + sign-in modules ready | **Closed (#858)** — restores modal-era first-tap reliability |
| Click still dynamic-imports | Extra await before popup | Prefetch `splashAuthApi` + `completeGoogleSplashAuth`; click path sync into `signInWithPopup` | **Closed (#858)** — pairs with hard gate |
| Idle delayed up to 800ms | Warm starts late | Start Auth warm **immediately after paint** on `/login` (keep marketing Firebase-free) | **Closed (#858)** — `warmPath: immediate` |
| Mobile no hover warm | `pointerenter` useless on touch | Gate + immediate warm; optional `pointerdown` kick | **Yes (partial)** — touch parity with desktop intent; gate covers the rest |
| App Check in front of OAuth | Fixed in #850; must not regress | Keep `AUTH_BOOT_PRACTICES` rule 4 | **Yes (already)** — hold the line; regressing drops us below tier |

### Needs reconfiguration (real ceiling lifts)

| Gap | Why we can’t fully match top-tier today | Reconfiguration | Gets us to top-tier? |
|-----|------------------------------------------|-----------------|----------------------|
| Safari popup residual flakiness | Even with perfect sequencing, Safari/ITP/popup blockers remain; Firebase prefers redirect on mobile | **Safari/iOS → `signInWithRedirect`** (+ popup→redirect on `popup-blocked`). Redirect plumbing + custom `authDomain` / `/__/auth` proxy | **Closed (#859)** — mobile reliability floor |
| Auth page still “feels heavy” after OAuth | Post-auth: AuthProvider wake, profile/`whenFirebaseReady`, dashboard chunk | Keep dashboard/setup prefetch; consider eager AuthProvider on `/login` once warm starts; measure profile path | **Yes (partial)** — post-login snappiness; not the first-tap error |
| Marketing→login still a full document swap | Dual-entry hard-nav is correct for cold marketing, but Auth starts at zero on arrival | Optional: `<link rel="modulepreload">` / prefetch Auth **from marketing Sign-in CTA** (intent prefetch) without booting Auth on `/` | **Yes (partial)** — virtually no lag into ready CTA; marketing stays Firebase-free |
| GIS / federated button | Not integrated | Later: Google Identity Services → `signInWithCredential` if we want Google-rendered CTA | **No (optional)** — native-Google chrome; not required once A–D are solid |
| True SSR auth shell | Vite SPA + branded `login/index.html` shell | Only if paint of login chrome itself is still the complaint after Tier 1 | **No (optional)** — only if login *paint* (not OAuth) is still the issue |

**Not a security vulnerability** for the first-tap error. Custom auth domain + auth proxy are the *right* Firebase setup for redirect. CSP is still Report-Only for framing — separate from this race (see #412 post-mortem).

**Honest non-goal without reconfiguration:** matching native Google One Tap / accounts.google.com feel while keeping **popup-only on Safari** and **Auth cold until Google click**.

---

## 4) Solution set (documented options)

### Tier 0 — Quick wins (restore modal-era reliability)

**Goal:** Eliminate first-tap “Something went wrong” / popup-blocked class on private Safari.  
**Accept:** brief disabled/“Preparing sign-in…” on Google CTA if Auth is still downloading.  
**Keep:** marketing `/` Firebase-free; App Check off OAuth path.

1. On `/login` paint: start `warmLoginAuthSurface()` **immediately** (not only `requestIdleCallback`).
2. Expand warm to include **everything the click path imports** (`splashAuthApi`, `completeGoogleSplashAuth`, Google provider construct).
3. Expose `authSurfaceReady` (promise/state); **disable Continue with Google until ready**.
4. Click handler: if ready, call `signInWithPopup` with **no chunk `await`s** (Auth instance already held).
5. Human AC: private Safari, cold `/login`, **first** Continue with Google opens account picker (or starts redirect — Tier 1).

SemVer: likely **PATCH**. Risk: low if gate is correct; no marketing regression.

### Tier 1 — Match Firebase mobile guidance (**#859**)

**Goal:** Reliability floor of top-tier mobile web auth.

1. Safari / iOS / in-app: prefer **`signInWithRedirect`** via `shouldPreferGoogleRedirectAuth` (stash + `useGoogleRedirectCompletion`). Android Chrome stays popup unless WebView.
2. Desktop Chromium/Firefox: keep popup.
3. On `auth/popup-blocked` → one-shot redirect fallback.

SemVer: **MINOR**. Needs Safari human QA + Chromium smoke.

### Tier 2 — Intent prefetch (marketing → login)

**Goal:** Virtually no lag between “Sign in” on marketing and ready Google CTA.

1. Marketing Sign in / Create account links: `rel` prefetch / dynamic `import()` of login warm chunk **without** initializing Auth on marketing document (or only prefetch JS URLs).
2. Optionally add `firebase-core` modulepreload **only** on `dist/login/index.html` (lift `LOGIN_BOOT_PRELOAD_BLOCKLIST` for login shell only).

Tradeoff: login document slightly heavier; marketing cold open unchanged.

### Tier 3 — Reconfiguration (only if Tier 0–2 still feel short of “top-tier”)

| Option | When |
|--------|------|
| GIS Google button | Want Google-owned gesture / brand button |
| Broader redirect-default | Popup still flakes after Tier 0+1 |
| Separate `auth.` host / micro-frontend | Multi-product SSO later — overkill now |
| SSR login | Login chrome paint still slow after Auth gate feels fine |

---

## 5) Recommended path (order)

```text
NOW (Tier 0)     → Kill first-tap errors; hard-ready CTA
THEN (Tier 1)    → Safari/touch redirect (or popup→redirect)
THEN (Tier 2)    → Marketing intent prefetch + optional login firebase modulepreload
LATER (Tier 3)   → GIS / deeper host split only if product still wants more
```

**Do not** put Firebase back on marketing `/`.  
**Do not** await App Check before OAuth.  
**Do** treat “Auth ready before Google enabled” as the modal-era invariant we accidentally dropped.

### Success metrics

| Metric | Pass |
|--------|------|
| Private Safari cold `/login` | First Google action succeeds (picker or redirect) — no prior error banner |
| Private Safari cold `/` | No `firebase-core` until auth CTA / `/login` |
| Chromium smoke | Existing `qa:*` still green |
| Regression watch | `/tour-stats` stays marketing entry (#853) |
| Field (GA4) | See §7 — `web_vital` by route group + auth timing / error rates |

### Revise standing rule?

`AUTH_BOOT_PRACTICES` rule 2 (“paint before firebase-core”) stays for **first paint**. Rule **2b** shipped with #858:

> **2b. Google CTA must not be enabled until Auth surface is ready.** Soft idle-warm alone is insufficient on Safari.

---

## 6) Decision checklist (before coding)

- [ ] Approve Tier 0 as the immediate hotfix (hard gate > soft idle).
- [ ] Choose Tier 1 now or after Tier 0 soak: redirect-on-Safari vs popup-only + gate.
- [ ] Confirm we will **not** reopen marketing Firebase for auth feel.
- [ ] Human Safari private-window is the release gate (agents cannot prove WebKit).
- [ ] Ship §7 telemetry with Tier 0 (or immediately before) so soak has baselines.

---

## 7) Telemetry — listeners for content + auth load

Build on what already ships; fill the holes so Tier 0–2 changes are measurable in prod GA4 (not only private Safari anecdotes).

**Existing (keep):**

| Signal | Where | Use for this train |
|--------|--------|--------------------|
| `web_vital` (LCP/FCP/TTFB/INP/CLS) | `webVitals.js` + `routeGroup.js` (#801) · [`WEB_VITALS_RUM.md`](WEB_VITALS_RUM.md) | Content / shell paint by `route_group` + `navigation_type` |
| `page_view` | `Ga4RouteListener` | Funnel volume by path |
| `auth_error` / `login` / `sign_up` | `authAnalytics.js` · [`AUTH_TELEMETRY_RUNBOOK.md`](AUTH_TELEMETRY_RUNBOOK.md) | Google failure codes (`popup-blocked`, etc.), success rate by `method` + `auth_flow` |

**Hole today:** `/login`, `/tour-stats*`, and marketing educational routes all collapse into `route_group = other`, so content vs auth RUM cannot be split in Explorations.

### 7.1 Quick win — fix `route_group` cardinality

Extend `resolveRouteGroup` (stable GA4 dimension — register new values once):

| Path | New `route_group` | Why |
|------|-------------------|-----|
| `/login` | `login` | Auth entry RUM (today: `other`) |
| `/`, already `splash` | `splash` | unchanged |
| `/how-it-works`, `/how-scoring-works`, `/phish-setlist-prediction-game` | `marketing` | Content cold-open vs splash |
| `/tour-stats*` | `tour_stats` | #853 marketing-entry soak |
| invite/join/dashboard/setup | unchanged | |

**Listener:** none new — existing `web_vital` emitter picks up groups automatically.  
**GA4:** register `route_group` values if Explorations filter by exact enum; compare p75 LCP/FCP/TTFB: `splash` / `marketing` / `tour_stats` / `login` / `dashboard`.

### 7.2 Auth interaction timings (ship with Tier 0)

Custom events (prod-only via `ga4Event`). Use `performance.now()` deltas; round ms; cap/omit absurd outliers (>60s).

| Event | When | Params | Answers |
|-------|------|--------|---------|
| `auth_surface_timing` | Once per `/login` visit when Auth surface becomes ready (gate enables Google) | `phase`: `paint_to_ready` · `value` (ms) · `route_group=login` · `navigation_type` · `warm_path`: `immediate` \| `idle` \| `intent` | Did Tier 0 shrink time-to-ready? |
| `auth_google_timing` | After Google attempt settles (success or error) | `phase`: `click_to_popup` (ms from click until `signInWithPopup`/`Redirect` invoked) · optional `phase`: `credential_to_nav` (ms until leave `/login`) · `method=google` · `auth_flow` · `outcome`: `success` \| `error` · `error_code?` | Is click path sync (near-0 `click_to_popup`)? Post-OAuth still heavy? |
| `auth_cta_gated` (optional, low volume) | First paint of disabled Google CTA | `route_group=login` | Prove gate is active (DebugView / rare Exploration) |

**Marks (implementation sketch, not shipped):**

```text
login paint     → performance.mark('auth_login_paint')
surface ready   → mark('auth_surface_ready') + measure → auth_surface_timing
Google click    → mark('auth_google_click')
popup/redirect  → mark('auth_google_oauth_start') + measure click→start → auth_google_timing phase=click_to_popup
login success   → measure oauth_start→navigate → phase=credential_to_nav
```

Wire from `LoginPage` / `warmLoginAuthSurface` / `useSplashSignIn|Up.handleGoogle` — keep emitters in `authAnalytics.js` next to existing auth events.

### 7.3 Auth quality listeners (already half there)

| Check after Tier 0/1 | How |
|----------------------|-----|
| First-tap failures drop | `auth_error` where `method=google` and `error_code` in (`auth/popup-blocked`, `auth/cancelled-popup-request`, `unknown`) — rate vs `login`+`sign_up` google |
| Redirect adoption (Tier 1) | `login` / `auth_error` split by `auth_flow` (`popup` \| `redirect`) — register `auth_flow` as custom dimension if not already |
| Content not regressed | p75 `web_vital` LCP for `splash` / `marketing` / `tour_stats` unchanged vs pre-Tier-0 week |

### 7.4 What not to add

| Skip | Why |
|------|-----|
| Per-chunk download timings to GA4 | Noisy; Network panel / human Safari enough for Tier 0 |
| Emitting RUM on localhost/preview | Same host gate as #801 |
| Replacing human Safari AC | Chromium QA + GA4 cannot prove WebKit gesture |
| Dual systems (Vercel Speed Insights) | Optional later; one RUM path first |

### 7.5 Implementation order with tiers

1. **T0a (#857):** `route_group` splits (§7.1) + `auth_surface_timing` + `auth_google_timing` `click_to_popup` (§7.2). Update `AUTH_TELEMETRY_RUNBOOK.md` + `WEB_VITALS_RUM.md` + register GA4 dims/metrics.  
2. **T0b (#858):** hard-ready Google CTA; expect `warm_path=immediate` and near-0 `click_to_popup` p75 after soak.  
3. **With Tier 1:** ensure `auth_flow` on all google success/error; Exploration by flow.  
4. **With Tier 2:** optional `warm_path=intent` on `auth_surface_timing` when marketing prefetch shortens `paint_to_ready`.

### 7.6 Soak dashboard (manual GA4 recipe)

1. Explore → Free form, last 7 days, device mobile, browser Safari (when sample allows).  
2. **Content:** `web_vital` / LCP p75 by `route_group` ∈ {`splash`,`marketing`,`tour_stats`}.  
3. **Auth ready:** `auth_surface_timing` / `paint_to_ready` p75.  
4. **Auth click:** `auth_google_timing` / `click_to_popup` p75 (target: ~0–50ms after Tier 0).  
5. **Auth errors:** `auth_error` count / google attempts — expect drop vs week before Tier 0.
