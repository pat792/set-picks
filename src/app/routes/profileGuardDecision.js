/**
 * Pure decision functions for the auth route guards. Extracted so the
 * consent-only doc regression (May 2026 — PR #399) can be exercised by a
 * plain `*.test.js` against the `node` vitest environment without spinning
 * up a DOM.
 *
 * `handle` is the sentinel for "profile setup completed" — only written by
 * `createInitialUserProfile`, never by the consent write or any server-side
 * users-doc updater. See `docs/AUTH_TELEMETRY_RUNBOOK.md` for the matching
 * GA4 anomaly signal (`auth_partial_profile`).
 */

/**
 * @typedef {{ kind: 'loading' }
 *   | { kind: 'redirect-home' }
 *   | { kind: 'redirect-dashboard' }
 *   | { kind: 'render-setup' }} SetupDecision
 */

/**
 * @param {{
 *   loading: boolean,
 *   user: { uid: string } | null | undefined,
 *   userProfile: { handle?: string } | null | undefined,
 * }} params
 * @returns {SetupDecision}
 */
export function decideSetupRoute({ loading, user, userProfile }) {
  if (loading) return { kind: 'loading' };
  if (!user) return { kind: 'redirect-home' };
  if (userProfile?.handle) return { kind: 'redirect-dashboard' };
  return { kind: 'render-setup' };
}

/**
 * @typedef {{ kind: 'loading' }
 *   | { kind: 'redirect-home' }
 *   | { kind: 'redirect-setup', telemetry: 'partial_profile' | null }
 *   | { kind: 'render-dashboard' }} DashboardDecision
 */

/**
 * `telemetry: 'partial_profile'` fires when a `users/{uid}` doc exists for
 * the caller but is missing `handle`. That's the exact fingerprint of the
 * consent-only orphan bug — if it ever surfaces again, the GA4
 * `auth_partial_profile` event will catch it within seconds rather than
 * the two days it took us to spot the original regression.
 *
 * @param {{
 *   loading: boolean,
 *   user: { uid: string } | null | undefined,
 *   userProfile: { handle?: string } | null | undefined,
 * }} params
 * @returns {DashboardDecision}
 */
export function decideDashboardRoute({ loading, user, userProfile }) {
  if (loading) return { kind: 'loading' };
  if (!user) return { kind: 'redirect-home' };
  if (!userProfile?.handle) {
    return {
      kind: 'redirect-setup',
      telemetry: userProfile ? 'partial_profile' : null,
    };
  }
  return { kind: 'render-dashboard' };
}
