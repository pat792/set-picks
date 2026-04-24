import { joinPool as joinPoolFromPools } from '../../pools';

/**
 * Join via invite code for the deep-link flow.
 * @param {{ userId: string, inviteCode: string, showDates?: Array<string | { date?: string }> }} params
 * @returns {Promise<'joined' | 'already-member' | 'invalid-code' | 'pool-full'>}
 */
export async function joinPoolByInviteCode({ userId, inviteCode, showDates }) {
  try {
    await joinPoolFromPools({ userId, inviteCode, showDates });
    return 'joined';
  } catch (err) {
    if (err?.code === 'invalid-invite-code') return 'invalid-code';
    if (err?.code === 'pool-full') return 'pool-full';
    if (err?.code === 'already-in-pool') return 'already-member';
    throw err;
  }
}
