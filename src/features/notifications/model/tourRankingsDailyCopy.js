/**
 * In-app copy for `tour_rankings_daily` (#544).
 *
 * Keep in sync with `functions/tourRankingsDailyCore.js` →
 * `buildTourRankingsDailyParagraphs` (functions cannot import this ESM module).
 *
 * @param {unknown} value
 * @returns {string}
 */
function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * @param {string} venue
 * @param {string} city
 * @returns {string}
 */
function appendCityIfNeeded(venue, city) {
  if (!city) return venue;
  if (!venue) return city;
  if (venue.toLowerCase().includes(city.toLowerCase())) return venue;
  return `${venue}, ${city}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizePlace(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * @param {string} nextVenue
 * @param {string[]} currentLabels
 * @returns {boolean}
 */
function isSamePlace(nextVenue, currentLabels) {
  const next = normalizePlace(nextVenue);
  if (!next) return false;
  return currentLabels.some((label) => {
    const current = normalizePlace(label);
    return current && (current === next || current.includes(next) || next.includes(current));
  });
}

/**
 * @param {Record<string, unknown>} p
 * @param {{ omitHandle?: boolean }} [opts]
 * @returns {string[]}
 */
export function buildTourRankingsDailyParagraphs(p, opts = {}) {
  const handle = cleanText(p.handle) || 'Picker';
  const omitHandle = opts.omitHandle === true;
  const venue = cleanText(p.venue_name);
  const city = cleanText(p.venue_city);
  const place = appendCityIfNeeded(venue, city) || 'last night';
  const standaloneShowRef = place;
  const combinedShowRef = "last night's show";
  const paragraphShowRef = omitHandle ? combinedShowRef : standaloneShowRef;
  const date = cleanText(p.show_date);
  const showLabel = date ? `${date} — ${place}` : place;
  const paragraphShowLabel = omitHandle ? combinedShowRef : showLabel;

  const tourRank = p.tour_rank != null ? Number(p.tour_rank) : null;
  const total = p.total_tour_pickers != null ? Number(p.total_tour_pickers) : null;
  const pts = p.tour_points != null ? Number(p.tour_points) : null;
  const tied = p.tour_rank_tied === true;
  const ofTotal = total != null ? ` of ${total}` : '';
  const ptsClause = pts != null ? ` with ${pts} points` : '';
  const tourStanding =
    tourRank != null
      ? tied
        ? `you're tied for #${tourRank}${ofTotal} on tour${ptsClause}`
        : `you're ranked #${tourRank}${ofTotal} on tour${ptsClause}`
      : pts != null
        ? `you're on the board${ptsClause}`
        : "you're on the board";
  const tiedParen =
    tourRank != null && tied ? ` (tied for #${tourRank}${ofTotal})` : '';

  /** @type {string[]} */
  const paras = [];

  if (p.is_debut === true) {
    paras.push(`You're on the board!`);
    paras.push(
      omitHandle
        ? `After ${paragraphShowLabel} ${tourStanding}.`
        : `${handle}, after ${showLabel} ${tourStanding}.`
    );
    paras.push(
      'Night one sets the tour leaderboard — future mornings will show where you stand across the whole tour.'
    );
  } else if (p.is_late_joiner === true) {
    const showRank =
      p.global_rank != null
        ? `ranked #${p.global_rank}${
            p.global_total_pickers != null ? ` of ${p.global_total_pickers}` : ''
          } globally`
        : null;
    const lateLead = omitHandle
      ? `Welcome aboard — ${
          showRank
            ? `you finished ${showRank} last night`
            : `after ${paragraphShowRef}`
        }, and ${tourStanding}.`
      : `${handle}, welcome aboard — ${
          showRank
            ? `you finished ${showRank} last night at ${paragraphShowRef}`
            : `after ${paragraphShowRef}`
        }, and ${tourStanding}.`;
    paras.push(lateLead);
    paras.push('There is still time to catch up — every show counts.');
  } else {
    const change = p.rank_change;
    let movement;
    if (change === 'held') {
      movement = 'held your spot';
    } else if (typeof change === 'string' && change.startsWith('up ')) {
      const n = change.slice(3);
      movement = `climbed ${n} ${n === '1' ? 'spot' : 'spots'}`;
    } else if (typeof change === 'string' && change.startsWith('down ')) {
      const n = change.slice(5);
      movement = `slipped ${n} ${n === '1' ? 'spot' : 'spots'}`;
    } else {
      movement = null;
    }

    if (movement) {
      paras.push(
        omitHandle
          ? `After ${paragraphShowRef} you ${movement}.`
          : `${handle}, after ${paragraphShowRef} you ${movement}.`
      );
    } else {
      paras.push(
        omitHandle
          ? `After ${paragraphShowRef} ${tourStanding}.`
          : `${handle}, after ${paragraphShowRef} ${tourStanding}.`
      );
    }

    const tier =
      p.tour_tier === 'leader' || p.tour_tier === 'top5'
        ? p.tour_tier
        : tourRank === 1
          ? 'leader'
          : tourRank != null && tourRank >= 2 && tourRank <= 5
            ? 'top5'
            : null;

    if (tier === 'leader') {
      paras.push(`You're leading the tour${ptsClause}${tiedParen}.`);
    } else if (tier === 'top5') {
      paras.push(
        tourRank != null
          ? `Still in the top 5 — ranked #${tourRank}${ofTotal}${ptsClause}.`
          : `Still in the top 5${ptsClause}.`
      );
    } else if (tourRank != null) {
      paras.push(
        `${tourStanding.charAt(0).toUpperCase()}${tourStanding.slice(1)}.`
      );
    }
  }

  if (p.next_show_date || p.next_show_venue) {
    const nextVenue = cleanText(p.next_show_venue);
    const nextDate = cleanText(p.next_show_date);
    const samePlace = isSamePlace(nextVenue, [venue, city, place].filter(Boolean));
    paras.push(
      samePlace && nextDate && nextVenue
        ? `Back at ${nextVenue} ${nextDate}.`
        : samePlace && nextVenue
          ? `Back at ${nextVenue}.`
          : nextDate && nextVenue
            ? `Next up: ${nextDate} — ${nextVenue}.`
            : nextVenue
              ? `Next up: ${nextVenue}.`
              : `Next up: ${nextDate}.`
    );
  } else {
    paras.push('Keep your streak going on the next show.');
  }

  return paras.filter(Boolean);
}
