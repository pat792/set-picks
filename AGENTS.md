# Agents

## Cursor Cloud specific instructions

### Environment

- **Node.js 24** is required (Cloud Functions `engines.node: "24"`). The VM uses `nvm` with Node 24 set as default.
- **Package manager:** npm (lockfile: `package-lock.json`). Two install targets: root (`/workspace`) and `functions/`.
- **`.env`** is gitignored. Copy `.env.example` to `.env` for local dev; most values can stay empty/default.

### Running the application

- **Dev server:** `npm run dev` — Vite on `http://localhost:5173` (`strictPort: true`; free that port or it will fail).
- The app connects to the **remote Firebase project** (Firestore, Auth, Storage). There is no local emulator-first workflow for the SPA.
- App Check is auto-disabled in dev mode (`FIREBASE_APPCHECK_DEBUG_TOKEN = true` when `import.meta.env.DEV`).

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

### PR workflow notes

- **Base branch is `staging`**, not `main` (per `.cursorrules` §10).
- Branch naming: `feat/<issue#>-<kebab-slug>`.
- Firestore rules tests (`npm run test:rules`) require the Firebase emulator and are not part of the regular CI matrix for the web app.

### Gotchas

- The Vite build emits Rollup circular-dependency warnings for barrel re-exports. These are known and non-blocking.
- `sharp` (devDependency) may fail to install on some architectures; it is only used by `scripts/generate-og-card.mjs` and is not required for dev/test/build.
- Firebase Cloud Functions require Node 24 — if you see `engines` mismatch errors in `functions/`, ensure `nvm use 24`.
