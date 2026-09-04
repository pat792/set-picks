/**
 * Pure helpers for the durable `tour_recap` trigger (#510).
 *
 * Night `show_recap` stays on `showRecapNarrativeCore.js` — this module is
 * end-of-tour standings + edition flavor only.
 */

"use strict";

/**
 * @param {string[]} tourDates
 * @param {string} showDate
 * @returns {boolean}
 */
function isFinalShowOfTour(tourDates, showDate) {
  if (!Array.isArray(tourDates) || tourDates.length === 0 || typeof showDate !== "string") {
    return false;
  }
  const sorted = tourDates.filter((d) => typeof d === "string" && d.trim()).slice().sort();
  return sorted[sorted.length - 1] === showDate;
}

/**
 * @param {Array<{ handle: string, totalPoints: number, wins: number, shows: number }>} leaders
 * @returns {{ rows: Array<{ handle: string, points: number, wins: number }>, honorableMentions: Array<{ handle: string, note: string }> }}
 */
function buildTourRecapPodium(leaders) {
  const rows = (Array.isArray(leaders) ? leaders : []).slice(0, 3).map((row) => ({
    handle: row.handle || "Anonymous",
    points: typeof row.totalPoints === "number" ? row.totalPoints : 0,
    wins: typeof row.wins === "number" ? row.wins : 0,
  }));
  const honorableMentions = (Array.isArray(leaders) ? leaders : []).slice(3, 5).map((row) => {
    const pts = typeof row.totalPoints === "number" ? row.totalPoints : 0;
    const shows = typeof row.shows === "number" ? row.shows : 0;
    const wins = typeof row.wins === "number" ? row.wins : 0;
    const winBit = wins > 0 ? `, ${wins} nightly win${wins === 1 ? "" : "s"}` : "";
    return {
      handle: row.handle || "Anonymous",
      note: `${pts} pts across ${shows} show${shows === 1 ? "" : "s"}${winBit}.`,
    };
  });
  return { rows, honorableMentions };
}

/**
 * @param {{
 *   handle?: string,
 *   rank: number,
 *   points: number,
 *   wins: number,
 *   showsPlayed: number,
 *   participantCount: number,
 *   tourId: string,
 *   tourName: string,
 *   showCount: number,
 *   podium: ReturnType<typeof buildTourRecapPodium>,
 * }} input
 */
function buildTourRecapPayload(input) {
  const tourName = input.tourName || input.tourId || "this tour";
  const showCount = Number(input.showCount) || 0;
  const participantCount = Number(input.participantCount) || 0;
  return {
    handle: input.handle || "Picker",
    rank: input.rank,
    points: input.points,
    wins: input.wins,
    showsPlayed: input.showsPlayed,
    participantCount,
    tour_id: input.tourId,
    tour_name: tourName,
    show_count: showCount,
    headline: `${tourName}: Setlist Pick'em Wrap-Up`,
    podium: input.podium,
    opening_paras: [
      `${tourName} is officially in the books.`,
      `Calling setlists is an inexact science on a good day, and a ${showCount}-show run kept everyone honest. Despite the curveballs, ${participantCount} of you stepped up to lay down your picks.`,
      "Before the next run, here is the final tape.",
    ],
    closing_lines: [
      "Thank you to everyone who submitted picks and made this run a success. Setlist Pick'em will be back for the next stretch of shows.",
      "See you on the next run.",
    ],
    result_section_label: "Your final result",
    push_title: "Tour recap is in",
  };
}

module.exports = {
  isFinalShowOfTour,
  buildTourRecapPodium,
  buildTourRecapPayload,
};
