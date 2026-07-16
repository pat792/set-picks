import {
  buildPoolInviteShareTitleFromInviter,
  buildSiteInviteShareTitle,
} from '../../../shared/lib/inviteKit';

/**
 * @param {{ inviteKind: 'site' | 'pool', resolvedHandle?: string | null }} params
 */
export function getInviteLandingHeadline({ inviteKind, resolvedHandle }) {
  const handle = typeof resolvedHandle === 'string' ? resolvedHandle.trim() : '';
  if (inviteKind === 'pool') {
    return buildPoolInviteShareTitleFromInviter(handle);
  }
  return buildSiteInviteShareTitle(handle);
}

/**
 * @param {{ inviteKind: 'site' | 'pool' }} params
 */
export function getInviteLandingSubcopy({ inviteKind }) {
  if (inviteKind === 'pool') {
    return 'Create a free account to join the pool and compete with your crew on tour.';
  }
  return 'Create a free account to predict setlists, track scores live, and compete with friends on Phish tour.';
}
