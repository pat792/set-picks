# Dependabot operations (agent + human)

**Purpose:** Prevent post-release PR-queue floods. Injected into agent context via `AGENTS.md` and `.cursorrules`.

---

## What happened (2026-07-03 — definitive timeline)

| UTC | Event |
|-----|--------|
| 22:32 | [#476](https://github.com/pat792/set-picks/pull/476) merges — **first-ever** `.github/dependabot.yml` lands on `staging` (**no `target-branch`**) |
| 22:45 | Dependabot **immediate first scan** (not Monday schedule) opens **#479–#485** targeting **`main`** (repo default) |
| 22:57 | `378f41a` adds `target-branch: staging` → **#479–#485 closed**, **#486–#492 opened** (duplicate wave) |
| 22:58–23:00 | Seven Dependabot PRs sit open; each triggers full GitHub CI + Vercel preview |
| 23:30–23:33 | Sprint 6 train PRs **#493–#495** opened manually (separate from Dependabot, same evening) |

**Root cause:** Dependabot was enabled in the v1.18.0 train without (1) correct `target-branch` on day one, (2) SemVer exemption, (3) Vercel ignore for non-SPA PRs, or (4) a first-run agent runbook. The “clean slate after v1.18” lasted **~13 minutes** until the first Dependabot scan.

This is **not** recurring weekly noise — it was a **one-time enablement avalanche** plus same-evening Sprint 6 queueing.

---

## Current policy (reworked 2026-07-28, #744)

| Setting | Value | Why |
|---------|-------|-----|
| Groups | **minor/patch only** (`*-safe` groups) | One breaking major must never block a week of safe updates (July 2026 wave: #518/#519/#624 sat open ~3 weeks) |
| Majors | **Individual PRs**, one dependency each | Each major gets its own migration + QA; see "Major upgrades" below |
| `firebase-admin` majors in `/functions` | **Ignored** | `firebase-functions-test` peer-supports admin ≤13; admin 14 PRs always fail `npm ci` (#624). Remove the ignore when upstream catches up |
| CI `build` job | Runs on any PR touching `package.json` / `package-lock.json` / build config | `verify` doesn't run the production build and qa-runners skip lockfile-only diffs, so Tailwind-4-class breaks were only visible on Vercel (#519) |
| `open-pull-requests-limit` | **5** root/functions, **3** actions (re-enabled 2026-07-05, #504) | Was **0** during ops reset; triage max 1–2 merges/week |
| SemVer gate | Skips `dependabot/*` + `skip-version-bump` label | Deps PRs never bump `package.json` |
| Vercel | `ignoreCommand` → `scripts/vercel-should-build.sh` | No SPA preview for Actions/functions-only bumps |

### Merge policy by PR class

| PR class | Policy |
|----------|--------|
| `*-safe` group (minor/patch) | Mergeable on green checks (`verify` + `build` + Vercel + `functions` when it runs). Human says "merge"; no extra QA needed |
| Actions group | Mergeable on green `verify`; CI-only impact |
| Individual **major** PR | **Never merge on green alone.** Open a dedicated migration issue/PR, apply `ci/qa` (and `ci/full` for toolchain), follow "Major upgrades" below |

### Major upgrades (dedicated migration work)

Green CI is *necessary but not sufficient* for majors — dep-only diffs skip the
Playwright behavioral suite. Treat each as a feature PR:

1. Branch `feat/<issue#>-<dep>-<major>`; apply the bump, run codemods/migration guides.
2. Label `ci/qa` (forces qa-runners) and `ci/full` for build-toolchain deps.
3. Browser-verify on the Vercel preview per `.cursor/skills/pr-qa/SKILL.md`.

Known pending majors (from the closed July 2026 group PRs — tracked in #744):

| Dependency | Risk | Notes |
|------------|------|-------|
| eslint 10, sharp 0.35 | Low | Do first, quick wins |
| vite 8 + @vitejs/plugin-react 6 + vitest 4 | High | Move as one unit (rolldown-based); re-check `qa:chunks` manual-chunk strategy |
| tailwindcss 4 | High | PostCSS plugin moved to `@tailwindcss/postcss`; CSS-first config; visual QA (border/ring defaults changed) |
| react 19 + react-router-dom 7 | High | Dedicated migration, full `ci/qa` |
| firebase 12 | High | QA WebChannel + App Check flows (see pr-qa traps.md) |
| @firebase/rules-unit-testing 5 | Medium | Pair with `npm run test:rules` |
| resend 6 (`/functions`) | Medium | Comms email worker QA + `functions` job |
| firebase-admin 14 (`/functions`) | **Blocked** | Wait for firebase-functions-test peer support; ignore rule in `dependabot.yml` |

### Re-enabling Dependabot (human step)

1. Restore limits in `.github/dependabot.yml` (e.g. `5` root/functions, `3` actions).
2. Merge to `staging`; wait for **one** weekly wave — do **not** open parallel manual dep PRs same day.
3. Triage with table below; max **1–2 merges per week**, never batch-merge `#492`-class toolchain bombs.

---

## Agent obligations

### On the same PR / release that adds or edits `dependabot.yml`

- [ ] `target-branch: staging` on **every** `updates` entry (repo default is `main`).
- [ ] `skip-version-bump` label on every entry.
- [ ] Document first-scan behavior in this file + `CHANGELOG.md`.
- [ ] Set `open-pull-requests-limit: 0` initially; file a follow-up issue to raise limits after first triage.

### When Dependabot PRs appear

| PR type | Agent action |
|---------|----------------|
| `dependabot/github_actions/*` | Triage together; merge only if `verify` green; never bump version |
| `*-safe` npm groups (minor/patch) | Confirm green (`verify` + `build` + Vercel; `functions` job for `/functions` groups); report ready-to-merge |
| Individual **major** PR | Do NOT merge on green; route through "Major upgrades" above |
| Stale/red group PR | If lockfile desync (EUSAGE): regenerate with `npm install` in the affected dir and push to the PR branch (#521 pattern). If ERESOLVE peer conflict: check upstream peer ranges before assuming it's fixable (#624 pattern) |

### Never

- `@dependabot rebase` on **all** open PRs at once (N× CI + Vercel).
- Leave enablement-wave PRs open “until green” without owner triage.
- Open Sprint train feature PRs in the same hour as Dependabot first-scan.

### Ops reset (clear slate)

If the PR queue becomes unmanageable:

```bash
# Close Dependabot backlog (branches preserved)
for pr in $(gh pr list --author app/dependabot --json number -q '.[].number'); do
  gh pr close "$pr" --comment "Ops reset — see docs/DEPENDABOT_OPERATIONS.md"
done
```

Set `open-pull-requests-limit: 0` in `dependabot.yml` until re-enable.

---

## Triage quick reference

| PR class | Merge? | Notes |
|----------|--------|-------|
| Actions only (#486-class) | Optional batch | CI-only; Vercel skip |
| `*-safe` groups (minor/patch) | Yes, when green | `build` job now covers the bundle |
| Individual majors | **No — migration flow** | See "Major upgrades"; `ci/qa` label mandatory |
| Functions prod safe group | Case-by-case | `functions` job must pass |
| Functions dev safe group | Low priority | Test-only dep |

---

## Maintenance

Update this file when `dependabot.yml`, SemVer gate, or Vercel ignore logic changes.
