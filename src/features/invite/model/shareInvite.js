import {
  buildPoolInviteShareTitleFromInviter,
  buildPoolInviteUrl,
  buildSiteInviteShareTitle,
  buildSiteInviteUrl,
  normalizeInviteHandle,
} from '../../../shared/lib/inviteKit';
import { createPoolInviteLink } from '../../../shared/lib/createPoolInviteLink';
import {
  buildPoolInviteShareTitle,
  shareOrCopyInviteUrl,
} from '../../../shared/lib/shareOrCopyInviteUrl';
import { trackInviteShare } from './inviteAnalytics';

/**
 * Share a site or pool invite and emit `invite_share` on success.
 *
 * @param {{
 *   invite_kind: 'site' | 'pool',
 *   url: string,
 *   title?: string,
 *   poolName?: string,
 *   inviterHandle?: string,
 *   pool_id?: string,
 *   copyToastMessage?: string,
 * }} args
 */
export async function shareInvite({
  invite_kind,
  url,
  title,
  poolName,
  inviterHandle,
  pool_id,
  copyToastMessage = 'Invite link copied!',
}) {
  const kind = invite_kind === 'pool' ? 'pool' : 'site';
  const resolvedTitle =
    title ??
    (kind === 'site'
      ? buildSiteInviteShareTitle(inviterHandle)
      : inviterHandle
        ? buildPoolInviteShareTitleFromInviter(inviterHandle, poolName)
        : buildPoolInviteShareTitle(poolName));

  const result = await shareOrCopyInviteUrl(url, {
    title: resolvedTitle,
    poolName,
    copyToastMessage,
  });

  if (result.ok) {
    trackInviteShare({
      invite_kind: kind,
      via: result.via,
      pool_id,
    });
  }

  return result;
}

export {
  buildPoolInviteShareTitle,
  buildPoolInviteShareTitleFromInviter,
  buildPoolInviteUrl,
  buildSiteInviteShareTitle,
  buildSiteInviteUrl,
  createPoolInviteLink,
  normalizeInviteHandle,
  shareOrCopyInviteUrl,
};
