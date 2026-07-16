import { ga4Event } from '../../../shared/lib/ga4';

/**
 * @param {{
 *   invite_kind: 'site' | 'pool',
 *   via?: 'share' | 'copy',
 *   pool_id?: string,
 * }} params
 */
export function trackInviteShare({ invite_kind, via, pool_id }) {
  ga4Event('invite_share', {
    invite_kind: invite_kind === 'pool' ? 'pool' : 'site',
    ...(via ? { via } : {}),
    ...(pool_id ? { pool_id } : {}),
  });
}
