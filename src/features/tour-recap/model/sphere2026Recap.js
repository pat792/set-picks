/**
 * Sphere 2026 inaugural tour recap — variable copy for in-app, email, and push.
 *
 * Editorial draft / structure doc: `content/comms/tours/sphere-2026-inaugural.md`
 * (sync when marketing copy changes; this file remains runtime source until a loader exists).
 *
 * Channel notes (see GitHub #272): push/FCM payloads stay short plain text. Email sends
 * should prefer {@link buildSphere2026EmailAbbreviatedPlainText} (teaser + CTA) to pull
 * readers into the product; the long narrative remains in {@link buildSphere2026EmailPlainText}
 * for archival or rare full-text sends.
 */

import { SEO_CONFIG } from '../../../shared/config/seo.js';

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

const CLOSING_LINES = [
  "Thank you to everyone who tested the waters, submitted picks, and made this inaugural run a massive success. The code is getting polished, the UI is getting tightened up, and Setlist Pick'em will be back and better than ever for the next run of shows.",
  'Until then, read the book.',
];

const OPENING_PARAS = [
  "The visuals were mind-bending, the haptics were rumbling, and the very first Setlist Pick'em tour is officially in the books.",
  "Calling Phish setlists is an inexact science on a good day, but doing it during a 9-show run at the Sphere proved to be an entirely different beast. We saw massive bust-outs, wild curveballs, and completely unpredictable encores. Despite the band keeping us entirely on our toes, 23 of you stepped up to the plate to lay down your picks.",
  'Before we look ahead to the summer tour, let us look at the final tape from the desert.',
];

/**
 * Full personalized “Your Final Sphere ’26 result” copy (in-app + long email).
 * Editorial source: `content/comms/tours/sphere-2026-inaugural.md` → section “Your Final Sphere ’26 result”.
 *
 * @param {{
 *   rank: number,
 *   points: number,
 *   wins: number,
 *   showsPlayed: number,
 *   participantCount?: number,
 * }} ctx
 * @returns {string}
 */
export function getSphere2026PersonalParagraph(ctx) {
  const { rank, points, wins, showsPlayed, participantCount: pc } = ctx;
  const participantCount = pc ?? SPHERE_2026_META.participantCount;
  const r = Number(rank);
  const pts = Number(points);
  const w = Number(wins);
  const played = Number(showsPlayed);

  if (r === 1) {
    return `You are the Champion. You navigated the Sphere run better than anyone else, taking the #1 overall spot with ${pts} points and ${w} nightly wins. Your prize is eternal bragging rights as the winner of the inaugural Setlist Pick'em tour. Soak it in, take a victory lap, and get ready to defend your title on the next tour.`;
  }
  if (r >= 2 && r <= 5) {
    return `You finished in the Top 5. Coming in at #${r} overall, you were right in the thick of the title hunt until the very last note. You proved you have a serious read on the band's current rotation—you were just one or two wildcard hits away from taking the whole thing down. We'll see you in the top tier next tour.`;
  }
  if (r >= 6 && r <= 10) {
    return `You finished in the Top 10. You locked in a very respectable #${r} finish out of ${participantCount} players. Staying in the top half of the leaderboard over a 9-show run takes consistency and a good ear for the band's pacing. Adjust your strategy, study the stats, and the Top 5 is yours next time.`;
  }
  if (r >= 11 && played === 9) {
    return `You finished at #${r}. You played all 9 shows—which is a massive achievement in itself—but the band's curveballs kept you just outside the top 10 this time around. The Sphere run was notoriously unpredictable, so wipe the slate clean and get ready to climb the boards on the next run.`;
  }
  if (r >= 11 && played < 9) {
    return `You finished at #${r}. You hopped into the tour for ${played} shows this run, dropping some great picks along the way. To climb the leaderboard next tour, make sure your picks are locked in for every single show. We'll see you on the next run!`;
  }
  return `You finished at #${r}. Thanks for playing—see you on the next run.`;
}

/**
 * One-line result hook for teaser emails (not the full personalized paragraph).
 * Editorial source: `content/comms/tours/sphere-2026-inaugural.md` → “Email: one-line result teaser”.
 *
 * @param {{ rank: number, points: number, wins: number }} ctx
 */
export function getSphere2026EmailTeaserResultLine(ctx) {
  const r = Number(ctx.rank);
  const pts = Number(ctx.points);
  const w = Number(ctx.wins);
  if (r === 1) {
    return `You took #1 overall with ${pts} points and ${w} nightly wins — congratulations on winning the inaugural Setlist Pick'em tour at the Sphere.`;
  }
  return `You finished #${r} overall with ${pts} points and ${w} nightly wins.`;
}

/**
 * Abbreviated plain-text email: short hook + CTA to log in / open the site for the full recap.
 *
 * @param {{
 *   rank: number,
 *   points: number,
 *   wins: number,
 *   showsPlayed: number,
 *   participantCount?: number,
 * }} ctx
 * @param {{ siteUrl?: string, recapPath?: string }} [options] `recapPath` defaults to `/dashboard` (sign-in if needed).
 */
export function buildSphere2026EmailAbbreviatedPlainText(ctx, options = {}) {
  const siteUrl = (options.siteUrl ?? SEO_CONFIG.siteUrl).replace(/\/+$/, '');
  const recapPath = options.recapPath ?? '/dashboard';
  const recapUrl = `${siteUrl}${recapPath.startsWith('/') ? recapPath : `/${recapPath}`}`;
  const participantCount = ctx.participantCount ?? SPHERE_2026_META.participantCount;
  const champion = SPHERE_2026_PODIUM.rows[0];

  const teaserResult = getSphere2026EmailTeaserResultLine(ctx);

  const lines = [
    SPHERE_2026_META.headline,
    '',
    `The Sphere run is wrapped — thank you to everyone who played (${participantCount} pickers on the board).`,
    '',
    teaserResult,
    '',
    `Champion: ${champion.handle} (${champion.points} pts, ${champion.wins} nightly wins).`,
    '',
    'The full story, podium, honorable mentions, and your personalized recap are in the app.',
    '',
    'Log in and open your dashboard to read it:',
    recapUrl,
    '',
    `Rather browse first? Visit ${siteUrl}`,
    '',
    "Until the next run — Setlist Pick'em",
  ];

  return lines.join('\n');
}

/**
 * Full plain-text body for email or long in-app message (no emoji; section headers are ASCII).
 *
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
  const participantCount = ctx.participantCount ?? SPHERE_2026_META.participantCount;
  const podium = ctx.podium ?? SPHERE_2026_PODIUM;
  const personal = getSphere2026PersonalParagraph({ ...ctx, participantCount });

  const opening = OPENING_PARAS.map((p) =>
    p.replace(/23 of you/g, `${participantCount} of you`),
  );

  const lines = [
    SPHERE_2026_META.headline,
    '',
    ...opening,
    '',
    '---',
    'THE PODIUM',
    '',
    `A massive congratulations to our inaugural champion, ${podium.rows[0].handle}. Taking down ${podium.rows[0].wins} nightly wins across ${SPHERE_2026_META.showCount} shows to secure ${podium.rows[0].points} total points is a dominant performance.`,
    '',
    'The race for the top was incredibly tight down the stretch:',
    '',
    ...podium.rows.map((row, i) => {
      const label = i === 0 ? '1st' : i === 1 ? '2nd' : '3rd';
      return `${label}: ${row.handle} (${row.points} Pts, ${row.wins} Wins)`;
    }),
    '',
    'Honorable mentions:',
    ...podium.honorableMentions.map((h) => `- ${h.handle}: ${h.note}`),
    '',
    '---',
    'YOUR FINAL SPHERE 26 RESULT',
    '',
    personal,
    '',
    '---',
    ...CLOSING_LINES,
  ];

  return lines.join('\n');
}

/**
 * Short FCM-style notification (title + body). Keep under typical OS truncation.
 *
 * @param {{ rank: number, points: number, wins: number }} ctx
 * @returns {{ title: string, body: string }}
 */
export function buildSphere2026PushPayload(ctx) {
  const { rank, points, wins } = ctx;
  const title = "Sphere '26 recap is in";
  if (Number(rank) === 1) {
    return {
      title,
      body: `You took #1 with ${points} pts and ${wins} nightly wins. Open the app for the full wrap-up.`,
    };
  }
  return {
    title,
    body: `You finished #${rank} (${points} pts, ${wins} wins). Open the app for your personalized recap.`,
  };
}
