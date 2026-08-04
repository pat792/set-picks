/**
 * Email/password sign-in via the `/login` auth entry (#349 / #830).
 * Firestore rules require `signedIn()` for profile reads; headless `qa:cache`
 * must establish a session before visiting `/user/:uid`.
 *
 * @param {import('playwright').Page} page
 * @param {string} origin Preview origin, e.g. `http://localhost:14216`
 * @param {string} email
 * @param {string} password
 */
export async function signInViaSplashEmailPassword(page, origin, email, password) {
  const base = origin.replace(/\/$/, '');
  // Avoid `networkidle` — after Auth, Firestore keeps a long-lived WebChannel
  // open so idle never settles (AGENTS.md / pr-qa traps).
  await page.goto(`${base}/login`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });

  const dialog = page.getByRole('dialog', { name: /^sign in$/i });

  await dialog.locator('#si-email').waitFor({ state: 'visible', timeout: 30_000 });
  await dialog.locator('#si-email').fill(email);
  await dialog.locator('#si-pass').fill(password);

  // Splash also exposes several “Sign in” controls outside this modal; submit
  // inside the dialog only (`SplashSignInModal` title="Sign in").
  await dialog.locator('button[type="submit"]').click();

  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
  // Concrete post-auth chrome — not networkidle (WebChannel stays open).
  await page
    .getByRole('navigation')
    .or(page.getByRole('main'))
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });
}
