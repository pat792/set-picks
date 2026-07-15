/**
 * Google OAuth popup automation for QA runners.
 *
 * Uses a dedicated automation Google account (QA_GOOGLE_TEST_EMAIL /
 * QA_GOOGLE_TEST_PASSWORD). Google may block fully headless browsers;
 * the runner sets common anti-automation flags but CI flakiness is possible.
 *
 * @param {import('playwright').Page} popup
 * @param {string} email
 * @param {string} password
 */
export async function completeGoogleSignInPopup(popup, email, password) {
  await popup.waitForLoadState('domcontentloaded', { timeout: 60_000 });

  const emailInput = popup.locator('input[type="email"], input#identifierId').first();
  await emailInput.waitFor({ state: 'visible', timeout: 30_000 });
  await emailInput.fill(email);

  const nextAfterEmail = popup.locator('#identifierNext, button:has-text("Next")').first();
  await nextAfterEmail.click();

  const passwordInput = popup.locator('input[type="password"], input[name="Passwd"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 30_000 });
  await passwordInput.fill(password);

  const nextAfterPassword = popup.locator('#passwordNext, button:has-text("Next")').first();
  await nextAfterPassword.click();

  // Account chooser / consent — click through if present.
  const continueBtn = popup.locator(
    'button:has-text("Continue"), button:has-text("Allow"), #submit',
  );
  if (await continueBtn.first().isVisible({ timeout: 8_000 }).catch(() => false)) {
    await continueBtn.first().click();
  }

  await popup.waitForEvent('close', { timeout: 90_000 }).catch(() => {
    // Popup may close before we observe the event; caller validates app state.
  });
}

/**
 * @param {import('playwright').Page} page
 * @param {import('playwright').Locator} scope
 */
export async function clickContinueWithGoogle(page, scope) {
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 30_000 }),
    scope.getByRole('button', { name: /continue with google/i }).click(),
  ]);
  return popup;
}
