/**
 * Playwright bootstrap for QA runners hitting Firebase (Firestore) on
 * `vite preview` production builds.
 *
 * `firebaseAppCheck.js` only sets `FIREBASE_APPCHECK_DEBUG_TOKEN` when
 * `import.meta.env.DEV` — that branch is stripped from prod bundles, so
 * headless Chromium must set the global before the app bundle runs.
 *
 * **Important:** `FIREBASE_APPCHECK_DEBUG_TOKEN = true` generates a **new**
 * UUID on every fresh browser profile; the App Check exchange returns **403**
 * until that UUID is registered in Firebase Console. For deterministic
 * automation, set **`QA_APPCHECK_DEBUG_TOKEN`** (see `.env.qa.example`) to a
 * single UUID string you registered under App Check → Manage debug tokens.
 *
 * @param {import('playwright').BrowserContext} context
 */
export async function enableFirebaseAppCheckDebug(context) {
  const token =
    process.env.QA_APPCHECK_DEBUG_TOKEN?.trim() ||
    process.env.FIREBASE_APPCHECK_DEBUG_TOKEN?.trim();
  if (token) {
    await context.addInitScript((t) => {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = t;
    }, token);
    return;
  }
  await context.addInitScript(() => {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  });
}
