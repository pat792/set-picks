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
  SPHERE_2026_RECAP_ID,
  SPHERE_2026_META,
  SPHERE_2026_PODIUM,
  getSphere2026PersonalParagraph,
  getSphere2026EmailTeaserResultLine,
  buildSphere2026EmailAbbreviatedPlainText,
  buildSphere2026EmailPlainText,
  buildSphere2026PushPayload,
  Sphere2026TourRecapInApp,
  AdminTourRecapPreview,
} from '../tour-recap/index.js';
