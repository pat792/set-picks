# Setlist Pick 'Em

Nail the setlist. Win the game.

## Phish.net API key (admin setlist fetch)

Setlist automation can call **Phish.net v5** (`setlists/showdate/…`) via the **Firebase Callable** (recommended everywhere the app runs in a browser). Direct browser `fetch` to `api.phish.net` is **blocked by CORS**, so local dev should use the callable too—not `VITE_PHISHNET_API_KEY` in the SPA.

### Local development (same as production: callable)

1. Deploy **`getPhishnetSetlist`** and set the **`PHISHNET_API_KEY`** secret (see below).
2. In `.env`: `VITE_SETLIST_API_SOURCE=phishnet` and `VITE_USE_CALLABLE_PHISHNET_SETLIST=true`.
3. Run `npm run dev`, sign in as the **designated admin** user, then use **Fetch setlist from API**.

Optional: `VITE_PHISHNET_API_KEY` only if you disable the callable (e.g. non-browser scripts); it is **not** reliable for the admin UI in the browser.

### Staging / production (Firebase Callable)

1. Create the Functions secret (one-time per project):

   ```bash
   firebase functions:secrets:set PHISHNET_API_KEY
   ```

2. Deploy the **`getPhishnetSetlist`** callable (see `functions/index.js`).

3. Build the web app with:

   - `VITE_SETLIST_API_SOURCE=phishnet`
   - `VITE_USE_CALLABLE_PHISHNET_SETLIST=true`
   - **Do not** set `VITE_PHISHNET_API_KEY` in production builds.

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
