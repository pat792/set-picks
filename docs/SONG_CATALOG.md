# Song catalog (picks autocomplete) — issue #158

## Data path

1. **Source of truth (live):** Phish.net API v5 `GET /v5/songs.json` (server-side only, `PHISHNET_API_KEY`).
2. **Publish:** Cloud Functions write **`song-catalog.json`** to the **default Firebase Storage bucket** (`makePublic()` is best-effort; not required for the default client path).
3. **Client URL:** By default the app uses **`getDownloadURL()`** (Firebase Storage SDK) for `song-catalog.json`. That respects **`storage.rules`** (`allow read: if true`) and avoids opening the whole bucket on **GCS IAM**. A raw browser URL like `https://storage.googleapis.com/<bucket>/song-catalog.json` **does not** use Firebase rules and returns **`AccessDenied`** for anonymous users unless you add **`allUsers` → Storage Object Viewer** on the bucket (usually avoid on buckets that hold private uploads). Override with **`VITE_SONG_CATALOG_URL`** only if you host the JSON elsewhere (CDN) with anonymous GET + CORS.
4. **Fetch + cache:** `useSongCatalog` **`fetch()`**s the resolved URL. **localStorage** (`set-picks.songCatalogCache.v1`): if data was saved **within the last 3 days**, the hook **skips** both `getDownloadURL` and `fetch`. On failure, an **older cache** is used if present; otherwise **`src/shared/data/phishSongs.js`**.
5. **Cloud Function grading / bustout** still uses **`functions/phishSongs.js`** until separately aligned.

## Operations

- **Weekly refresh:** `scheduledPhishnetSongCatalog` (Sunday 7:00 America/New_York) — uploads JSON and logs **`publicUrl`**.
- **On-demand (designated admin only):** callable **`refreshPhishnetSongCatalog`** returns `{ songCount, publicUrl }`, or **Admin → Song catalog** accordion → **Refresh song catalog from Phish.net**.
- **Deploy:** `npm run deploy:functions:phishnet` includes song-catalog functions.
- **Storage rules:** `storage.rules` — public **read** on `song-catalog.json` only. The web app uses **`getDownloadURL` + `fetch`** for that object by default (rules apply; no bucket-wide IAM required).
- **Firestore:** Legacy `song_catalog/snapshot` is **no longer** written; rules for that path were removed.

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

Edit **`scripts/song-catalog-storage-cors.json`** if your production domain is not `set-picks.web.app` / `set-picks.firebaseapp.com`.

4. **Optional (raw GCS URL only):** If you insist on anonymous `https://storage.googleapis.com/.../song-catalog.json`, grant **`allUsers` → Storage Object Viewer** (or fix **`makePublic()`** / object ACL). Prefer the default **`getDownloadURL`** path instead.

## Payload shape (`song-catalog.json`)

```json
{
  "songs": [{ "name": "…", "total": "…", "gap": "…", "last": "…" }],
  "songCount": 975,
  "source": "phish.net/v5/songs",
  "updatedAt": "2026-04-09T12:00:00.000Z"
}
```
