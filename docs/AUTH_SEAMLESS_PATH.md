# Seamless auth & no-lag entry — path to top-tier feel

**Status:** Decision / roadmap doc — **field stop 2026-08-05** (after v1.53.2).  
**Delivery epic (parked):** [#889](https://github.com/pat792/set-picks/issues/889) — HTML-first auth door (three-surface).  
**Predecessor (CSR hop / Google reliability train):** [#856](https://github.com/pat792/set-picks/issues/856) — historical; remaining hop work superseded by #889.

### Field stop (2026-08-05) — read this first

**Stop shipping further auth-door / cold-open / CSR-hop work until explicitly resumed.** Prod is at **v1.53.2**.

| Shipped | Notes |
|--------|--------|
| **v1.53.1 (#890)** | Phase 0 reliability: retire #881 thin `login.html`; `/login` boots `app.html` + branded shell again |
| **v1.53.2 (#899)** | Log Out hang: post-sign-out → marketing `/` (not race HardRedirect → `/login`) |

**Do not start another CSR hop tier.** Do not re-thin `/login`. Do not “fix feel” with more prefetch experiments in this train.

Parked (not cancelled): HTML-first auth door (#889 / #892), tour-stats CDN JSON (#869), email CTA flow matrix (#893). Resume only with an explicit human go — not as agent default.

Standing rules still in force: `docs/AUTH_BOOT_PRACTICES.md` (Google gesture / App Check / Safari redirect).

**Target architecture (when resumed):** three surfaces —

| Surface | Job | Construction |
|--------|-----|----------------|
| **Marketing** | SEO/GEO, demand gen | Light document; Firebase-**execute**-free on first paint |
| **Auth door** | Sign in / sign up only | **HTML-first form** + auth-only JS hydrate (keep Firebase) |
| **App** | Live game | Existing dashboard SPA |

**Related:** `docs/OUTBOUND_AUTH_HANDOFF.md` · `docs/RELEASE_TRAIN_COLD_OPEN.md` · `docs/API.md` (`/login`) · children T0–T2.5 below (historical).

---

## Why keep this doc (do not delete)

`AUTH_SEAMLESS_PATH` remains the continuity record for:

- what top-tier platforms actually do (§1)
- why the modal → `/login` regression happened (§2)
- soak evidence that CSR hop tiers were insufficient (§8)
- telemetry already shipped (§7)
- non-negotiable constraints (no Firebase execute on marketing first paint; App Check off OAuth gesture)

What changed on 2026-08-05: **§5 recommended path** is no longer “finish T2.5 hop bands.” It is **HTML-first auth door after reliability restore.** T0–T2.5 stay documented as history so agents do not re-derive or re-run that train as the strategy.

---

## 1) What “top-tier” platforms actually do

They do **not** magically make a cold 300KB+ Auth SDK + popup feel free. They split surfaces so marketing, auth, and the app have different jobs.

### Three surfaces (industry precedent)


| Surface | Norm | What we have |
|--------|------|----------------|
| **Marketing** | SSR/SSG or thin static; no Auth on cold LCP | **Have** — dual-entry marketing (#832); `/tour-stats*` marketing (#853) |
| **Auth door** | Dedicated page: form in first HTML (or hosted IdP); auth-only JS | **Gap** — `/login` is a CSR app mount (skeleton → React → form). Thin entry (#881) was still CSR; regressed Safari private |
| **App** | SPA / heavy client after session | **Have** — `app.html` dashboard SPA |


### Patterns (entry)


| Pattern | What it buys | Our status |
|--------|----------------|------------|
| **Thin marketing document** | Instant content; no Auth on SERP/GEO cold opens | **Have** (#832 / #853) |
| **HTML-first auth door** | Form visible without waiting on app graph | **Gap → Phase 2** (authoritative). Current branded shell is skeleton-only, not the form |
| **Session-aware boot** | Returning users skip auth chrome | **Have** (#773 / #804) |
| **Prefetch / speculative warm** | Hop bytes warm before tap | **Have** (#860 / #880) — polish only after auth door is correct; not the strategy |
| **Thin CSR auth entry** | Smaller parse than dashboard SPA | **Tried (#881)** — necessary direction, wrong completeness (still CSR mount; prod WebKit hang) |
| **Hosted IdP / GIS** | Provider-owned credential UX | **Deferred** — keep Firebase; optional later (not required to close the door) |


### Patterns (Google / email on the auth door)


| Pattern | Status |
|--------|--------|
| Auth ready before Google CTA enabled | **Have (#858)** — keep on whatever serves `/login` |
| Sync click into popup/redirect | **Have (#858)** |
| App Check off OAuth gesture | **Have (#850)** — must not regress |
| Safari / iOS prefer redirect | **Have (#859)** |
| Returning session → dashboard | **Have** |


**Bottom line:** Best-in-class ≈ **marketing light + auth door HTML-first (or hosted) + app SPA** — not “faster CSR hop to a skeleton that eventually mounts the form.”

---

## 2) Why the old modal felt fine (and `/login` regressed)

Old splash/invite **modal** path:

1. User was already on the **app document** (Auth graph in play or soon to be).
2. First click opened chrome; second click was often Google with Auth warm.

New `/login` path (#834+):

1. Hard-nav from marketing → **new document**.
2. Product intent was “dedicated HTML page with a form.”
3. Engineering shape became “CSR route / thin CSR entry”: shell HTML → download JS → React → form.
4. Hop trains (T2–T2.5) optimized that CSR approach path. They could not turn a CSR mount into an HTML-first door.

So the product decision (dedicated page) was right; the missing brief was **form in first HTML + auth-only hydrate**, not only “new route + faster bytes.”

---

## 3) Gaps: closed vs open

### Closed (keep)


| Gap | Closed by |
|-----|-----------|
| Soft idle-warm Google first-tap race | #858 hard gate |
| Click still dynamic-imports before OAuth | #858 |
| App Check in front of OAuth | #850 |
| Mobile Safari popup flakiness floor | #859 redirect |
| CTA leave feels dead | leave chrome (#872 / v1.51.x) |
| Marketing cold Firebase execute | #832 dual-entry |


### Open (authoritative)


| Gap | Why CSR hop didn’t finish it | Close with |
|-----|------------------------------|------------|
| `/login` form not in first HTML | Skeleton + CSR mount; #881 still CSR | **Phase 2 HTML-first auth door** |
| Safari private login hang (v1.53.0) | Thin CSR entry fail-closed | **Phase 0** rollback/hotfix |
| Marketing→form still feels like a cold app boot | Dual-doc + CSR login is structural | Door construction (§5), then optional warm polish |


### Deferred (not the strategy)


| Option | When |
|--------|------|
| GIS / One Tap | After door is reliable; Google chrome only |
| Auth0 / Clerk / hosted IdP | Only if Firebase itself becomes the limiter |
| Separate `auth.` host | Optional later; HTML-first `/login` on same origin is enough first |
| More CSR speculative-warm tiers | Do **not** run as the next epic |


---

## 4) Historical solution set (T0–T2.5) — closed train

Keep for continuity. **Do not extend this train** as the plan for marketing → form.

| Tier | Issue | Outcome |
|------|-------|---------|
| T0a | #857 | `route_group` + auth timing emitters — shipped |
| T0b | #858 | Hard-ready Google CTA — shipped; reliability win |
| T1 | #859 | Safari redirect — shipped |
| T2 | #860 | Leave chrome + intent prefetch + login `firebase-core` preload — shipped; hop not closed |
| T2.5A | #880 | Idle speculative download-warm — shipped; Safari ~4.5s (miss ~1.5–3s band) |
| T2.5B | #881 | Thin CSR `login.html` entry — shipped v1.53.0; **Safari private hang regression** |

Lesson: hop polish on a CSR login document can improve download and still leave (or worsen) WebKit private outcomes. Next work changes **door construction**, not hop tier number.

---

## 5) Recommended path (order) — authoritative

```text
NOW  (Phase 0)  → Restore login reliability on WebKit private (hotfix/rollback #881 hang)
NOW  (Phase 1)  → Lock three-surface contract in docs/issues (this section)
NEXT (Phase 2)  → HTML-first /login + auth-only Firebase hydrate (keep Firebase)
LATER(Phase 3)  → Re-attach download-only warm / leave chrome polish if still useful
KEEP (Phase 4)  → Dashboard stays the SPA; don’t pull app graph into the auth door
DEFER          → GIS / hosted IdP only if product still wants more after Phase 2
```

### Phase 0 — Stop the bleeding

1. Roll back or hotfix so Safari private marketing → Sign in shows an **interactive form** (no indefinite skeleton/hang). **Shipped:** [#890](https://github.com/pat792/set-picks/issues/890) → **v1.53.1** — retire thin `login.html` entry; `/login` boots `app.html` + branded shell again.
2. Freeze hop/preload experiments until Phase 0 passes. **Field stop 2026-08-05:** freeze remains in force after **v1.53.2** (#899 Log Out fix); do not auto-continue Phase 1–2.
3. **Gate:** WebKit private (closest available) — form every time; Google first enabled tap works.
4. **Collateral (#899 / v1.53.2):** intentional Log Out must hard-nav marketing `/`, not race dashboard unauth → `/login`.

### Phase 1 — Architecture contract

Treat as law (update issues/PRs against this, not against “finish hop bands”):

1. Marketing: Firebase-execute-free on first paint.
2. Auth door `/login`: **real form in first HTML**; auth-only JS; hard-nav to `/setup` or `/dashboard` on success.
3. App: existing SPA.
4. WebKit private on marketing → login is a **merge blocker** for auth-door changes. Chromium CI is necessary, not sufficient.

### Phase 2 — Build the auth door

**Recommended vehicle:** keep Firebase; server HTML or fully inlined build HTML for `/login` whose body already contains sign-in / create-account form chrome; tiny hydrate bundle wires Auth (redirect on Safari, popup on desktop Chromium), email/password, terms gate, post-auth hard-nav.

**Out of scope for Phase 2:** GIS, IdP migration, Firebase execute on marketing, another CSR hop epic.

**Acceptance:**

- [ ] First document for `/login` includes form fields (not empty `#root` + skeleton-only).
- [ ] Safari private: form usable; no indefinite hang.
- [ ] Google first enabled tap → picker or redirect.
- [ ] Email sign-in / sign-up + terms gate preserved.
- [ ] Marketing cold open unchanged.
- [ ] Signed-in `/login` hard-sends to dashboard/setup.
- [ ] Hop ms is a soak metric after reliability; not the design center.

### Phase 3 — Demand-gen polish (optional)

Only after Phase 2 is green on WebKit private: leave chrome, download-only warm of auth-door assets from marketing.

### Phase 4 — App surface

Leave the live game as the SPA. Do not mount dashboard/react-query on the auth door critical path. Invite VIP modal parity can stay a later project.

### Non-negotiables (unchanged)

- **Do not** put Firebase **execute** on marketing `/` first paint.  
- **Do not** await App Check before OAuth.  
- **Do** keep Auth-ready-before-Google on the auth door.  
- **Do not** treat leave chrome or prefetch as the auth-door strategy.  
- **Do not** claim Safari verified from `qa:*` alone.

### Success metrics


| Metric | Pass |
|--------|------|
| WebKit private marketing → `/login` | Form interactive every time (Phase 0 / 2) |
| WebKit private Google | First enabled tap succeeds (picker or redirect) |
| Marketing cold `/` | No Firebase execute on first paint |
| `/login` document | Form markup in first HTML (Phase 2) |
| Chromium `qa:*` | Still green |
| Hop timing | Measure after Phase 2; do not block Phase 2 on ms bands |


---

## 6) Decision checklist

- [x] Tier 0–1 shipped (Google reliability + Safari redirect).
- [x] Do **not** reopen marketing Firebase execute for auth feel.
- [x] Human / WebKit private is the release gate for auth-door work.
- [x] T2–T2.5 CSR hop train: useful learnings; **not** the remaining strategy (§8).
- [x] **2026-08-05:** Adopt HTML-first auth door (§5) as authoritative next solution.
- [x] Phase 0: prod Safari private login hang resolved (v1.53.1 #890); Log Out race fixed (v1.53.2 #899). **Field stop.**
- [ ] Phase 1: contract reflected in boot practices + delivery issue(s).
- [ ] Phase 2: HTML-first `/login` shipped + WebKit private AC.

---

## 7) Telemetry — keep

T0a emitters remain useful for the auth door and marketing:

| Signal | Use |
|--------|-----|
| `web_vital` + `route_group` (`login`, `splash`, `marketing`, …) | Content vs auth RUM |
| `auth_surface_timing` / `paint_to_ready` + `warm_path` | Time-to-ready on `/login` |
| `auth_google_timing` / `click_to_popup` | Gesture path still sync |
| `auth_hop_timing` / `cta_to_form` | Marketing → form after door is stable |
| `auth_error` / `login` / `sign_up` | Google reliability |

Ops: `docs/AUTH_TELEMETRY_RUNBOOK.md` · `docs/WEB_VITALS_RUM.md`.

After Phase 2, prefer interpreting hop metrics as polish on an HTML-first door — not as proof that another CSR preload tier is required.

---

## 8) Soak verdicts (historical)

### 8a) T2 recalibration (2026-08-04)

| Tier | Outcome |
|------|---------|
| T0–T1 | Google first-tap / reliability on `/login` |
| T2 | Leave chrome + desktop warm + login-shell preload — **not** top-tier hop |

Cold mobile Safari private (pre–Phase A): marketing → form ≈ **5–6s**.

### 8b) Phase A (#880) soak (2026-08-05)

| Browser (private) | Tap → form | vs ~1.5–3s |
|-------------------|------------|------------|
| Chrome | ~**3s** | Top of band |
| Safari | ~**4.5s** | Miss |

Unblocked thin CSR entry (#881).

### 8c) Phase B (#881) ship (2026-08-05) — **strategy recalibration**

Thin CSR `login.html` entry shipped (v1.53.0). Field: Safari private **login loading hang** (fail-closed), not a clean hop-band win.

**Read:** Further CSR hop optimization is the wrong lever. Restore reliability (Phase 0), then build an **HTML-first auth door** (Phase 2). See §5.

Human WebKit private remains the release gate. Agents cannot verify WebKit.
