import { fetchPublicProfileByHandle } from '../../profile';
import { normalizeInviteHandle } from '../../../shared/lib/inviteKit';

/**
 * Resolve a public inviter profile by handle for VIP landings.
 * @param {unknown} handle
 * @returns {Promise<{ uid: string, handle?: string } | null>}
 */
export async function resolveInviterProfile(handle) {
  const normalized = normalizeInviteHandle(handle);
  if (!normalized) return null;

  try {
    const profile = await fetchPublicProfileByHandle(normalized);
    if (!profile) return null;
    return profile;
  } catch {
    return null;
  }
}
