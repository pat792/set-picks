/**
 * In-app copy for `tour_rankings_daily` (#544).
 *
 * Keep in sync with `functions/tourRankingsDailyCore.js` →
 * `buildTourRankingsDailyParagraphs` (functions cannot import this ESM module).
 *
 * @param {Record<string, unknown>} p
 * @param {{ omitHandle?: boolean }} [opts]
 * @returns {string[]}
 */
export function buildTourRankingsDailyParagraphs(p, opts = {}) {
  const handle =
    typeof p.handle === 'string' && p.handle.trim() ? p.handle.trim() : 'Picker';
  const omitHandle = opts.omitHandle === true;
  const city =
    (typeof p.venue_city === 'string' && p.venue_city.trim()) ||
    (typeof p.venue_name === 'string' && p.venue_name.trim()) ||
    'last night';
  const place =
    typeof p.venue_name === 'string' && p.venue_name.trim()
      ? p.venue_name.trim()
      : city;
  const date =
    typeof p.show_date === 'string' && p.show_date.trim() ? p.show_date.trim() : '';
  const showLabel = date ? `${date} — ${place}` : place;

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
        ? `After ${showLabel} ${tourStanding}.`
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
            ? `you finished ${showRank} last night at ${city}`
            : `after ${city}`
        }, and ${tourStanding}.`
      : `${handle}, welcome aboard — ${
          showRank
            ? `you finished ${showRank} last night at ${city}`
            : `after ${city}`
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
          ? `After ${city} you ${movement}.`
          : `${handle}, after ${city} you ${movement}.`
      );
    } else {
      paras.push(
        omitHandle
          ? `After ${city} ${tourStanding}.`
          : `${handle}, after ${city} ${tourStanding}.`
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
    const nextVenue =
      typeof p.next_show_venue === 'string' ? p.next_show_venue.trim() : '';
    const nextDate =
      typeof p.next_show_date === 'string' ? p.next_show_date.trim() : '';
    paras.push(
      nextDate && nextVenue
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
