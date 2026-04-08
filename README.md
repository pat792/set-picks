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
