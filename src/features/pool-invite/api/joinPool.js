import { joinPool as joinPoolFromPools } from '../../pools';

/**
 * Join via invite code for the deep-link flow.
 * @param {{ userId: string, inviteCode: string, showDates?: Array<string | { date?: string }> }} params
 * @returns {Promise<{
 *   outcome: 'joined' | 'already-member' | 'invalid-code' | 'pool-full' | 'pool-archived',
 *   poolId?: string,
 * }>}
 */
export async function joinPoolByInviteCode({ userId, inviteCode, showDates }) {
  try {
    const pool = await joinPoolFromPools({ userId, inviteCode, showDates });
    return {
      outcome: 'joined',
      poolId: typeof pool?.id === 'string' ? pool.id : undefined,
    };
  } catch (err) {
    if (err?.code === 'invalid-invite-code') return { outcome: 'invalid-code' };
    if (err?.code === 'pool-full') return { outcome: 'pool-full' };
    if (err?.code === 'pool-archived') return { outcome: 'pool-archived' };
    if (err?.code === 'already-in-pool') {
      return {
        outcome: 'already-member',
        poolId: typeof err?.poolId === 'string' ? err.poolId : undefined,
      };
    }
    throw err;
  }
}
