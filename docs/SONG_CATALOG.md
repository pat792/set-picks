# Song catalog (picks autocomplete) — issue #158

> **Scoring decoupled (#214):** As of #214, **scoring does not consult this catalog.** Bustout boosts come from the per-show `official_setlists/{showDate}.bustouts` snapshot (frozen at save time from Phish.net row `gap`). The Storage catalog and the bundled fallbacks (`src/shared/data/phishSongs.js`, `functions/phishSongs.js`) are retained solely for **UI concerns** — autocomplete, scoring-rules copy, and future upcoming-show bustout hints. The **~6 hour** refresh cadence (schedule + client TTL) is adequate for those uses; scoring accuracy no longer depends on it. See `docs/OFFICIAL_SETLISTS_SCHEMA.md` → “Bustout source — per-show snapshot (#214).”

## Data path

1. **Source of truth (live):** Phish.net API v5 `GET /v5/songs.json` (server-side only, `PHISHNET_API_KEY`).
2. **Publish:** Cloud Functions write **`song-catalog.json`** to the **default Firebase Storage bucket** (`makePublic()` is best-effort; not required for the default client path).
3. **Archive (#647):** the same sync also writes a **private** dated copy under **`song-catalog/archive/YYYY-MM-DDTHH-mm-ssZ.json`** (colon-safe UTC stamp). Same JSON payload as live (`songs`, `songCount`, `source`, `updatedAt`). Used for leakage-safe recommendation backtests (#646 / #648); **not** fetched by the web client. Archive failure is logged and does not fail the live upload.
4. **Client URL:** By default the app uses **`getDownloadURL()`** (Firebase Storage SDK) for `song-catalog.json`. That respects **`storage.rules`** (`allow read: if true`) and avoids opening the whole bucket on **GCS IAM**. A raw browser URL like `https://storage.googleapis.com/<bucket>/song-catalog.json` **does not** use Firebase rules and returns **`AccessDenied`** for anonymous users unless you add **`allUsers` → Storage Object Viewer** on the bucket (usually avoid on buckets that hold private uploads). Override with **`VITE_SONG_CATALOG_URL`** only if you host the JSON elsewhere (CDN) with anonymous GET + CORS.
5. **Fetch + cache:** `useSongCatalog` **`fetch()`**s the resolved URL. **localStorage** (`set-picks.songCatalogCache.v2`): if data was saved **within the last 6 hours**, the hook **skips** both `getDownloadURL` and `fetch`. On failure, an **older cache** is used if present; otherwise **`src/shared/data/phishSongs.js`**.
6. **Scoring does not read this catalog (post-#214).** `recomputeLiveScoresForShow` and `calculateSlotScore` in `functions/index.js` — and their client counterparts in `src/shared/utils/scoring.js` — read bustout membership from `actualSetlist.bustouts`. `functions/songCatalogSource.js` (5-minute TTL loader) is still present in-tree but is no longer threaded into grading; it can be removed in a follow-up once no code path imports it. The bundled catalogs (`src/shared/data/phishSongs.js`, `functions/phishSongs.js`) remain only as Storage-fallback seeds for `useSongCatalog` / the storage loader.

## Operations

- **Scheduled refresh:** `scheduledPhishnetSongCatalog` — cron **`0 */6 * * *`** America/New_York (every 6 hours at 00/06/12/18 ET). Uploads live JSON + archive snapshot; logs **`publicUrl`** and archive object path.
- **On-demand (designated admin only):** callable **`refreshPhishnetSongCatalog`** returns `{ songCount, publicUrl, archivePath }` (`archivePath` is `null` if the archive write failed), or **Admin → Song catalog** accordion → **Refresh song catalog from Phish.net**.
- **Deploy:** `npm run deploy:functions:phishnet` includes song-catalog functions.
- **Storage rules:** `storage.rules` — public **read** on `song-catalog.json` only. Archive objects under `song-catalog/archive/` are **not** publicly readable (Admin SDK / bucket IAM only). The web app uses **`getDownloadURL` + `fetch`** for the live object by default (rules apply; no bucket-wide IAM required).
- **Firestore:** Legacy `song_catalog/snapshot` is **no longer** written; rules for that path were removed.
- **Archive retention (#647):** v1 keeps all dated snapshots (no automatic TTL). Revisit lifecycle (e.g. keep N days / tour window) once #648 backtests define how many historical catalogs are needed. Disk cost is small (~one JSON per sync ≈ 4×/day).

### First-time / CORS

1. Deploy Storage rules: `firebase deploy --only storage`.
2. Run **`refreshPhishnetSongCatalog`** once so the object exists.
3. **CORS:** If you use **`VITE_SONG_CATALOG_URL`** pointing at plain **GCS** (`storage.googleapis.com`), configure bucket CORS. The default **`getDownloadURL`** flow usually does **not** require `gsutil cors` on the bucket. If you still see CORS errors on the tokenized `firebasestorage.googleapis.com` URL, add CORS from the **repo root**:

```bash
# From repo root (path to JSON is required)
gsutil cors set scripts/song-catalog-storage-cors.json gs://set-picks.firebasestorage.app
```

Or with **gcloud** (same file):

```bash
gcloud storage buckets update gs://set-picks.firebasestorage.app --cors-file=scripts/song-catalog-storage-cors.json
```

Edit **`scripts/song-catalog-storage-cors.json`** if your web origin is not already listed. **Custom domains** (e.g. `https://www.setlistpickem.com`) and **Vercel preview URLs** (`https://…vercel.app`) must be included explicitly — GCS CORS does **not** support `https://*.vercel.app`. Each new preview hostname needs the same `gsutil`/`gcloud` step, or use a **stable** staging URL (custom domain on Vercel) and add only that origin.

4. **Optional (raw GCS URL only):** If you insist on anonymous `https://storage.googleapis.com/.../song-catalog.json`, grant **`allUsers` → Storage Object Viewer** (or fix **`makePublic()`** / object ACL). Prefer the default **`getDownloadURL`** path instead.

## Payload shape (`song-catalog.json`)

```json
{
  "songs": [{ "name": "…", "total": "…", "gap": "…", "last": "…", "debut": "…" }],
  "songCount": 975,
  "source": "phish.net/v5/songs",
  "updatedAt": "2026-04-09T12:00:00.000Z"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Song title (Phish.net `song`) |
| `total` | string | Times played (`times_played`), or `—` |
| `gap` | string | Shows since last play (`gap`), or `—` |
| `last` | string | Last played date (`last_played`), or `—` |
| `debut` | string | First performance date/year (`debut`), typically `YYYY-MM-DD`; **empty string** when unknown (v1.25.0+, #554). Do **not** treat `gap` / `last` as vintage. |

Bundled fallbacks (`src/shared/data/phishSongs.js`, `functions/phishSongs.js`) may omit `debut` — treat missing as unknown when computing avg song vintage.

### Archive object naming

| Live | Archive example |
|------|-----------------|
| `song-catalog.json` | `song-catalog/archive/2026-07-21T18-00-00Z.json` |

Stamp is UTC from `updatedAt`, with `:` → `-` so object names stay path-safe. Payload is identical to the live catalog written in the same sync.
