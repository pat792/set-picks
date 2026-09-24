import React from 'react';

import { SPHERE_2026_EDITION } from '../model/sphere2026Recap.js';
import TourRecapInApp from './TourRecapInApp.jsx';

/**
 * Historical Sphere ’26 inbox renderer. Existing `commsInbox` docs with
 * templateId `sphere-2026-inaugural` keep this edition flavor. Live catalog
 * preview uses {@link TourRecapInApp} + `PREVIEW_TOUR_EDITION`.
 *
 * @param {{
 *   rank: number,
 *   points: number,
 *   wins: number,
 *   showsPlayed: number,
 *   participantCount?: number,
 * }} props
 */
export default function Sphere2026TourRecapInApp(props) {
  return <TourRecapInApp {...props} edition={SPHERE_2026_EDITION} />;
}
