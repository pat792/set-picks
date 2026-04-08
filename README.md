# Setlist Pick 'Em

Nail the setlist. Win the game.

## Phish.net API key (admin setlist fetch)

Setlist automation can call **Phish.net v5** (`setlists/showdate/…`) in two ways:

### Local development (direct `fetch`)

1. Set `VITE_SETLIST_API_SOURCE=phishnet` in `.env`.
2. Set `VITE_PHISHNET_API_KEY` to a **developer** key from [phish.net/api](https://phish.net/api/).
3. Leave `VITE_USE_CALLABLE_PHISHNET_SETLIST` unset or `false`.

> `VITE_*` values are embedded in the browser bundle. Use only a non-production or low-risk key here.

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
