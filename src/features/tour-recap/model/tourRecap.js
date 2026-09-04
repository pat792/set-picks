/**
 * Durable personalized tour recap — variable copy for in-app, email, and push (#510).
 *
 * Live catalog trigger is `tour_recap` / templateId `tour-recap`. Edition flavor
 * (headline, opening, podium, closing) comes from the send-time payload or
 * `content/comms/tours/<edition>.md` — do not hardcode a live tour in the catalog.
 *
 * Sphere ’26 (`sphere-2026-inaugural`) is a historical edition + War Room replay
 * archive only. See `sphere2026Recap.js`.
 */

import { SEO_CONFIG } from '../../../shared/config/seo.js';

/** @typedef {{ handle: string, points: number, wins: number }} TourRecapPodiumRow */

/** @typedef {'champion' | 'top5' | 'top10' | 'full_run' | 'partial' | 'fallback'} TourRecapRankBranch */

export const TOUR_RECAP_TEMPLATE_ID = 'tour-recap';

export const TOUR_RECAP_RANK_BRANCHES = /** @type {const} */ ([
  'champion',
  'top5',
  'top10',
  'full_run',
  'partial',
  'fallback',
]);

/**
 * Preview-only fixtures — no live calendar / Sphere show dates or template IDs.
 * Used by `/comms-preview` and War Room copy preview.
 */
export const PREVIEW_TOUR_EDITION = {
  tourId: 'preview-tour',
  tourName: 'Sample Tour',
  headline: "Sample Tour: Setlist Pick'em Wrap-Up",
  showCount: 8,
  participantCount: 24,
  openingParas: [
    'The last note is in, and this Setlist Pick\'em tour is officially in the books.',
    'Calling setlists is an inexact science on a good day, and an {{showCount}}-show run kept everyone honest. Despite the curveballs, {{participantCount}} of you stepped up to lay down your picks.',
    'Before the next run, here is the final tape.',
  ],
  closingLines: [
    "Thank you to everyone who submitted picks and made this run a success. Setlist Pick'em will be back for the next stretch of shows.",
    'See you on the next run.',
  ],
  resultSectionLabel: 'Your final result',
  pushTitle: 'Tour recap is in',
  podium: {
    rows: /** @type {TourRecapPodiumRow[]} */ ([
      { handle: 'ChampionPat', points: 180, wins: 3 },
      { handle: 'SilverPick', points: 165, wins: 2 },
      { handle: 'BronzeLane', points: 150, wins: 1 },
    ]),
    honorableMentions: [
      { handle: 'LateJoiner', note: 'Locked in 4th (140 pts) after joining mid-run.' },
      { handle: 'WildcardKid', note: 'Two nightly wins in just four shows played.' },
    ],
  },
};

const DEFAULT_PERSONAL_BY_BRANCH = {
  champion:
    'You are the Champion. You navigated {{tourName}} better than anyone else, taking the #1 overall spot with {{points}} points and {{wins}} nightly wins. Soak it in, take a victory lap, and get ready to defend your title on the next tour.',
  top5:
    'You finished in the Top 5. Coming in at #{{rank}} overall, you were right in the thick of the title hunt until the very last note. You were just one or two wildcard hits away from taking the whole thing down. We\'ll see you in the top tier next tour.',
  top10:
    'You finished in the Top 10. You locked in a very respectable #{{rank}} finish out of {{participantCount}} players. Staying in the top half of the leaderboard over a {{showCount}}-show run takes consistency. Adjust your strategy, study the stats, and the Top 5 is yours next time.',
  full_run:
    'You finished at #{{rank}}. You played all {{showCount}} shows—which is a massive achievement in itself—but the curveballs kept you just outside the top 10 this time around. Wipe the slate clean and get ready to climb the boards on the next run.',
  partial:
    'You finished at #{{rank}}. You hopped into the tour for {{showsPlayed}} shows this run, dropping some great picks along the way. To climb the leaderboard next tour, make sure your picks are locked in for every single show. We\'ll see you on the next run!',
  fallback: 'You finished at #{{rank}}. Thanks for playing—see you on the next run.',
};

/**
 * @param {string} template
 * @param {Record<string, unknown>} vars
 */
export function interpolateTourRecapCopy(template, vars = {}) {
  if (typeof template !== 'string') return '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? '' : String(v);
  });
}

/**
 * @param {{
 *   rank: number,
 *   showsPlayed: number,
 *   showCount: number,
 * }} ctx
 * @returns {TourRecapRankBranch}
 */
export function resolveTourRecapRankBranch(ctx) {
  const r = Number(ctx.rank);
  const played = Number(ctx.showsPlayed);
  const showCount = Number(ctx.showCount);
  if (r === 1) return 'champion';
  if (r >= 2 && r <= 5) return 'top5';
  if (r >= 6 && r <= 10) return 'top10';
  if (r >= 11 && Number.isFinite(showCount) && showCount > 0 && played === showCount) {
    return 'full_run';
  }
  if (r >= 11 && Number.isFinite(played) && Number.isFinite(showCount) && played < showCount) {
    return 'partial';
  }
  return 'fallback';
}

/**
 * @param {object} [edition]
 * @param {object} [payload]
 */
export function resolveTourRecapEdition(edition, payload = {}) {
  const base = edition && typeof edition === 'object' ? edition : PREVIEW_TOUR_EDITION;
  const showCount = Number(payload.show_count ?? payload.showCount ?? base.showCount);
  const participantCount = Number(
    payload.participantCount ?? payload.participant_count ?? base.participantCount,
  );
  const tourName =
    (typeof payload.tour_name === 'string' && payload.tour_name.trim()) ||
    (typeof payload.tourName === 'string' && payload.tourName.trim()) ||
    base.tourName;
  const headline =
    (typeof payload.headline === 'string' && payload.headline.trim()) ||
    base.headline ||
    `${tourName}: Setlist Pick'em Wrap-Up`;
  const podium = payload.podium && typeof payload.podium === 'object' ? payload.podium : base.podium;
  const openingParas = Array.isArray(payload.opening_paras)
    ? payload.opening_paras
    : Array.isArray(payload.openingParas)
      ? payload.openingParas
      : base.openingParas;
  const closingLines = Array.isArray(payload.closing_lines)
    ? payload.closing_lines
    : Array.isArray(payload.closingLines)
      ? payload.closingLines
      : base.closingLines;

  return {
    ...base,
    tourId: payload.tour_id || payload.tourId || base.tourId,
    tourName,
    headline,
    showCount: Number.isFinite(showCount) ? showCount : base.showCount,
    participantCount: Number.isFinite(participantCount) ? participantCount : base.participantCount,
    openingParas,
    closingLines,
    podium,
    resultSectionLabel:
      (typeof payload.result_section_label === 'string' && payload.result_section_label.trim()) ||
      base.resultSectionLabel ||
      'Your final result',
    pushTitle:
      (typeof payload.push_title === 'string' && payload.push_title.trim()) ||
      base.pushTitle ||
      'Tour recap is in',
    personalByBranch: base.personalByBranch || DEFAULT_PERSONAL_BY_BRANCH,
  };
}

/**
 * Personalized “your final result” copy (in-app + long email).
 *
 * @param {{
 *   rank: number,
 *   points: number,
 *   wins: number,
 *   showsPlayed: number,
 *   participantCount?: number,
 *   showCount?: number,
 *   tourName?: string,
 *   edition?: object,
 * }} ctx
 * @returns {string}
 */
export function getTourRecapPersonalParagraph(ctx) {
  const edition = resolveTourRecapEdition(ctx.edition, ctx);
  const r = Number(ctx.rank);
  const pts = Number(ctx.points);
  const w = Number(ctx.wins);
  const played = Number(ctx.showsPlayed);
  const participantCount = Number(ctx.participantCount ?? edition.participantCount);
  const showCount = Number(ctx.showCount ?? edition.showCount);
  const tourName = ctx.tourName || edition.tourName;
  const branch = resolveTourRecapRankBranch({ rank: r, showsPlayed: played, showCount });
  const templates = edition.personalByBranch || DEFAULT_PERSONAL_BY_BRANCH;
  const template = templates[branch] || DEFAULT_PERSONAL_BY_BRANCH.fallback;
  return interpolateTourRecapCopy(template, {
    rank: r,
    points: pts,
    wins: w,
    showsPlayed: played,
    participantCount,
    showCount,
    tourName,
  });
}

/**
 * One-line result hook for teaser emails (not the full personalized paragraph).
 *
 * @param {{ rank: number, points: number, wins: number, tourName?: string, edition?: object }} ctx
 */
export function getTourRecapEmailTeaserResultLine(ctx) {
  const edition = resolveTourRecapEdition(ctx.edition, ctx);
  const r = Number(ctx.rank);
  const pts = Number(ctx.points);
  const w = Number(ctx.wins);
  const tourName = ctx.tourName || edition.tourName;
  if (r === 1) {
    const champ =
      edition.emailTeaserChampion ||
      'You took #1 overall with {{points}} points and {{wins}} nightly wins — congratulations on winning {{tourName}}.';
    return interpolateTourRecapCopy(champ, { points: pts, wins: w, tourName });
  }
  const line =
    edition.emailTeaserDefault ||
    'You finished #{{rank}} overall with {{points}} points and {{wins}} nightly wins.';
  return interpolateTourRecapCopy(line, { rank: r, points: pts, wins: w, tourName });
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
 *   showCount?: number,
 *   tourName?: string,
 *   edition?: object,
 *   podium?: { rows: TourRecapPodiumRow[] },
 * }} ctx
 * @param {{ siteUrl?: string, recapPath?: string }} [options]
 */
export function buildTourRecapEmailAbbreviatedPlainText(ctx, options = {}) {
  const edition = resolveTourRecapEdition(ctx.edition, ctx);
  const siteUrl = (options.siteUrl ?? SEO_CONFIG.siteUrl).replace(/\/+$/, '');
  const recapPath = options.recapPath ?? '/dashboard';
  const recapUrl = `${siteUrl}${recapPath.startsWith('/') ? recapPath : `/${recapPath}`}`;
  const participantCount = ctx.participantCount ?? edition.participantCount;
  const podium = ctx.podium ?? edition.podium;
  const champion = podium?.rows?.[0];
  const tourName = ctx.tourName || edition.tourName;

  const lines = [
    edition.headline,
    '',
    `${tourName} is wrapped — thank you to everyone who played (${participantCount} pickers on the board).`,
    '',
    getTourRecapEmailTeaserResultLine({ ...ctx, edition, tourName }),
    '',
    champion
      ? `Champion: ${champion.handle} (${champion.points} pts, ${champion.wins} nightly wins).`
      : '',
    '',
    'The full story, podium, honorable mentions, and your personalized recap are in the app.',
    '',
    'Log in and open your dashboard to read it:',
    recapUrl,
    '',
    `Rather browse first? Visit ${siteUrl}`,
    '',
    "Until the next run — Setlist Pick'em",
  ].filter((line, i, arr) => !(line === '' && arr[i - 1] === ''));

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
 *   showCount?: number,
 *   tourName?: string,
 *   edition?: object,
 *   podium?: typeof PREVIEW_TOUR_EDITION.podium,
 * }} ctx
 */
export function buildTourRecapEmailPlainText(ctx) {
  const edition = resolveTourRecapEdition(ctx.edition, ctx);
  const participantCount = ctx.participantCount ?? edition.participantCount;
  const showCount = ctx.showCount ?? edition.showCount;
  const podium = ctx.podium ?? edition.podium;
  const tourName = ctx.tourName || edition.tourName;
  const personal = getTourRecapPersonalParagraph({
    ...ctx,
    participantCount,
    showCount,
    tourName,
    edition,
  });
  const vars = { participantCount, showCount, tourName };
  const opening = (edition.openingParas || []).map((p) => interpolateTourRecapCopy(p, vars));
  const champion = podium?.rows?.[0];

  const lines = [
    edition.headline,
    '',
    ...opening,
    '',
    '---',
    'THE PODIUM',
    '',
    champion
      ? `A massive congratulations to our champion, ${champion.handle}. Taking down ${champion.wins} nightly wins across ${showCount} shows to secure ${champion.points} total points is a dominant performance.`
      : '',
    '',
    'The race for the top was incredibly tight down the stretch:',
    '',
    ...(podium?.rows || []).map((row, i) => {
      const label = i === 0 ? '1st' : i === 1 ? '2nd' : '3rd';
      return `${label}: ${row.handle} (${row.points} Pts, ${row.wins} Wins)`;
    }),
    '',
    ...(podium?.honorableMentions?.length
      ? ['Honorable mentions:', ...podium.honorableMentions.map((h) => `- ${h.handle}: ${h.note}`)]
      : []),
    '',
    '---',
    (edition.resultSectionLabel || 'YOUR FINAL RESULT').toUpperCase(),
    '',
    personal,
    '',
    '---',
    ...(edition.closingLines || []).map((p) => interpolateTourRecapCopy(p, vars)),
  ];

  return lines.join('\n');
}

/**
 * Short FCM-style notification (title + body). Keep under typical OS truncation.
 *
 * @param {{ rank: number, points: number, wins: number, edition?: object, tourName?: string }} ctx
 * @returns {{ title: string, body: string }}
 */
export function buildTourRecapPushPayload(ctx) {
  const edition = resolveTourRecapEdition(ctx.edition, ctx);
  const { rank, points, wins } = ctx;
  const title = edition.pushTitle || 'Tour recap is in';
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
