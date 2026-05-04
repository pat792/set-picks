# Comms copy workspace (tour / show / other messaging)

**Purpose:** Give editors and agents a **repo-native** place to draft and revise copy **without** hunting through React files. Runtime text still lives in `src/features/**/model/` until (or unless) you add a loader; this folder is the **editorial surface** and **contract** for what exists.

**Authoritative for production:** The owning **`implementationModule`** path listed in each recap Markdown front matter / metadata table (and in **`src/features/comms/registry.js`**). Keep **`content/comms/**`** and that module **in sync** when copy ships.

**Push / in-app / email epic:** Channel behavior and orchestration are tracked in GitHub **#272**. This folder does **not** send messages; it documents copy. Orchestration should read **`src/features/comms/registry.js`** for template IDs and supported channels (`inApp`, `emailAbbreviated`, `emailFull`, `push`).

---

## Edit and ship an **existing** template

Use when changing wording for a recap that already has code + registry entry (e.g. Sphere ’26).

| Step | Who | Action |
|------|-----|--------|
| 1 | Editor / PM | Update the Markdown under **`content/comms/...`** (tour file, show file, or section). Use placeholders like `{{rank}}` for dynamic bits. |
| 2 | Dev or agent | Copy the final strings into the **`implementationModule`** (e.g. `src/features/tour-recap/model/sphere2026Recap.js`) so runtime matches the doc. Update in-app or email builder functions as needed. |
| 3 | Dev or agent | Run **`npm run lint`** and **`npm test`** (at least tests for the owning feature). |
| 4 | Dev | Open a PR with **base branch `staging`** (per `.cursorrules`), normal review, merge. |
| 5 | Optional | Use **War Room → Tour recap copy** (or the relevant admin preview) to eyeball the result before/after merge. |

**One-PR rule:** Prefer the Markdown edit and the JS sync in the **same** PR so `content/comms` and `src/features/.../model` never diverge for long.

---

## Add a **new** template (tour recap, show recap, or other message set)

| Step | Action |
|------|--------|
| 1 | **Content:** Add a file under **`content/comms/tours/`** or **`content/comms/shows/`** (or copy from **`show-recap.template.md`**). Include metadata table: template ID, `implementationModule` path, channels you plan to ship. Document shared copy, per-player branches, email teaser, push notes as needed. |
| 2 | **Code:** Add a **`model/`** module under an appropriate feature (e.g. `src/features/tour-recap/model/yourRecap.js`) with builders for each channel you need; add **`*.test.js`** for branching logic and stable strings you care about. |
| 3 | **Registry:** Add an entry to **`src/features/comms/registry.js`** (`RECAP_TEMPLATE_REGISTRY`): `kind`, `displayName`, `sourceDraftPath`, `implementationModule`, **`supportedChannels`**. Export any new template ID constant from the feature barrel and import it in the registry (same pattern as `SPHERE_2026_RECAP_ID`). |
| 4 | **UI (optional):** Add or extend a presentational component under **`src/features/<domain>/ui/`** and wire **admin preview** if you need an in-app QA surface (see Sphere `AdminTourRecapPreview`). |
| 5 | **Public API:** Re-export new builders/components from **`src/features/<domain>/index.js`** and, if useful, from **`src/features/comms/index.js`**. |
| 6 | **Ship:** PR to **`staging`**, lint + tests green. |

---

## Layout

| Path | Use |
|------|-----|
| `tours/` | Tour wrap-ups (multi-show). One file per edition; include **shared** and **per-player** copy (e.g. “Your Final … Result” branches). |
| `shows/` | Single-show recaps (add files as you add products). |
| `show-recap.template.md` | Scaffold for new show recaps. |
| `README.md` | This file — workflow and links. |

## Do / Don’t

- **Do** keep one recap edition per file; use clear filenames (`sphere-2026-inaugural.md`).
- **Do** register new templates in `src/features/comms/registry.js` when builders exist.
- **Don’t** put secrets, PII, or per-user numbers in these drafts (use placeholders like `{{rank}}`).
- **Don’t** move product rules into `src/shared/` — copy stays feature-owned or here as draft.

## Agents

When asked to implement or refresh recap copy:

1. Read the draft under `content/comms/...` if present.
2. Apply changes to the listed `implementationModule` (and UI only where layout/icons require it).
3. Update **`registry.js`** when adding a new template or changing channel support.
4. Update tests under the owning feature (`*.test.js`).
