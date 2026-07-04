#!/usr/bin/env bash
# Vercel Ignored Build Step (wired from vercel.json ignoreCommand).
# Exit 0 → skip deploy; exit 1 → build.
#
# Skips previews for dependency/CI-only PRs that do not touch SPA artifacts.

set -euo pipefail

# Dependabot CI-only branches never change the Vite app.
if [[ "${VERCEL_GIT_COMMIT_REF:-}" == dependabot/github_actions/* ]]; then
  exit 0
fi

# Functions-only lockfile bumps (no root package / src change).
if [[ "${VERCEL_GIT_COMMIT_REF:-}" == dependabot/npm_and_yarn/functions/* ]]; then
  exit 0
fi

# Build only when SPA-relevant paths changed vs parent commit.
if git diff HEAD^ HEAD --quiet -- \
  package.json \
  package-lock.json \
  src/ \
  public/ \
  api/ \
  vite.config.js \
  vercel.json \
  index.html
then
  exit 0
fi

exit 1
