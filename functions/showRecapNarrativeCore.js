/**
 * Per-user show_recap narrative + scorecard enrichment (#572).
 */

"use strict";

const {
  SCORE_FIELDS,
  calculateSlotScore,
  SCORING_RULES,
} = require("./scoringCore");
const { formatBustoutSongGap } = require("./commsShowContextCore");

const SLOT_RESULT_KEYS = {
  s1o: "opener_result",
  s1c: "s1_closer_result",
  s2o: "s2_opener_result",
  s2c: "closer_result",
  enc: "encore_result",
  wild: "wildcard_result",
};

/**
 * @param {number} slotScore
 * @returns {"✓" | "✗"}
 */
function markFromSlotScore(slotScore) {
  return slotScore > 0 ? "✓" : "✗";
}

/**
 * @param {Record<string, unknown> | null | undefined} userPicks
 * @param {Record<string, unknown> | null | undefined} actualSetlist
 * @param {{ title: string, gap?: number | null }[]} [bustoutEntries]
 */
function buildUserShowScorecard(userPicks, actualSetlist, bustoutEntries = []) {
  const picks = userPicks && typeof userPicks === "object" ? userPicks : {};
  let correct = 0;
  let submitted = 0;
  let bustoutBonus = 0;
  let userHitBustout = false;
  /** @type {{ title: string, gap: number | null }[]} */
  const userBustoutHits = [];
  /** @type {Record<string, string>} */
  const results = {};

  const entryByNorm = new Map();
  for (const e of bustoutEntries || []) {
    if (!e?.title) continue;
    entryByNorm.set(String(e.title).trim().toLowerCase(), e);
  }

  const bustouts = Array.isArray(actualSetlist?.bustouts)
    ? actualSetlist.bustouts.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    : [...entryByNorm.keys()];

  for (const fieldId of SCORE_FIELDS) {
    const guess = picks[fieldId];
    const hasGuess = typeof guess === "string" && guess.trim();
    if (hasGuess) submitted += 1;
    const slotScore = calculateSlotScore(fieldId, guess, actualSetlist);
    if (slotScore > 0) correct += 1;

    const resultKey = SLOT_RESULT_KEYS[fieldId];
    if (
      resultKey &&
      (fieldId === "s1o" || fieldId === "s2c" || fieldId === "enc" || fieldId === "wild")
    ) {
      results[resultKey] = hasGuess ? markFromSlotScore(slotScore) : "—";
    }

    const guessNorm = String(guess ?? "")
      .trim()
      .toLowerCase();
    if (guessNorm && slotScore > 0 && bustouts.includes(guessNorm)) {
      userHitBustout = true;
      bustoutBonus += SCORING_RULES.BUSTOUT_BOOST;
      const entry = entryByNorm.get(guessNorm);
      const title =
        (typeof guess === "string" && guess.trim()) ||
        entry?.title ||
        guessNorm;
      if (!userBustoutHits.some((h) => h.title.toLowerCase() === title.toLowerCase())) {
        userBustoutHits.push({
          title,
          gap: entry?.gap ?? null,
        });
      }
    }
  }

  return {
    correct_picks_count: submitted ? correct : null,
    total_picks_count: submitted || null,
    opener_result: results.opener_result || null,
    closer_result: results.closer_result || null,
    encore_result: results.encore_result || null,
    wildcard_result: results.wildcard_result || null,
    bustout_bonus: bustoutBonus,
    user_hit_bustout: userHitBustout,
    user_bustout_hits: userBustoutHits,
  };
}

/**
 * Deterministic narrative branch.
 * @param {{
 *   show_score?: number | null,
 *   correct_picks_count?: number | null,
 *   total_picks_count?: number | null,
 *   user_hit_bustout?: boolean,
 * }} scorecard
 * @returns {"bustout_hero" | "hot_night" | "mixed" | "cold"}
 */
function resolveNarrativeBranch(scorecard) {
  if (scorecard.user_hit_bustout) return "bustout_hero";
  const score = typeof scorecard.show_score === "number" ? scorecard.show_score : 0;
  const correct = scorecard.correct_picks_count;
  const total = scorecard.total_picks_count;
  if (typeof correct === "number" && typeof total === "number" && total > 0) {
    if (correct >= Math.ceil(total * 0.75) || score >= 50) return "hot_night";
    if (correct === 0 || score < 15) return "cold";
    return "mixed";
  }
  if (score >= 50) return "hot_night";
  if (score < 15) return "cold";
  return "mixed";
}

/**
 * Short personal line for inApp / email Tonight.
 * Bustout hero: "You caught a bustout — Song - 47."
 * @param {{
 *   narrative_branch: string,
 *   user_hit_bustout?: boolean,
 *   user_bustout_hits?: { title: string, gap?: number | null }[],
 *   setlist_highlight?: string | null,
 * }} p
 * @returns {string}
 */
function buildNarrativePersonalLine(p) {
  const highlight = typeof p.setlist_highlight === "string" ? p.setlist_highlight.trim() : "";
  switch (p.narrative_branch) {
    case "bustout_hero": {
      const hits = Array.isArray(p.user_bustout_hits) ? p.user_bustout_hits : [];
      const songGap = formatBustoutSongGap(hits);
      if (songGap) return `You caught a bustout — ${songGap}.`;
      if (highlight) return `You caught a bustout — ${highlight.replace(/\.$/, "")}.`;
      return "You caught a bustout.";
    }
    case "hot_night":
      return highlight
        ? `Strong night. ${highlight}`
        : "Strong night — your board landed.";
    case "cold":
      return highlight
        ? `Tough board. Still a night to remember: ${highlight}`
        : "Tough board tonight — standings still have the full picture.";
    case "mixed":
    default:
      return highlight
        ? highlight
        : "Your night is graded — open standings for the breakdown.";
  }
}

/**
 * Merge show context + user scorecard into payload fields.
 * @param {{
 *   showLevel?: Record<string, unknown>,
 *   userPicks?: Record<string, unknown> | null,
 *   actualSetlist?: Record<string, unknown> | null,
 *   show_score?: number | null,
 *   top_scorer_handle?: string | null,
 *   top_score?: number | null,
 * }} input
 */
function buildShowRecapEnrichment({
  showLevel = {},
  userPicks = null,
  actualSetlist = null,
  show_score = null,
  top_scorer_handle = null,
  top_score = null,
}) {
  const bustoutEntries = Array.isArray(showLevel.bustout_entries)
    ? showLevel.bustout_entries
    : [];
  const scorecard = buildUserShowScorecard(userPicks, actualSetlist, bustoutEntries);
  const narrative_branch = resolveNarrativeBranch({
    ...scorecard,
    show_score,
  });
  return {
    ...showLevel,
    ...scorecard,
    narrative_branch,
    top_scorer_handle: top_scorer_handle || null,
    top_score: top_score ?? null,
    narrative_line: buildNarrativePersonalLine({
      narrative_branch,
      user_hit_bustout: scorecard.user_hit_bustout,
      user_bustout_hits: scorecard.user_bustout_hits,
      setlist_highlight: showLevel.setlist_highlight,
    }),
  };
}

module.exports = {
  SLOT_RESULT_KEYS,
  buildUserShowScorecard,
  resolveNarrativeBranch,
  buildNarrativePersonalLine,
  buildShowRecapEnrichment,
};
