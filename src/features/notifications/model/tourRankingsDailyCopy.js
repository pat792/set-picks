/**
 * In-app copy for `tour_rankings_daily` (#544).
 *
 * Keep in sync with `functions/tourRankingsDailyCore.js` →
 * `buildTourRankingsDailyParagraphs` (functions cannot import this ESM module).
 *
 * @param {Record<string, unknown>} p
 * @returns {string[]}
 */
export function buildTourRankingsDailyParagraphs(p) {
  const handle =
    typeof p.handle === 'string' && p.handle.trim() ? p.handle.trim() : 'Picker';
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
  const rankPhrase =
    tourRank != null
      ? tied
        ? `tied at #${tourRank}${total != null ? ` of ${total}` : ''}`
        : `#${tourRank}${total != null ? ` of ${total}` : ''}`
      : 'on the board';

  /** @type {string[]} */
  const paras = [];

  if (p.is_debut === true) {
    paras.push(`You're on the board!`);
    paras.push(
      `${handle}, after ${showLabel} you're ${rankPhrase} on tour${
        pts != null ? ` with ${pts} pts` : ''
      }.`
    );
    paras.push(
      'Night one sets the tour leaderboard — future mornings will show where you stand across the whole tour.'
    );
  } else if (p.is_late_joiner === true) {
    const showRank =
      p.global_rank != null
        ? `#${p.global_rank}${
            p.global_total_pickers != null ? ` of ${p.global_total_pickers}` : ''
          }`
        : null;
    paras.push(
      `${handle}, welcome aboard — ${
        showRank ? `you finished ${showRank} last night at ${city}` : `after ${city}`
      }, and you're ${rankPhrase} on the tour board${
        pts != null ? ` with ${pts} pts` : ''
      }.`
    );
    paras.push('There is still time to catch up — every show counts.');
  } else {
    const change = p.rank_change;
    let movement;
    if (change === 'held') {
      movement = 'held your spot';
    } else if (typeof change === 'string' && change.startsWith('up ')) {
      movement = `climbed ${change.slice(3)}`;
    } else if (typeof change === 'string' && change.startsWith('down ')) {
      movement = `slipped ${change.slice(5)}`;
    } else {
      movement = null;
    }

    if (movement) {
      paras.push(`${handle}, after ${city} you ${movement}.`);
    } else {
      paras.push(`${handle}, after ${city} you're ${rankPhrase} on tour.`);
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
      paras.push(
        `You're leading the tour${pts != null ? ` with ${pts} pts` : ''}${
          tied ? ` (${rankPhrase})` : ''
        }.`
      );
    } else if (tier === 'top5') {
      paras.push(
        `Still in the top 5 — ${rankPhrase}${pts != null ? ` with ${pts} pts` : ''}.`
      );
    } else if (tourRank != null) {
      paras.push(`You're ${rankPhrase} on tour${pts != null ? ` with ${pts} pts` : ''}.`);
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
