/**
 * Email/password sign-in via the `/login` auth entry (#349 / #830 / #834).
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

  // #834: `/login` is a full-page form (no dialog). Invite VIP still uses modals.
  // #909: credential fields start readOnly until focus (Safari Keychain guard).
  const emailField = page.locator('#si-email');
  const passField = page.locator('#si-pass');
  await emailField.waitFor({ state: 'visible', timeout: 30_000 });
  await emailField.click();
  await emailField.fill(email);
  await passField.click();
  await passField.fill(password);
  await page.locator('form button[type="submit"]').click();

  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
  // Concrete post-auth chrome — not networkidle (WebChannel stays open).
  await page
    .getByRole('navigation')
    .or(page.getByRole('main'))
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });
}
