/**
 * Email/password sign-in via the splash `/?login=true` modal (#349).
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
  await page.goto(`${base}/?login=true`, {
    waitUntil: 'networkidle',
    timeout: 90_000,
  });

  await page.locator('#si-email').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('#si-email').fill(email);
  await page.locator('#si-pass').fill(password);

  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
  await page.waitForLoadState('networkidle');
}
