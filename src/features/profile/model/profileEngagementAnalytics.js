import { ga4Event } from '../../../shared/lib/ga4';

/**
 * User successfully saved a different curated avatar (#638).
 *
 * @param {{ avatar_id?: string }} [payload]
 */
export function trackAvatarChanged({ avatar_id } = {}) {
  ga4Event('avatar_changed', {
    avatar_id: avatar_id ?? '',
  });
}

/**
 * Badge shelf section is visible on profile or public profile (#638).
 *
 * @param {{ surface?: 'profile' | 'public_profile', badge_count?: number }} [payload]
 */
export function trackBadgeShelfView({ surface, badge_count } = {}) {
  ga4Event('badge_shelf_view', {
    surface: surface === 'public_profile' ? 'public_profile' : 'profile',
    badge_count: Math.max(0, Number(badge_count) || 0),
  });
}

/**
 * User pins/unpins a badge for standings display (#638).
 * Exported for the future pin UX — no client UI wires this yet.
 *
 * @param {{ badge_id?: string, action?: 'pin' | 'unpin' }} [payload]
 */
export function trackBadgePinChanged({ badge_id, action } = {}) {
  ga4Event('badge_pin_changed', {
    badge_id: badge_id ?? '',
    action: action === 'unpin' ? 'unpin' : 'pin',
  });
}
