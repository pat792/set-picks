/**
 * Pure helpers for push registration UI hydration (issue #384 follow-up).
 */

/**
 * @param {{
 *   permission: NotificationPermission | 'unsupported',
 *   storedToken?: string | null,
 *   localToken?: string | null,
 * }} input
 * @returns {{ status: 'idle' | 'enabled', token: string, shouldResync: boolean }}
 */
export function resolveHydratedPushRegistration({
  permission,
  storedToken = null,
  localToken = null,
}) {
  if (permission !== 'granted') {
    return { status: 'idle', token: '', shouldResync: false };
  }

  const stored = typeof storedToken === 'string' && storedToken.trim() ? storedToken.trim() : '';
  const local = typeof localToken === 'string' && localToken.trim() ? localToken.trim() : '';
  const token = local || stored;

  if (!token) {
    return { status: 'idle', token: '', shouldResync: false };
  }

  return {
    status: 'enabled',
    token,
    shouldResync: Boolean(local && local !== stored),
  };
}
