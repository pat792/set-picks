/**
 * Sphere 2026 inaugural tour recap — historical edition archive (#510).
 *
 * Not a live catalog trigger. Inbox docs with templateId `sphere-2026-inaugural`
 * and the War Room replay callable `deliverSphere2026TourRecapInbox` still use
 * this edition. Production fan-out is `tour_recap` → `tourRecap.js`.
 *
 * Editorial draft: `content/comms/tours/sphere-2026-inaugural.md`
 */

import {
  buildTourRecapEmailAbbreviatedPlainText,
  buildTourRecapEmailPlainText,
  buildTourRecapPushPayload,
  getTourRecapEmailTeaserResultLine,
  getTourRecapPersonalParagraph,
} from './tourRecap.js';

/** @typedef {{ handle: string, points: number, wins: number }} TourRecapPodiumRow */

export const SPHERE_2026_RECAP_ID = 'sphere-2026-inaugural';

export const SPHERE_2026_META = {
  recapId: SPHERE_2026_RECAP_ID,
  headline: "Sphere 2026: The Inaugural Setlist Pick'em Wrap-Up",
  tourVenue: 'Sphere',
  tourYear: 2026,
  showCount: 9,
  /** Example final field size for this recap draft; override at send time when known. */
  participantCount: 23,
};

/** Final podium snapshot for messaging (handles + stats). */
export const SPHERE_2026_PODIUM = {
  rows: /** @type {TourRecapPodiumRow[]} */ ([
    { handle: 'Rivertranced', points: 160, wins: 4 },
    { handle: 'ArmenianMan', points: 150, wins: 3 },
    { handle: 'I have the book', points: 145, wins: 1 },
  ]),
  honorableMentions: [
    {
      handle: 'HotDog Billy',
      note: 'Secured 4th place (140 pts) despite missing a show.',
    },
    {
      handle: 'drgluhanick',
      note: 'Two nightly wins in just four shows played.',
    },
  ],
};

/** Historical edition flavor — replay / existing inbox docs only. */
export const SPHERE_2026_EDITION = {
  tourId: SPHERE_2026_RECAP_ID,
  tourName: "Sphere '26",
  headline: SPHERE_2026_META.headline,
  showCount: SPHERE_2026_META.showCount,
  participantCount: SPHERE_2026_META.participantCount,
  resultSectionLabel: "Your Final Sphere '26 Result",
  pushTitle: "Sphere '26 recap is in",
  openingParas: [
    "The visuals were mind-bending, the haptics were rumbling, and the very first Setlist Pick'em tour is officially in the books.",
    "Calling Phish setlists is an inexact science on a good day, but doing it during a {{showCount}}-show run at the Sphere proved to be an entirely different beast. We saw massive bust-outs, wild curveballs, and completely unpredictable encores. Despite the band keeping us entirely on our toes, {{participantCount}} of you stepped up to the plate to lay down your picks.",
    'Before we look ahead to the summer tour, let us look at the final tape from the desert.',
  ],
  closingLines: [
    "Thank you to everyone who tested the waters, submitted picks, and made this inaugural run a massive success. The code is getting polished, the UI is getting tightened up, and Setlist Pick'em will be back and better than ever for the next run of shows.",
    'Until then, read the book.',
  ],
  podium: SPHERE_2026_PODIUM,
  emailTeaserChampion:
    "You took #1 overall with {{points}} points and {{wins}} nightly wins — congratulations on winning the inaugural Setlist Pick'em tour at the Sphere.",
  personalByBranch: {
    champion:
      "You are the Champion. You navigated the Sphere run better than anyone else, taking the #1 overall spot with {{points}} points and {{wins}} nightly wins. Your prize is eternal bragging rights as the winner of the inaugural Setlist Pick'em tour. Soak it in, take a victory lap, and get ready to defend your title on the next tour.",
    top5:
      "You finished in the Top 5. Coming in at #{{rank}} overall, you were right in the thick of the title hunt until the very last note. You proved you have a serious read on the band's current rotation—you were just one or two wildcard hits away from taking the whole thing down. We'll see you in the top tier next tour.",
    top10:
      'You finished in the Top 10. You locked in a very respectable #{{rank}} finish out of {{participantCount}} players. Staying in the top half of the leaderboard over a 9-show run takes consistency and a good ear for the band\'s pacing. Adjust your strategy, study the stats, and the Top 5 is yours next time.',
    full_run:
      "You finished at #{{rank}}. You played all 9 shows—which is a massive achievement in itself—but the band's curveballs kept you just outside the top 10 this time around. The Sphere run was notoriously unpredictable, so wipe the slate clean and get ready to climb the boards on the next run.",
    partial:
      'You finished at #{{rank}}. You hopped into the tour for {{showsPlayed}} shows this run, dropping some great picks along the way. To climb the leaderboard next tour, make sure your picks are locked in for every single show. We\'ll see you on the next run!',
    fallback: 'You finished at #{{rank}}. Thanks for playing—see you on the next run.',
  },
};

/**
 * @param {{
 *   rank: number,
 *   points: number,
 *   wins: number,
 *   showsPlayed: number,
 *   participantCount?: number,
 * }} ctx
 */
export function getSphere2026PersonalParagraph(ctx) {
  return getTourRecapPersonalParagraph({
    ...ctx,
    showCount: SPHERE_2026_META.showCount,
    tourName: SPHERE_2026_EDITION.tourName,
    edition: SPHERE_2026_EDITION,
  });
}

/**
 * @param {{ rank: number, points: number, wins: number }} ctx
 */
export function getSphere2026EmailTeaserResultLine(ctx) {
  return getTourRecapEmailTeaserResultLine({
    ...ctx,
    edition: SPHERE_2026_EDITION,
  });
}

/**
 * @param {{
 *   rank: number,
 *   points: number,
 *   wins: number,
 *   showsPlayed: number,
 *   participantCount?: number,
 * }} ctx
 * @param {{ siteUrl?: string, recapPath?: string }} [options]
 */
export function buildSphere2026EmailAbbreviatedPlainText(ctx, options = {}) {
  return buildTourRecapEmailAbbreviatedPlainText(
    {
      ...ctx,
      edition: SPHERE_2026_EDITION,
      podium: ctx.podium ?? SPHERE_2026_PODIUM,
    },
    options,
  );
}

/**
 * @param {{
 *   rank: number,
 *   points: number,
 *   wins: number,
 *   showsPlayed: number,
 *   participantCount?: number,
 *   podium?: typeof SPHERE_2026_PODIUM,
 * }} ctx
 */
export function buildSphere2026EmailPlainText(ctx) {
  return buildTourRecapEmailPlainText({
    ...ctx,
    edition: SPHERE_2026_EDITION,
    podium: ctx.podium ?? SPHERE_2026_PODIUM,
  });
}

/**
 * @param {{ rank: number, points: number, wins: number }} ctx
 * @returns {{ title: string, body: string }}
 */
export function buildSphere2026PushPayload(ctx) {
  return buildTourRecapPushPayload({
    ...ctx,
    edition: SPHERE_2026_EDITION,
  });
}
