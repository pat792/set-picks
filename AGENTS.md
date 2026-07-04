# Agents

## Cursor Cloud specific instructions

### Environment

- **Node.js 24** is needed for Cloud Functions (`engines.node: "24"`). `nvm install 24` provides it. Caveat: a daemon-managed `node` at `/exec-daemon/node` (Node 22) sits ahead of `nvm` on `PATH`, so a bare `node` is v22. For Functions work prepend the nvm bin first: `export PATH="$HOME/.nvm/versions/node/v24.17.0/bin:$PATH"`. Root web app (Vite 4 / Vitest) runs fine on Node 22 too; only deploy/Functions strictly want 24.
- **Package manager:** npm (lockfile: `package-lock.json`). Two install targets: root (`/workspace`) and `functions/` — both have their own lockfile.
- **`.env`** is gitignored. Copy `.env.example` to `.env` for local dev. The `VITE_FIREBASE_*` config plus `QA_TEST_EMAIL` / `QA_TEST_PASSWORD` are injected as Cloud Agent secrets (env vars) and Vite picks them up automatically — you do not need to add them to `.env`.

### Running the application

- **Dev server:** `npm run dev` — Vite on `http://localhost:5173` (`strictPort: true`; free that port or it will fail).
- The app connects to the **remote Firebase project** (Firestore, Auth, Storage). There is no local emulator-first workflow for the SPA.
- **App Check is NOT actually disabled in dev.** `src/shared/lib/firebaseAppCheck.js` sets `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true`, which makes Firebase mint a fresh, *unregistered* debug token → the App Check exchange returns **403** and Firestore/Auth-backed flows (sign-in, sign-up, picks, pools) fail. To make signed-in flows work on localhost, seed the **pre-registered** debug token (`38422efd-029f-45b4-b028-7cf7fcaeeffc`, from `docs/TESTING.md`) into IndexedDB once, then reload: load the page, then in DevTools console run
  `indexedDB.open('firebase-app-check-database',1).onsuccess=e=>{const tx=e.target.result.transaction('firebase-app-check-store','readwrite');tx.objectStore('firebase-app-check-store').put({compositeKey:'debug-token',value:'38422efd-029f-45b4-b028-7cf7fcaeeffc'});}`
  and reload. The token persists in that browser profile. (The `true` branch reuses an IndexedDB-stored token if one exists, so seeding wins.)
- **Test account:** sign in with `QA_TEST_EMAIL` / `QA_TEST_PASSWORD` (injected secrets) instead of creating throwaway accounts you cannot delete (the cleanup protocol in `docs/TESTING.md` needs Firebase Console access).
- **Firebase Storage `song-catalog.json` returns 402 (Payment Required)** on the current project (billing state). This is non-blocking: the song-search autocomplete falls back to the bundled static catalog, and Firestore (the actual game data) is unaffected. Ignore 402s from `firebasestorage.googleapis.com`; only worry about non-200s from `firestore.googleapis.com`.

### Lint / Test / Build (CI matrix)

Standard commands are in `package.json` scripts.

CI is now risk-weighted:
- Baseline checks run on all PRs/pushes (`verify` + Vercel).
- `functions`, `rules`, and `qa-runners` are conditional based on changed paths/risk.
- Nightly scheduled CI runs the full matrix as a backstop.

Core local commands:

| Check | Command |
|-------|---------|
| Lint | `npm run lint` |
| Unit tests (frontend) | `npm test` |
| Verify dashboard meta | `npm run verify:dashboard-meta` |
| Verify dashboard UI tokens | `npm run verify:dashboard-ui` |
| Functions unit tests | `cd functions && npm test` |
| Firestore rules tests | `npm run test:rules` |
| QA runners | `npm run qa:chunks && npm run qa:cache` |
| Build | `npm run build` |

### Dependabot / npm audit (#414)

- **Runbook:** **`docs/DEPENDABOT_OPERATIONS.md`** — first-enable timeline, ops-reset procedure, re-enable steps. Read before touching `dependabot.yml` or triaging dep PRs.
- **Dependabot** (`.github/dependabot.yml`) — **paused** (`open-pull-requests-limit: 0`) after 2026-07-04 enablement-wave reset. When active: weekly grouped npm PRs + monthly Actions; base `staging`; auto `skip-version-bump`; CI exempts `dependabot/*`. Agents must **not** bump `package.json` on Dependabot PRs.
- **Vercel:** `ignoreCommand` → `scripts/vercel-should-build.sh` skips previews for Actions/functions-only dep PRs.
- **CI `npm audit`** on the `verify` job is **informational** (`continue-on-error: true`). It does not block merge.
- **Triage:** Critical/high in **production** deps → fix or upgrade in a normal PR. Dev-only / low noise → defer or group into a maintenance PR. Do not mass-upgrade without running `npm test` and `cd functions && npm test`.

### Firestore indexes (#413)

- Composite indexes live in `firestore.indexes.json` (wired from `firebase.json`). Refresh from prod:
  `firebase firestore:indexes --project set-picks > firestore.indexes.json`
- Empty `indexes: []` is valid when production has no composites (single-field indexes are automatic). Add composites here when a new query requires them (Console link or CLI), then deploy with `firebase deploy --only firestore:indexes`.

### PR workflow notes

- **Base branch is `staging`**, not `main` (per `.cursorrules` §10).
- Branch naming: `feat/<issue#>-<kebab-slug>`.
- Firestore rules tests (`npm run test:rules`) require the Firebase emulator and are not part of the regular CI matrix for the web app.

### Gotchas

- The Vite build emits Rollup circular-dependency warnings for barrel re-exports. These are known and non-blocking.
- `sharp` (devDependency) may fail to install on some architectures; it is only used by `scripts/generate-og-card.mjs` and is not required for dev/test/build.
- Firebase Cloud Functions require Node 24 — if you see `engines` mismatch errors in `functions/`, ensure `nvm use 24`.
