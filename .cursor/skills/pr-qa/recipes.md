# PR QA Recipes

Browser-based verification scripts keyed to the PR type. Use these
verbatim when walking the user through Step 3 of SKILL.md.

Every recipe assumes the user is on the **per-PR preview URL** (not
staging) in a fresh incognito tab with DevTools open.

## Default DevTools setup

Communicate this to the user every time before running any recipe:

```
DevTools → Network tab
  Filter tab row: click "All"   (NOT "JS" — JS hides Fetch/XHR, which is
                                 where all Firestore and Firebase traffic
                                 lives)
  Preserve log: ON
  Disable cache: ON  (only for chunk-load / cache-header tests;
                      leave OFF for React Query cache tests so the
                      browser's HTTP cache doesn't mask the app cache)
  Throttling: No throttling  (unless measuring perf; then Slow 4G)
```

---

## §A — Chunk-load verification

Use for: `perf(app): route splitting` (#240), `perf(build): manualChunks`
(#241), `perf(firebase): defer X` (#242) when confirming a module is
absent from unrelated routes.

**Preferred (agent, issue #251):** On a local checkout of the PR branch,
run `npm run build` then **`npm run qa:chunks`** (loads `vite preview` +
Playwright). See **`scripts/qa/README.md`**. Exit **0** ⇒ the runner's
chunk / SPA-nav assertions passed for its scripted path. This does
**not** replace every §A variant (e.g. "firebase-storage absent on
profile" is still manual unless extended in the runner).

**Manual fallback:** PR preview URL + user + DevTools — use when the
runner was skipped, failed for an env reason you fixed by hand, or you
need a route the runner does not cover.

**Script (manual):**

```
1. PR preview URL, fresh incognito, DevTools open.
2. Network tab, filter tabs = "JS", Disable cache = ON, Preserve log = ON.
3. Navigate to route A (usually splash "/").
4. Screenshot the rows loaded — this is the critical path for route A.
5. Clear the log (⊘ button). Do NOT reload.
6. Click through to route B via SPA nav (<Link>, not typed URL).
7. Observe the NEW JS rows.
```

**Pass:** Only the expected route's chunks appear in step 7 (e.g.
visiting `/dashboard/picks` fetches `PicksPage-*.js` plus its
unique deps, nothing else).

**Fail:** Chunks for unrelated routes show up (e.g. `AdminPage-*.js`
loading when visiting `/dashboard/profile`). Likely cause: a static
import chain reaches across routes. Trace with:

```bash
grep -l AdminPage- dist/assets/*.js
```

Anything other than the expected entry path is the culprit.

### §A variant — "module absent on unrelated routes"

Use specifically after #242-style deferral PRs. Example for `firebase-
storage`:

```
1. Clear log on the PR preview URL.
2. Visit /dashboard/profile (a route that should NOT need storage).
3. Search box in Network panel: "firebase-storage".
```

**Pass:** Zero rows match. Storage chunk never fetched on this route.

**Fail:** One or more `firebase-storage-*.js` rows present. Module is
still eager on a path it shouldn't be.

---

## §B — Firestore read cache verification

Use for: `perf(stats): React Query caching` (#243), or any PR wrapping a
hook that calls Firestore in a cache layer.

**Preferred (agent, issue #251 / #349):** On a local checkout, configure
**`.env.qa.local`** from **`.env.qa.example`**
(`QA_PUBLIC_PROFILE_UID`, **`QA_APPCHECK_DEBUG_TOKEN`** registered in Firebase
App Check → Manage debug tokens, **`QA_TEST_EMAIL`** / **`QA_TEST_PASSWORD`**
for splash sign-in — Firestore rules require `signedIn()`; see
`scripts/qa/README.md`), then run `npm run build` then **`npm run qa:cache`**.
Exit **0** ⇒ the
`useUserSeasonStats` cache assertion for `/user/<uid>` SPA bounce passed
(see `scripts/qa/firestore-cache.mjs` header comments). **Not applicable**
to auth-gated stats routes (`/dashboard/standings`, etc.) — those still
need manual recipe or a future emulator-backed runner.

**Manual fallback:** Same as below when env is missing, the UID is too
sparse for thresholds, or you're validating a different hook.

### Critical facts to communicate up front

Otherwise the user misinterprets every screenshot:

- **Firebase v10 multiplexes EVERY Firestore op onto one WebChannel
  connection.** There are no separate `/v1/projects/.../documents/...`
  rows. All reads appear as
  `channel?VER=8&database=projects%2F...` rows.
- **The interesting rows are the BIG ones** (multi-kB payloads, visible
  duration). The many 0.1 kB rows are WebChannel keep-alives / acks —
  normal background chatter, not reads.
- **Hard reload resets React Query.** The whole point of in-session
  caching is that soft navigation (`<Link>` clicks, `navigate(...)`)
  reuses the cache. Use soft nav, not refresh.

### Script — "is this query cached?" (manual)

```
1. PR preview URL, fresh incognito, DevTools open.
2. Network → All → Preserve log ON → Disable cache OFF.
3. Navigate to the page that runs the hook. Examples:
    • useUserSeasonStats   →  /user/<someone-else's-uid>
    • useTourStandings     →  /dashboard/standings (for a past show)
4. Let it finish. Note any channel?VER=8 row > ~5 kB — that's the
   initial batch read. Screenshot this as the baseline.
5. Click ⊘ to clear the log. Do NOT reload.
6. Navigate away via a SPA link (Pools tab, Standings tab, etc.).
7. Navigate BACK to the same URL via a SPA link.
8. Observe the NEW rows.
```

**Pass:** Only 0.1 kB keep-alive rows. No fresh multi-kB payload. Stats
cards populate instantly, no spinner flash.

**Fail:** A new multi-kB `channel?VER=8...` row appears, similar to the
baseline. Likely cause: `queryKey` is unstable across mounts (includes
a freshly-built array/object), or the wrapping hook is still
re-fetching via its own effect.

---

## §C — Cache-control header verification

Use for: any PR touching `vercel.json`.

**Preferred (agent, issue #348):** With **`QA_PREVIEW_BASE_URL`** (and optional
**`QA_VERCEL_PROTECTION_BYPASS`**) in **`.env.qa.local`**, run
**`npm run qa:preview-headers`**. Exits **0 SKIP** when the base URL is unset.
CI runs the same script when repo **Variable** `QA_PREVIEW_BASE_URL` is
configured.

**Agent limitation:** Without bypass credentials, `curl` against protected
previews returns **401** — use the runner or walk the user through DevTools.

**Manual script:**

```
1. PR preview URL. DevTools → Network → All → Disable cache = OFF.
2. Reload once.
3. Click any row under /assets/*.{js,css}. Inspect Response Headers.
```

**Pass:** Row shows `cache-control: public, max-age=31536000, immutable`.

**Fail:** Missing header, or a shorter max-age, or `no-cache`. Check
`vercel.json` for the source pattern (`/assets/(.*)` must be present).

**Also verify:**

```
4. Click the row for the HTML document (/ or /index.html).
5. Response Headers should show:
     cache-control: public, max-age=0, must-revalidate
```

A long max-age on the HTML shell breaks asset-hash invalidation.

---

## §D — Feature click-through (new UI / hook)

Use for: `feat(...)` PRs introducing new UI or a new hook.

**Agent-side first:** confirm any new hook has vitest coverage for its
core logic. Then script the user through:

```
1. PR preview URL. DevTools open.
2. Navigate to the feature's entry route.
3. Exercise the happy path (describe the exact click sequence).
4. Exercise the known edge cases from the PR body's "Test plan" checklist.
```

**Pass/fail:** Whatever the PR body's Test plan says. Don't substitute
your own criteria.

---

## §E — Telemetry / GA4 verification

Use for: PRs adding or changing a GA4 event.

**Three routes, in order of agent-friendliness:**

### E.1 Vitest on the emitter (preferred)

If the emitter has a test that asserts the final `ga4Event(...)` call
shape, and that test passes, the param shape is correct. No browser
step required.

### E.2 `npm run dev` console mirror

Every telemetry emitter in this repo mirrors to `console.info` in dev
(`import.meta.env.DEV`). Ask the user:

```
1. Locally: git checkout <branch> && npm run dev
2. Open http://localhost:5173 with browser console.
3. Trigger the event (visit /user/<uid>, etc.).
4. Look for: [telemetry] <event_name> { ...params }
5. Screenshot the console line.
```

**Pass:** Line appears with every expected param populated.

**Fail:** No line → emitter isn't being called. Wrong params → shape
mismatch.

### E.3 GA4 DebugView

Only if the user needs production-signal confirmation:

```
1. PR preview URL + ?debug_mode=true in the URL.
2. GA4 DebugView (the user needs access in the GA4 project).
3. Trigger the event. Confirm it appears with the right params.
```

Slowest to set up; highest signal; reserve for when other paths have
produced ambiguous results.

### Never claim telemetry fired "on the preview URL"

The preview is a production build — `import.meta.env.DEV === false` —
so the console line is suppressed. Telemetry firing to GA4 is only
visible via DebugView. Don't say "I verified telemetry on the preview"
when you just didn't see the console line.

---

## Recipe combinations by PR type

| PR pattern | Agent-side (SKILL.md §2) | Recipes to run |
|---|---|---|
| `perf(app): route splitting` | 2.1, 2.2, 2.5, **2.6** `qa:chunks` | §A (prefer runner, then manual gaps) |
| `perf(build): manualChunks + headers` | 2.1, 2.2, 2.3, **2.6** `qa:chunks` | §A + §C |
| `perf(firebase): defer X` | 2.1, 2.2, 2.3 | §A variant "module absent" |
| `perf(stats): React Query` | 2.1, 2.2, **2.6** `qa:cache` | §B (prefer runner for `/user/:uid` hook) |
| `perf(stats): server aggregates` | 2.1 + `test:rules` | Production-only; defer |
| `feat(...)` | 2.1, 2.4, 2.5 | §D |
| Any GA4-touching PR | 2.1 | §E (preferably E.1) |

If the PR touches more than one pattern, run the union — don't skip
recipes to save time. Each one catches a failure class the others
don't.
