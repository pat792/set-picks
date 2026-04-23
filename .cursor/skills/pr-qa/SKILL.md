---
name: pr-qa
description: Runs QA on an open pull request for the set-picks repo. Covers lint/test/build verification, FSD boundary checks, Vite chunk-graph inspection, Vercel preview URL discovery, and scripted DevTools recipes the user runs in the browser (Firestore read cache, route splitting, cache-control headers, telemetry). Use when the user says "QA this PR", "verify PR #N", "test this pull request", "run QA steps", or asks the agent to review a PR before merge. Also covers `gh pr review` verb conventions so agents know when approval vs request-changes is appropriate.
---

# PR QA Playbook for `set-picks`

Read this at the start of any PR QA pass. It's the distilled recipe from
perf epic #239 — follow it instead of improvising.

## Non-negotiables

- **Base branch is `staging`**, not `main`.
- **You cannot open URLs, take screenshots, or run JS.** Every browser
  step MUST be walked through the user. Never claim you've "verified"
  something in the browser — you've verified their screenshot of it.
- **Only commit/push/comment/review when the user asks.** QA on an
  already-open PR is read-only by default.
- **Pre-existing warnings are not regressions.** Check against
  `origin/staging` before flagging anything as "broken by this PR."

## Step 1 — Triage (first 2 minutes, always)

```bash
# If user didn't say a number, list recent open PRs.
gh pr list --base staging --state open --json number,title,headRefName,url

# The PR you care about (fill in <N>):
gh pr view <N> --json state,mergeable,baseRefName,headRefName,title,body,statusCheckRollup
gh pr diff <N> | head -200
gh pr checks <N>
```

Check out the branch locally so you can grep, build, and run tests:

```bash
git fetch origin
git checkout <headRefName>
git pull --ff-only
```

Pull the **per-PR preview URL** (NOT the staging preview — see traps.md §6.1):

```bash
gh pr view <N> --json comments -q '.comments[].body' \
  | grep -oE 'https://set-picks-git-[a-z0-9-]+\.vercel\.app' \
  | head -1
```

If multiple URLs appear, prefer the one containing the branch slug (e.g.
`feat-243-react-query-st`). Hand this URL to the user for every browser
step — never the staging URL.

## Step 2 — Agent-side checks (run BEFORE asking the user anything)

Most QA fails catch here without costing the user any time.

### 2.1 Verify matrix (blocking)

```bash
npm run lint
npm test
npm run verify:dashboard-meta
npm run verify:dashboard-ui
```

All four must be clean. `npm test` exit code 134 is a known vitest
worker-teardown flake — re-run once before flagging.

`npm run test:rules` only matters when the PR touches `firestore.rules`
(requires Firebase emulator). Skip otherwise.

### 2.2 Chunk graph via `npm run build`

```bash
npm run build
ls -la dist/assets/*.js | awk '{printf "%10d  %s\n",$5,$NF}' | sort -nr | head -20
```

What to look for:

- **Expected new chunks** based on the PR type. E.g. a React Query PR
  should emit `vendor-react-query-*.js` thanks to #241's `manualChunks`.
- **Main-entry drift.** Compare `index-*.js` gzip size to the number
  documented in the last PR body or `HANDOFF` doc. Unexpected growth
  means something got eagerly imported.
- **Missing expected chunks.** If a PR claims to lazy-load X and you
  don't see a chunk for it, the dynamic import didn't survive tree-
  shaking or was reverted.

### 2.3 Static-import graph for lazy modules

```bash
# Which chunks reference <module>?
grep -l <chunk-name>- dist/assets/*.js

# What does <chunk-X> statically import?
grep -oE 'from"\./[A-Za-z0-9_-]+\.js"' dist/assets/<chunk-X> | sort -u
```

Example expectation (from #242's firebase-storage deferral):

```bash
grep -l firebase-storage- dist/assets/*.js
# → exactly ONE file: useSongCatalog-*.js (the only dynamic-import caller)
```

More consumers = still eager somewhere. Flag it.

### 2.4 FSD boundary skim

Look at the diff for the patterns ESLint can't catch:

- Pages importing `firebase/firestore` or `firebase/auth` directly (must
  go through a feature `api/`).
- `features/<a>/**` importing `features/<b>/model/**` (must use the
  public barrel at `features/<b>/index.js`).
- Any `eslint-disable` comments (this repo has none; new ones are
  suspicious).

If `npm run lint` is clean and the diff has none of the above, you're
fine.

### 2.5 Routing + dashboard meta

When the diff touches `src/app/App.jsx` or `src/app/layout/DashboardLayout.jsx`:

- Confirm the `lazy()` wrappers match the PR's claims.
- If dashboard child routes changed, confirm `src/app/layout/model/dashboardPageMeta.js` AND `scripts/verify-dashboard-meta.mjs` were updated together (`.cursorrules` §6).

## Step 3 — Guided user checks (browser steps)

Match the PR pattern to a recipe in **[recipes.md](recipes.md)**. Each
recipe specifies: exact URL, exact DevTools flags, click sequence, and
**pass vs. fail observables**. Don't improvise.

Common triggers → recipes.md sections:

| PR title pattern | recipes.md § |
|---|---|
| `perf(app): route-level code splitting` | §A chunk-load verification |
| `perf(build): manualChunks / vercel headers` | §A + §C cache-control headers |
| `perf(firebase): defer X` | §A on non-consumer routes |
| `perf(stats): React Query caching` | §B Firestore read cache |
| `feat(...)` new UI or hook | §D feature click-through |
| Anything touching GA4 events | §E telemetry verification |

Every recipe tells the user the exact setup, exact action sequence,
exact pass observable, exact fail observable. Ask for a screenshot
ONLY when that's the specific pass/fail signal — don't ask for "a
screenshot of DevTools" without specifying what you're looking for.

## Step 4 — Report back

Paste this template in chat, filled in:

```
## QA for PR #<N> — <title>

### Agent-side
- [x] verify matrix: <lint/test/dashboard-meta/dashboard-ui results>
- [x] `npm run build`: <one-line chunk delta>
- [x] static-import graph: <what you grepped for, what you found>
- [x] FSD boundary skim: <clean / violated at <file:line>>
- [x] CI status: <gh pr checks output summary>

### User-side (awaiting)
Preview URL: <per-PR URL, never staging>

Please run and report:

1. **<test name>** — per recipes.md §<X>
   - Setup: <DevTools flags>
   - Steps: <1-2-3>
   - PASS = <exact observable>
   - FAIL = <exact observable>

### Open risks
- <anything the agent-side checks couldn't cover>
```

## Step 5 — `gh pr review` verb conventions

Agents NEVER autonomously approve or request changes on a PR. Even
when CI is green and browser checks reported pass, the HUMAN signs off.

| Verb | When | Who triggers |
|---|---|---|
| `gh pr review <N> --comment --body "<msg>"` | Posting non-blocking feedback, questions, or the QA report itself | Agent may do this when the user says "post the QA report to the PR" |
| `gh pr review <N> --approve --body "<msg>"` | The user has verified browser checks and explicitly says "approve it" | Only on explicit user command |
| `gh pr review <N> --request-changes --body "<msg>"` | A browser check FAILED or agent-side check caught a real regression, AND the user says "request changes" | Only on explicit user command |
| `gh pr merge <N> --squash` | Only when the user explicitly says "merge it" | Only on explicit user command |

All four are GraphQL writes and need `required_permissions: ["all"]` on
the Shell call in the default sandbox. Pass the body via HEREDOC so
multi-line markdown survives:

```bash
gh pr review <N> --comment --body "$(cat <<'EOF'
<your markdown here>
EOF
)"
```

### Never do without explicit instruction

- Approve a PR because CI looks green.
- Request changes because *you* noticed a nit during QA — include it in
  the report and let the user decide whether to block the PR.
- Merge a PR even after approval, without a separate "merge it" signal.
- Force-push, `--amend`, or rewrite history on the PR branch.
- `gh pr close` — never.

## Step 6 — When to hand QA back unfinished

Don't force a green bill of health when:

- **Behavior requires a real account / real data** (leaderboards with
  ≥N players, paid-tier flows).
- **Behavior requires a production build signal** that doesn't
  reproduce in `npm run dev` (GA4 DebugView, App Check Enforcement,
  Firebase Hosting CDN TTLs on external iframes).
- **CI hasn't finished.** Don't close out on a yellow matrix; report
  which checks are still running and stop.
- **You're extrapolating from a cropped / low-res screenshot.** Ask for
  a specific zoom, don't guess.

The agent's job is either to land a merge-ready bill of health OR
report precisely what's off. Hedged answers create more work than
"I don't know — please do X to confirm."

## Reference material

- **[recipes.md](recipes.md)** — detailed DevTools scripts for every
  common PR type (chunk loading, Firestore reads, cache headers,
  telemetry, feature click-through).
- **[traps.md](traps.md)** — ten specific failure modes captured from
  perf epic #239, each with a concrete remediation. Read this before
  interpreting ambiguous Network-tab screenshots.

Together with `.cursorrules` and `docs/GITHUB_AUTOMATION_CONTEXT.md`,
these three files are the complete reference surface for PR QA work on
this repo.
