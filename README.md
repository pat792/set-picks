# Setlist Pick 'Em

Nail the setlist. Win the game.

## Phish.net API key (admin setlist fetch)

**Incident triage (ordered steps):** [docs/PHISHNET_CALLABLE_RUNBOOK.md](docs/PHISHNET_CALLABLE_RUNBOOK.md).

Setlist automation calls **Phish.net v5** only through the Firebase Callable **`getPhishnetSetlist`**. The **show picker** calendar is synced server-side from **`shows/showyear/{year}`** into Firestore (`show_calendar/snapshot`) by **`scheduledPhishnetShowCalendar`** / **`refreshPhishnetShowCalendar`** (see runbook §8). The **picks/admin song catalog** for autocomplete is synced from **`songs.json`** into **Cloud Storage** (`song-catalog.json`) by **`scheduledPhishnetSongCatalog`** (weekly) and **`refreshPhishnetSongCatalog`** (admin callable). Clients resolve a download URL via the **Firebase Storage SDK** (`getDownloadURL`, governed by **Storage rules**), then **`fetch`** the JSON with a **3-day localStorage cache**; they fall back to the bundled static list if needed. Raw `storage.googleapis.com/...` links are **not** used by default (those need GCS IAM public access). See [docs/SONG_CATALOG.md](docs/SONG_CATALOG.md). Deploy **Storage rules** (`firebase deploy --only storage`) when setting this up. The Phish.net key lives in **Secret Manager** (`PHISHNET_API_KEY`), not in the web app.

**Why no `VITE_PHISHNET_API_KEY`:** Vite exposes every `VITE_*` variable from `.env` in the **browser bundle**. That is public to anyone who loads the site or opens DevTools. The codebase **does not** read a client Phish.net key anymore; if `VITE_USE_CALLABLE_PHISHNET_SETLIST` is off while source is `phishnet`, the client shows a configuration error.

### Maintainer checklist (key secrecy)

1. **Keep a private record** in **`.env`** (gitignored): one line `PHISHNET_API_KEY=…` (**no `VITE_` prefix** — Vite would ship it to the browser).
2. **Push that value to Firebase** so the callable can read it: `npm run secrets:sync-phishnet` from **repo root** *or* from **`functions/`** (both define the script; uses the Firebase CLI; does not print the key). Or run `firebase functions:secrets:set PHISHNET_API_KEY` and paste manually.
3. **Never** add `VITE_PHISHNET_API_KEY` — remove it if it exists.
4. **Redeploy** after creating or changing the secret so each function binds the new version: `npm run deploy:functions:phishnet` (deploys setlist + show-calendar + song-catalog functions).
5. **Build flags:** `VITE_SETLIST_API_SOURCE=phishnet` and `VITE_USE_CALLABLE_PHISHNET_SETLIST=true` only.
6. **Local admin:** callable + signed-in admin + App Check debug token in Firebase Console if Functions enforcement blocks localhost.

### Local development (callable)

1. In **`.env`:** `VITE_SETLIST_API_SOURCE=phishnet`, `VITE_USE_CALLABLE_PHISHNET_SETLIST=true`, and **`PHISHNET_API_KEY=…`** (private record; not used by Vite).
2. **`npm run secrets:sync-phishnet`** then **`npm run deploy:functions:phishnet`** (first time and whenever the key changes).
3. **`npm run dev`** (Vite is pinned to **http://localhost:5173/** with `strictPort: true` — free that port or change `vite.config.js`), sign in as **designated admin**, **Fetch setlist from API**.

### Troubleshooting: fetch still fails

1. **Use a past show date** in the date picker. Phish.net often returns **no rows** for **future** shows; the admin error will mention an empty setlist / parser failure. (Phish.net v5 marks success with **`error: false`** in JSON; the app and callable must treat that as OK, not as an error code.)
2. **Verify the key with Phish.net directly** (does not touch Firebase):

   ```bash
   npm run diagnose:phishnet
   ```

   (From **`functions/`**, same command works.) If this fails, fix the key at phish.net, run **`npm run secrets:sync-phishnet`** again, then **`npm run deploy:functions:phishnet`**.
3. **Cloud Function logs:**

   ```bash
   firebase functions:log --only getPhishnetSetlist
   ```

4. **Browser:** sign in as **`pat@road2media.com`**, open DevTools → Console for **`[phishApiClient] getPhishnetSetlist callable failed`** `{ code, message, … }`. Register **App Check** debug token for localhost if Functions enforcement blocks you.

### Staging / production (Firebase Callable)

1. Create or update the Functions secret (from a machine that has **`.env`** with `PHISHNET_API_KEY`, or paste interactively):

   ```bash
   npm run secrets:sync-phishnet
   ```

   ```bash
   firebase functions:secrets:set PHISHNET_API_KEY
   ```

2. Deploy the **`getPhishnetSetlist`** callable: `npm run deploy:functions:phishnet` (see `functions/index.js`).

3. Build the web app with:

   - `VITE_SETLIST_API_SOURCE=phishnet`
   - `VITE_USE_CALLABLE_PHISHNET_SETLIST=true`

The callable runs in **`us-central1`**; the client uses the same region when invoking it. If you change the function region, update **`PHISHNET_CALLABLE_REGION`** in `src/features/admin-setlist-config/api/phishApiClient.js` to match.

The callable requires a **signed-in Firebase user** whose **email matches** the admin gate in `useAdminSetlistForm` (same hard-coded admin email as today).

If the admin UI shows a generic **`internal`** error, redeploy **`getPhishnetSetlist`** (stale deploy is a common cause). The function sets **`enforceAppCheck: false`** so localhost works without an App Check debug token; if you still see failures, check **Firebase Console → App Check → APIs** and ensure Cloud Functions enforcement is not blocking your environment, and open the browser **console** for the full `httpsCallable` error (dev builds log it).

### “Blocked by CORS policy” / preflight on `cloudfunctions.net` (Gen 2 / Cloud Run)

**What it means:** The browser sends an **OPTIONS** preflight before **POST**ing to the callable. If the underlying **Cloud Run** service does not allow unauthenticated invocation at the edge, Google returns an error **without** CORS headers, and Chrome reports a CORS failure (and the Functions SDK often shows **`FirebaseError: internal`**). This is **not** Phish.net CORS—it is **callable / IAM** configuration.

**Fix:** Redeploy after pulling the latest `functions/index.js`, which sets **`invoker: "public"`** on **`getPhishnetSetlist`** so deploy can grant **`roles/run.invoker`** for public access. Your handler still requires Firebase Auth + admin email.

```bash
firebase deploy --only functions:getPhishnetSetlist
```

If deploy still cannot set IAM (e.g. missing `roles/functions.admin` or org policy), add **Cloud Run Invoker** for **`allUsers`** on the **`getphishnetsetlist`** service manually (**Google Cloud Console → Cloud Run → `us-central1` → service → Security / Permissions**), or:

```bash
gcloud run services add-iam-policy-binding getphishnetsetlist \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  --project=set-picks
```

(List exact service names with `gcloud run services list --region=us-central1 --project=set-picks` if the name differs.)
