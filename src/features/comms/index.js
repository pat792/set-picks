/**
 * Communications surface: template registry + re-exports from recap implementations.
 * Prefer importing recap builders from here when you need both catalog metadata and functions.
 */

export {
  COMMS_CHANNELS,
  RECAP_TEMPLATE_REGISTRY,
  getRecapTemplateDefinition,
  recapTemplateSupportsChannel,
} from './registry.js';

export {
  COMMS_VARIANT_CONTROL,
  COMMS_CHANNEL,
  logCommsOpened,
  logCommsDismissed,
  logCommsCtaClick,
  logCommsPushTap,
  logCommsEmailLanded,
  logCommsPrefChanged,
} from './model/commsAnalytics.js';
export {
  SPHERE_2026_RECAP_ID,
  SPHERE_2026_META,
  SPHERE_2026_PODIUM,
  SPHERE_2026_EDITION,
  getSphere2026PersonalParagraph,
  getSphere2026EmailTeaserResultLine,
  buildSphere2026EmailAbbreviatedPlainText,
  buildSphere2026EmailPlainText,
  buildSphere2026PushPayload,
  Sphere2026TourRecapInApp,
  TOUR_RECAP_TEMPLATE_ID,
  PREVIEW_TOUR_EDITION,
  getTourRecapPersonalParagraph,
  getTourRecapEmailTeaserResultLine,
  buildTourRecapEmailAbbreviatedPlainText,
  buildTourRecapEmailPlainText,
  buildTourRecapPushPayload,
  TourRecapInApp,
  AdminTourRecapPreview,
} from '../tour-recap/index.js';
