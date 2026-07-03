/**
 * Summer Tour 2026 pre-opener marketing email — payload builders (#468).
 *
 * Editorial draft: `content/comms/lifecycle/summer-tour-2026-launch.md`
 */

export const SUMMER_TOUR_2026_LAUNCH_TEMPLATE_ID = 'summer-tour-2026-launch';
export const SUMMER_TOUR_2026_LAUNCH_CAMPAIGN_ID = 'summer_tour_2026';
export const SUMMER_TOUR_2026_LAUNCH_TRIGGER_ID = 'marketing_summer_tour_2026_launch';

/** First Summer Tour 2026 show — Kohl Center, Madison (Tuesday). */
export const SUMMER_TOUR_2026_OPENER = {
  date: '2026-07-07',
  venue: 'Kohl Center, Madison, WI',
  label: 'Tuesday, July 7',
};

const SITE_URL = 'https://www.setlistpickem.com';
const NOTIFICATIONS_PATH = '/dashboard/profile/notifications';

/**
 * @typedef {'sphere_alum' | 'post_sphere_signup' | 'sphere_alum_and_new'} MarketingAudienceSegment
 */

/**
 * @param {string | undefined | null} handle
 * @returns {string}
 */
export function greetingNameFromHandle(handle) {
  const h = typeof handle === 'string' ? handle.trim() : '';
  return h || 'friend';
}

/**
 * @param {MarketingAudienceSegment} segment
 * @param {string} uid
 * @param {string} sphereUid
 * @returns {MarketingAudienceSegment}
 */
export function resolveAudienceSegment(segment, uid, sphereUid) {
  if (segment === 'sphere_alum_and_new') return segment;
  if (uid === sphereUid && segment === 'post_sphere_signup') return 'sphere_alum_and_new';
  return segment;
}

/**
 * Build per-recipient template props for React Email render.
 *
 * @param {{
 *   handle?: string,
 *   audienceSegment?: MarketingAudienceSegment,
 *   siteUrl?: string,
 * }} input
 * @returns {Record<string, string>}
 */
export function buildSummerTour2026LaunchEmailProps(input = {}) {
  const siteUrl = (input.siteUrl ?? SITE_URL).replace(/\/+$/, '');
  const baseUtm = 'utm_source=email&utm_campaign=summer_tour_2026_launch';
  const inviteCode =
    typeof input.inviteCode === 'string' ? input.inviteCode.trim().toUpperCase() : '';
  const shareUrl = inviteCode
    ? `${siteUrl}/join/${encodeURIComponent(inviteCode)}?${baseUtm}&utm_content=share_friends`
    : `${siteUrl}/?${baseUtm}&utm_content=share_friends`;

  return {
    greetingName: greetingNameFromHandle(input.handle),
    audienceSegment: input.audienceSegment ?? 'sphere_alum',
    openerLabel: SUMMER_TOUR_2026_OPENER.label,
    siteUrl,
    settingsUrl: `${siteUrl}${NOTIFICATIONS_PATH}`,
    shareUrl,
    ...(inviteCode ? { inviteCode } : {}),
  };
}

export const SUMMER_TOUR_2026_LAUNCH_SUBJECT =
  "Summer Tour's almost here — bring your crew →";
