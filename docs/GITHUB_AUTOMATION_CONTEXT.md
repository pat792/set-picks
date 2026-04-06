# GitHub / Gemini automation context (Set Picks)

**Purpose:** Single source of truth injected into **`.github/workflows/gemini-pm.yml`** and **`scripts/groom-backlog.js`** so generated PRDs match this repo’s layout. Keep this file concise; full Cursor agent rules live in **`.cursorrules`**.

---

## When NOT to rewrite an issue

- **GitHub Actions:** Workflows run from the **default branch**’s `.github/workflows/` copy. If `[SKIP-PRD]` handling was added on another branch, merge to **default** before expecting skips to work on newly opened issues.
- **Body:** If the issue body (after leading whitespace) starts with **`[SKIP-PRD]`**, automation must **not** replace the body (Cursor agent–authored specs). The Action refetches the issue via the REST API and treats the **first non-empty line** as `[SKIP-PRD]` (after stripping a UTF-8 BOM if present).
- **Labels:** Do not run auto-PRD / do not groom if the issue has any of:
  - **`skip-prd`** — no GitHub Action PRD rewrite on open (use with `[SKIP-PRD]` for belt-and-suspenders).
  - **`cursor-authored`** — treat as human/agent final copy; skip Action and groom rewrites.
  - **`skip-groom`** — skip **backlog groom** only (script `groom-backlog.js`).
  - **`AI-PRD`** — already groomed; groom script skips by convention.

---

## Stack

- **Frontend:** React (Vite), Tailwind, React Router.
- **Backend / data:** Firebase Auth, Firestore, App Check; **Firebase Cloud Functions** live under repo root **`functions/`** (e.g. `functions/index.js`), not `firebase/functions/`.
- **Rules:** `firestore.rules` (referenced from `firebase.json`).

Do **not** propose new non-Firebase backends. Avoid unnecessary npm packages.

---

## Reduced FSD layout (strict)

| Layer | Path | Responsibility |
|--------|------|----------------|
| **Pages** | `src/pages/` | Routes, URL params, compose feature UI and feature hooks only. **No** direct Firestore/Firebase calls. |
| **Features** | `src/features/<domain>/` | Business capability: **`api/`** IO, **`model/`** hooks/orchestration, **`ui/`** presentational (no direct DB). |
| **Shared** | `src/shared/` | Domain-agnostic UI kit, utils, hooks, constants. **Imports only from `shared`.** |
| **App shell** | `src/app/` | Layout, dashboard routing composition (e.g. `DashboardLayout.jsx`, `dashboardPageMeta.js`). |

**Public API per feature:** `src/features/<domain>/index.js` — pages and other features import from here, not deep paths like `features/foo/model/bar.js`.

**Anti-patterns for “Proposed file changes”:**

- Do **not** place new feature UI in a generic **`src/components/`** tree for product features; use **`src/features/<domain>/ui/`**.
- Do **not** invent **`PoolAdmin.jsx` at repo root** or **`src/components/Pool*`** for new work unless migrating legacy explicitly called out in the issue.

---

## Import boundaries (summary)

- `pages` → `features`, `shared` only.
- `features` → same feature internals, `shared` only; cross-feature → other feature’s **root `index.js`** or move logic to `shared`.
- `shared` → `shared` only.
- Never import `pages` from features or shared.

---

## Dashboard routes

- Adding or renaming **`/dashboard/*`**: update **`src/app/layout/model/dashboardPageMeta.js`**, nav / **`isActive`** in **`src/app/layout/DashboardLayout.jsx`**, extend **`scripts/verify-dashboard-meta.mjs`**, run **`npm run verify:dashboard-meta`**.
- Vocabulary and IA: **`docs/DASHBOARD_IA.md`**.

---

## PRD “Proposed file changes” guidance

Prefer paths such as:

- `src/pages/<area>/<Page>.jsx`
- `src/features/<domain>/api/*.js`
- `src/features/<domain>/model/*.js`
- `src/features/<domain>/ui/*.jsx`
- `src/shared/ui/...`, `src/shared/lib/...`
- `functions/index.js`, `firestore.rules`, `firebase.json`

Name **existing** domains when known (e.g. `pools`, `picks`, `scoring`, `auth`, `profile`, `admin`); do not guess filenames that contradict FSD.

---

## Maintenance

When architecture or automation behavior changes, update **this file** and keep **`.cursorrules`** and **`docs/DASHBOARD_IA.md`** aligned.
