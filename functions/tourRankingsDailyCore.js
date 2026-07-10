/**
 * Pure helpers for `tour_rankings_daily` (#544).
 *
 * Tour standings aggregation mirrors `sphereTourRecapDelivery.aggregateTourStandings`
 * / dashboard `aggregateTourStandings` (points → wins → handle). Display ranks use
 * competition ranking on totalPoints (ties share a rank).
 */

"use strict";

const { pickCountsTowardSeason } = require("./rollupSeasonAggregates");

/**
 * @param {Iterable<Record<string, unknown>>} pickList
 * @returns {{ max: number | null, winners: Record<string, unknown>[] }}
 */
function reduceShowWinners(pickList) {
  let max = null;
  /** @type {Record<string, unknown>[]} */
  const eligible = [];
  for (const row of pickList) {
    if (!pickCountsTowardSeason(row)) continue;
    eligible.push(row);
    const score = typeof row.score === "number" ? row.score : 0;
    if (max === null || score > max) max = score;
  }
  if (max === null || max <= 0) {
    return { max: null, winners: [] };
  }
  const winners = eligible.filter(
    (row) => (typeof row.score === "number" ? row.score : 0) === max
  );
  return { max, winners };
}

/**
 * @typedef {{
 *   uid: string,
 *   handle: string,
 *   totalPoints: number,
 *   wins: number,
 *   shows: number,
 * }} TourStandingsRow
 */

/**
 * @param {Array<{ date: string, picks: Array<Record<string, unknown>> }>} picksByDate
 * @returns {TourStandingsRow[]}
 */
function aggregateTourStandings(picksByDate) {
  /** @type {Map<string, TourStandingsRow>} */
  const perUser = new Map();

  for (const entry of picksByDate || []) {
    const picks = Array.isArray(entry?.picks) ? entry.picks : [];
    const { max, winners } = reduceShowWinners(picks);
    const winnerUids = new Set(
      winners.map((w) => String(w.userId || w.uid || "")).filter(Boolean)
    );

    for (const row of picks) {
      if (!pickCountsTowardSeason(row)) continue;
      const uid = String(row.userId || row.uid || "").trim();
      if (!uid) continue;

      const prev = perUser.get(uid);
      const score = typeof row.score === "number" ? row.score : 0;
      const handle =
        typeof row.handle === "string" && row.handle.trim()
          ? row.handle.trim()
          : prev?.handle || "Anonymous";

      const next = prev || {
        uid,
        handle,
        totalPoints: 0,
        wins: 0,
        shows: 0,
      };
      next.handle = handle;
      next.totalPoints += score;
      next.shows += 1;
      if (max != null && winnerUids.has(uid)) next.wins += 1;
      perUser.set(uid, next);
    }
  }

  return [...perUser.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.handle.localeCompare(b.handle);
  });
}

/**
 * Competition (display) ranks on totalPoints — ties share a rank.
 *
 * @param {TourStandingsRow[]} sortedRows
 * @returns {Map<string, { rank: number, tiedCount: number, total: number, row: TourStandingsRow }>}
 */
function assignDisplayRanks(sortedRows) {
  /** @type {Map<string, { rank: number, tiedCount: number, total: number, row: TourStandingsRow }>} */
  const out = new Map();
  const total = sortedRows.length;
  /** @type {Map<number, number>} */
  const tiedByRank = new Map();

  let rank = 0;
  let prevPoints = null;
  for (let i = 0; i < sortedRows.length; i++) {
    const row = sortedRows[i];
    if (prevPoints === null || row.totalPoints < prevPoints) {
      rank = i + 1;
      prevPoints = row.totalPoints;
    }
    tiedByRank.set(rank, (tiedByRank.get(rank) || 0) + 1);
    out.set(row.uid, { rank, tiedCount: 1, total, row });
  }

  for (const entry of out.values()) {
    entry.tiedCount = tiedByRank.get(entry.rank) || 1;
  }
  return out;
}

/**
 * @param {number | null | undefined} priorRank
 * @param {number | null | undefined} currentRank
 * @returns {"held" | `up ${number}` | `down ${number}` | null}
 */
function formatRankChange(priorRank, currentRank) {
  if (priorRank == null || currentRank == null) return null;
  const prior = Number(priorRank);
  const current = Number(currentRank);
  if (!Number.isFinite(prior) || !Number.isFinite(current)) return null;
  const delta = prior - current;
  if (delta === 0) return "held";
  if (delta > 0) return `up ${delta}`;
  return `down ${Math.abs(delta)}`;
}

/**
 * Sorted YYYY-MM-DD dates for a tour key from `showDatesByTour`.
 *
 * @param {unknown} showDatesByTour
 * @param {string | null} tourKey
 * @returns {string[]}
 */
function tourDatesForKey(showDatesByTour, tourKey) {
  if (!tourKey || !Array.isArray(showDatesByTour)) return [];
  for (const group of showDatesByTour) {
    if (!group || typeof group !== "object") continue;
    const tour = typeof group.tour === "string" ? group.tour.trim() : "";
    if (tour !== tourKey) continue;
    const shows = group.shows;
    if (!Array.isArray(shows)) return [];
    /** @type {string[]} */
    const dates = [];
    for (const s of shows) {
      if (!s || typeof s !== "object") continue;
      if (typeof s.date === "string" && s.date.trim()) dates.push(s.date.trim());
    }
    return dates.sort();
  }
  return [];
}

/**
 * @param {string[]} tourDates sorted
 * @param {string} showDate
 * @returns {string[]}
 */
function tourDatesThrough(tourDates, showDate) {
  return tourDates.filter((d) => d <= showDate);
}

/**
 * @param {string[]} tourDates sorted
 * @param {string} showDate
 * @returns {string | null}
 */
function priorTourShowDate(tourDates, showDate) {
  const through = tourDatesThrough(tourDates, showDate);
  if (through.length < 2) return null;
  return through[through.length - 2] || null;
}

/**
 * @param {string[]} tourDates sorted
 * @param {string} showDate
 * @returns {string | null}
 */
function nextTourShowDate(tourDates, showDate) {
  for (const d of tourDates) {
    if (d > showDate) return d;
  }
  return null;
}

/**
 * @param {"held" | `up ${number}` | `down ${number}` | null | undefined} rankChange
 * @param {number | null | undefined} tourRank
 * @returns {"leader" | "top5" | null}
 */
function tourTier(rankChange, tourRank) {
  if (tourRank == null) return null;
  const r = Number(tourRank);
  if (!Number.isFinite(r)) return null;
  if (r === 1) return "leader";
  if (r >= 2 && r <= 5) return "top5";
  return null;
}

/**
 * Build payload fields for one recipient of `tour_rankings_daily`.
 *
 * @param {{
 *   uid: string,
 *   handle: string,
 *   showDate: string,
 *   venueName?: string,
 *   venueCity?: string,
 *   showScore?: number | null,
 *   globalRank?: number | null,
 *   globalTotalPickers?: number | null,
 *   currentBoard: Map<string, { rank: number, tiedCount: number, total: number, row: TourStandingsRow }>,
 *   priorBoard: Map<string, { rank: number, tiedCount: number, total: number, row: TourStandingsRow }> | null,
 *   isTourNightOne: boolean,
 *   nextShowDate?: string | null,
 *   nextShowVenue?: string | null,
 * }} args
 */
function buildTourRankingsDailyPayloadFields(args) {
  const current = args.currentBoard.get(args.uid) || null;
  const prior = args.priorBoard?.get(args.uid) || null;
  const tourRank = current?.rank ?? null;
  const tourPoints = current?.row.totalPoints ?? null;
  const showsPlayed = current?.row.shows ?? null;
  const totalTourPickers = current?.total ?? args.currentBoard.size;
  const tiedCount = current?.tiedCount ?? 1;
  const isTied = tiedCount > 1;

  // Night one of the tour → debut copy for everyone.
  // First appearance mid-tour (no prior-board row) → late-joiner catch-up.
  // Otherwise → movement vs prior display rank.
  const isDebut = args.isTourNightOne === true;
  const isLateJoiner = !isDebut && prior == null;

  const rankChange =
    isDebut || isLateJoiner
      ? null
      : formatRankChange(prior?.rank ?? null, tourRank);

  return {
    handle: args.handle,
    show_date: args.showDate,
    venue_name: args.venueName || "",
    venue_city: args.venueCity || "",
    show_score: args.showScore ?? null,
    global_rank: args.globalRank ?? null,
    global_total_pickers: args.globalTotalPickers ?? null,
    tour_rank: tourRank,
    tour_points: tourPoints,
    total_tour_pickers: totalTourPickers,
    shows_played: showsPlayed,
    rank_change: rankChange,
    is_debut: isDebut,
    is_late_joiner: isLateJoiner,
    tour_rank_tied: isTied,
    tour_tied_count: tiedCount,
    tour_tier: tourTier(rankChange, tourRank),
    next_show_date: args.nextShowDate || null,
    next_show_venue: args.nextShowVenue || null,
  };
}

/**
 * In-app / email paragraph lines for tour rankings (shared copy contract).
 *
 * @param {Record<string, unknown>} p
 * @returns {string[]}
 */
function buildTourRankingsDailyParagraphs(p) {
  const handle =
    typeof p.handle === "string" && p.handle.trim() ? p.handle.trim() : "Picker";
  const city =
    (typeof p.venue_city === "string" && p.venue_city.trim()) ||
    (typeof p.venue_name === "string" && p.venue_name.trim()) ||
    "last night";
  const place =
    typeof p.venue_name === "string" && p.venue_name.trim()
      ? p.venue_name.trim()
      : city;
  const date =
    typeof p.show_date === "string" && p.show_date.trim() ? p.show_date.trim() : "";
  const showLabel = date ? `${date} — ${place}` : place;

  const tourRank = p.tour_rank != null ? Number(p.tour_rank) : null;
  const total = p.total_tour_pickers != null ? Number(p.total_tour_pickers) : null;
  const pts = p.tour_points != null ? Number(p.tour_points) : null;
  const tied = p.tour_rank_tied === true;
  const rankPhrase =
    tourRank != null
      ? tied
        ? `tied at #${tourRank}${total != null ? ` of ${total}` : ""}`
        : `#${tourRank}${total != null ? ` of ${total}` : ""}`
      : "on the board";

  /** @type {string[]} */
  const paras = [];

  if (p.is_debut === true) {
    paras.push(`You're on the board!`);
    paras.push(
      `${handle}, after ${showLabel} you're ${rankPhrase} on tour${
        pts != null ? ` with ${pts} pts` : ""
      }.`
    );
    paras.push(
      "Night one sets the tour leaderboard — future mornings will show where you stand across the whole tour."
    );
  } else if (p.is_late_joiner === true) {
    const showRank =
      p.global_rank != null
        ? `#${p.global_rank}${
            p.global_total_pickers != null ? ` of ${p.global_total_pickers}` : ""
          }`
        : null;
    paras.push(
      `${handle}, welcome aboard — ${
        showRank ? `you finished ${showRank} last night at ${city}` : `after ${city}`
      }, and you're ${rankPhrase} on the tour board${
        pts != null ? ` with ${pts} pts` : ""
      }.`
    );
    paras.push("There is still time to catch up — every show counts.");
  } else {
    const change = p.rank_change;
    let movement;
    if (change === "held") {
      movement = "held your spot";
    } else if (typeof change === "string" && change.startsWith("up ")) {
      movement = `climbed ${change.slice(3)}`;
    } else if (typeof change === "string" && change.startsWith("down ")) {
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
      p.tour_tier === "leader" || p.tour_tier === "top5"
        ? p.tour_tier
        : tourRank === 1
          ? "leader"
          : tourRank != null && tourRank >= 2 && tourRank <= 5
            ? "top5"
            : null;

    if (tier === "leader") {
      paras.push(
        `You're leading the tour${pts != null ? ` with ${pts} pts` : ""}${
          tied ? ` (${rankPhrase})` : ""
        }.`
      );
    } else if (tier === "top5") {
      paras.push(
        `Still in the top 5 — ${rankPhrase}${pts != null ? ` with ${pts} pts` : ""}.`
      );
    } else if (tourRank != null) {
      paras.push(`You're ${rankPhrase} on tour${pts != null ? ` with ${pts} pts` : ""}.`);
    }
  }

  if (p.next_show_date || p.next_show_venue) {
    const nextVenue =
      typeof p.next_show_venue === "string" ? p.next_show_venue.trim() : "";
    const nextDate =
      typeof p.next_show_date === "string" ? p.next_show_date.trim() : "";
    paras.push(
      nextDate && nextVenue
        ? `Next up: ${nextDate} — ${nextVenue}.`
        : nextVenue
          ? `Next up: ${nextVenue}.`
          : `Next up: ${nextDate}.`
    );
  } else {
    paras.push("Keep your streak going on the next show.");
  }

  return paras.filter(Boolean);
}

module.exports = {
  aggregateTourStandings,
  assignDisplayRanks,
  formatRankChange,
  tourDatesForKey,
  tourDatesThrough,
  priorTourShowDate,
  nextTourShowDate,
  tourTier,
  buildTourRankingsDailyPayloadFields,
  buildTourRankingsDailyParagraphs,
};
