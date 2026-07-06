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

## Current policy (post ops-reset 2026-07-04)

| Setting | Value | Why |
|---------|-------|-----|
| `open-pull-requests-limit` | **5** root/functions, **3** actions (re-enabled 2026-07-05, #504) | Was **0** during ops reset; triage max 1–2 merges/week |
| SemVer gate | Skips `dependabot/*` + `skip-version-bump` label | Deps PRs never bump `package.json` |
| Vercel | `ignoreCommand` → `scripts/vercel-should-build.sh` | No SPA preview for Actions/functions-only bumps |

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
| Root production group | Run `npm test`; merge if patch/minor only |
| Root **development** group | **Defer** if vite/eslint/tailwind major jumps bundled |
| `functions/*` production | Run `cd functions && npm test`; merge individually |
| `functions/*` development | Low priority; merge when functions CI green |

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
| Root prod patch bumps | Yes, one PR/week | `npm test` |
| Root dev (vite 8, tailwind 4) | **No** | Dedicated upgrade issue |
| Functions prod | Case-by-case | `functions` job must pass |
| Functions dev | Low priority | Test-only dep |

---

## Maintenance

Update this file when `dependabot.yml`, SemVer gate, or Vercel ignore logic changes.
