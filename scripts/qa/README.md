# `scripts/qa/` — agent-runnable browser QA recipes

Codified versions of the browser-side recipes documented in
[`.cursor/skills/pr-qa/recipes.md`](../../.cursor/skills/pr-qa/recipes.md).
The agent can run these directly without the human-in-the-loop screenshot
hand-off described in `.cursor/skills/pr-qa/SKILL.md` §3.

Pilot scope tracked in [#251](https://github.com/pat792/set-picks/issues/251).

## Why this exists

The PR QA playbook treats every browser-observable check (Firestore read
cache, chunk-load on SPA nav, cache-control headers, telemetry in the
production build) as a hand-off to the human. That's correct given the
agent's current toolbelt — `Shell` plus file ops, no browser — but it's
friction on every PR.

These runners convert deterministic browser checks into shell-runnable
scripts the agent can execute as part of `Step 2 — Agent-side checks`,
falling back to the manual recipe only when the script can't reach the
test data (logged-in routes pre-emulator, production-only signals, etc.).

## Setup (one time)

```bash
cp .env.qa.example .env.qa.local
# Edit .env.qa.local and fill in the values per the comments.
```

`.env.qa.local` is gitignored — it stays on your machine. The committed
`.env.qa.example` is the template with placeholder values.

The npm scripts load the file via Node's `--env-file-if-exists` flag, so
a missing file fails inside the runner with a clear pointer back to this
README rather than a cryptic "undefined" error.

### App Check (`qa:cache` only)

`npm run qa:chunks` does not talk to Firestore. `npm run qa:cache` does, and
the production build uses App Check with the ReCAPTCHA Enterprise provider —
headless Chromium cannot pass that without a **debug token**.

1. Generate a UUID (any v4).
2. Firebase Console → **App Check** → your **Web** app → **Manage debug
   tokens** → add that UUID.
3. Put the same string in `.env.qa.local` as **`QA_APPCHECK_DEBUG_TOKEN`**.

If this variable is missing or not registered, the runner used to hang on
“Total points” while Firestore logged `403` / offline errors in the browser
console.

## Available runners

| Script | npm task | Recipe (recipes.md) |
|---|---|---|
| `firestore-cache.mjs` | `npm run qa:cache` | §B Firestore read cache |
| `chunk-split.mjs` | `npm run qa:chunks` | §A chunk-load verification |

Each runner:

1. Spawns `npm run preview` (production build, served on a throwaway
   port) so we exercise the same artifact a Vercel preview would.
2. Drives a headless Chromium (Playwright) against `localhost:<port>`.
3. Asserts the recipe's pass/fail observable.
4. Exits 0 (pass) or non-zero (fail), with a one-line diagnostic on
   failure.

## Adding a new runner

Convention for `scripts/qa/<recipe>.mjs`:

1. **Self-contained.** Spawn `npm run preview` on a throwaway port,
   tear it down on exit (including on `SIGINT` / thrown error). Don't
   assume an external dev server.
2. **Deterministic.** No timing-dependent assertions; wait on
   network-idle / DOM signals, not `setTimeout`. If the recipe is
   inherently empirical (e.g. "payload < 2 kB"), document the threshold
   and how it was chosen at the top of the file.
3. **One concern per runner.** Don't bundle Firestore-cache and
   chunk-split assertions in the same script — the failure modes are
   independent and split runners give cleaner diagnostics.
4. **Failure messages point to the recipe.** A failed assertion should
   print "see `.cursor/skills/pr-qa/recipes.md` §X for context."
5. **Fixtures live in `fixtures.js`.** UIDs, sample show dates, etc.
   Add a new `requireEnv(...)` export and document it in
   `.env.qa.example`. Never hard-code real-account identifiers in
   committed JS.
6. **Wire `npm run qa:<name>`.** Always with `--env-file-if-exists`
   so the script fails inside `requireEnv` with a clear message rather
   than at Node startup.

## Out of scope (deferred follow-ups, per #251)

- **Cache-control header runner** (recipe §C). Needs a Vercel
  deployment-protection bypass token to fetch preview asset headers —
  separate ticket.
- **Telemetry runner** (recipe §E). Already well-covered by vitest on
  the emitter; low marginal value for a runner.
- **Auth-gated routes** (e.g. `/dashboard/standings`). Needs Firebase
  Auth emulator wiring — separate ticket.
- **CI job.** Pilot stays developer-run; CI wiring lands once the
  runners are stable across a few PRs.
