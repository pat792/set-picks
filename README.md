# Setlist Pick 'Em

Nail the setlist. Win the game.

## Phish.net API key (admin setlist fetch)

Setlist automation calls **Phish.net v5** only through the Firebase Callable **`getPhishnetSetlist`**. The Phish.net key lives in **Secret Manager** (`PHISHNET_API_KEY`), not in the web app.

**Why no `VITE_PHISHNET_API_KEY`:** Vite exposes every `VITE_*` variable from `.env` in the **browser bundle**. That is public to anyone who loads the site or opens DevTools. The codebase **does not** read a client Phish.net key anymore; if `VITE_USE_CALLABLE_PHISHNET_SETLIST` is off while source is `phishnet`, the client shows a configuration error.

### Maintainer checklist (key secrecy)

1. **Store the key once** as a Functions secret: `firebase functions:secrets:set PHISHNET_API_KEY` (paste value when prompted).
2. **Never** add `VITE_PHISHNET_API_KEY` to `.env`, `.env.local`, or hosting env — remove it if it exists (rotate the key at phish.net if it was ever committed or pasted).
3. **Redeploy** after changing the secret: `firebase deploy --only functions:getPhishnetSetlist`.
4. **Build flags:** `VITE_SETLIST_API_SOURCE=phishnet` and `VITE_USE_CALLABLE_PHISHNET_SETLIST=true` only; no Phish.net key in Vite.
5. **Local admin:** same as prod — callable + signed-in admin + App Check debug token registered in Firebase Console if enforcement blocks localhost.

### Local development (callable)

1. Deploy **`getPhishnetSetlist`** and set **`PHISHNET_API_KEY`** (secret).
2. In `.env`: `VITE_SETLIST_API_SOURCE=phishnet` and `VITE_USE_CALLABLE_PHISHNET_SETLIST=true` (no Phish.net key in `.env`).
3. `npm run dev`, sign in as **designated admin**, **Fetch setlist from API**.

### Staging / production (Firebase Callable)

1. Create the Functions secret (one-time per project):

   ```bash
   firebase functions:secrets:set PHISHNET_API_KEY
   ```

2. Deploy the **`getPhishnetSetlist`** callable (see `functions/index.js`).

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
