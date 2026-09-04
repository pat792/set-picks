/**
 * Per-user show_recap narrative + scorecard enrichment (#572 / #985).
 *
 * Composer contract: every narrative_line weaves arc + your card + relative
 * night rank when those facts exist. Deterministic. No LLM. Soft-fail to the
 * #572 highlight wrappers when context is missing.
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

const SLOT_PROSE = {
  s1o: "opener",
  s1c: "set 1 closer",
  s2o: "set 2 opener",
  s2c: "closer",
  enc: "encore",
  wild: "wildcard",
};

/**
 * @param {number} slotScore
 * @returns {"✓" | "✗"}
 */
function markFromSlotScore(slotScore) {
  return slotScore > 0 ? "✓" : "✗";
}

/**
 * @param {string[]} items
 * @returns {string}
 */
function joinProse(items) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * @param {string[]} labels
 * @returns {string}
 */
function formatHitList(labels) {
  if (labels.length === 1) return `the ${labels[0]}`;
  if (labels.length === 2) return `the ${labels[0]} and ${labels[1]}`;
  return joinProse(labels);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {string} value
 * @returns {string}
 */
function ensurePeriod(value) {
  const t = String(value || "").trim();
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/**
 * @param {string} value
 * @returns {string}
 */
function capitalizeSentence(value) {
  const t = String(value || "").trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
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
  /** @type {{ fieldId: string, label: string, title: string | null, hit: boolean, submitted: boolean }[]} */
  const slot_hits = [];

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
    slot_hits.push({
      fieldId,
      label: SLOT_PROSE[fieldId] || fieldId,
      title: hasGuess ? String(guess).trim() : null,
      hit: slotScore > 0,
      submitted: Boolean(hasGuess),
    });
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
    // Always the game's six slots (s1o/s1c/s2o/s2c/enc/wild) — not "how many
    // fields the user filled" — so copy reads "3 of 6", not "3 of 4".
    total_picks_count: submitted ? SCORE_FIELDS.length : null,
    opener_result: results.opener_result || null,
    closer_result: results.closer_result || null,
    encore_result: results.encore_result || null,
    wildcard_result: results.wildcard_result || null,
    bustout_bonus: bustoutBonus,
    user_hit_bustout: userHitBustout,
    user_bustout_hits: userBustoutHits,
    slot_hits,
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
 * #572 highlight wrappers — used only when the composer has no facts.
 * @param {{
 *   narrative_branch?: string,
 *   user_bustout_hits?: { title: string, gap?: number | null }[],
 *   setlist_highlight?: string | null,
 * }} p
 * @returns {string}
 */
function buildLegacyNarrativeLine(p) {
  const highlight = trimText(p.setlist_highlight);
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
 * @param {Record<string, unknown>} p
 * @returns {string}
 */
function composeArcSentence(p) {
  const flow = trimText(p.set_flow_summary);
  if (flow) return ensurePeriod(flow);
  const opener = trimText(p.opener_title);
  const encore = trimText(p.encore_title);
  if (opener && encore) return `${opener} opened; ${encore} closed the night.`;
  if (opener) return `${opener} opened the night.`;
  if (encore) return `Encore: ${encore}.`;
  return "";
}

/**
 * Show-context bustout sticker (labeled). Empty when the night had no bustout.
 * @param {Record<string, unknown>} p
 * @returns {string}
 */
function labeledBustoutContext(p) {
  const highlight = trimText(p.setlist_highlight);
  if (/^Bustouts?:/i.test(highlight)) return highlight.replace(/\.$/, "");
  const entries = Array.isArray(p.bustout_entries) ? p.bustout_entries : [];
  const gap = formatBustoutSongGap(entries);
  if (gap) {
    const label = entries.length > 1 ? "Bustouts" : "Bustout";
    return `${label}: ${gap}`;
  }
  const titles = Array.isArray(p.bustout_titles)
    ? p.bustout_titles.filter((t) => typeof t === "string" && t.trim())
    : [];
  if (titles.length) {
    const label = titles.length > 1 ? "Bustouts" : "Bustout";
    return `${label}: ${titles.join("; ")}`;
  }
  return "";
}

/**
 * @param {Record<string, unknown>} p
 * @returns {string}
 */
function hitCountClause(p) {
  const n = p.correct_picks_count;
  const total = p.total_picks_count != null ? p.total_picks_count : 6;
  if (typeof n === "number") return `${n} of ${total}`;
  return "";
}

/**
 * @param {Record<string, unknown>} p
 * @returns {{ fieldId: string, label: string, title: string | null, hit: boolean, submitted: boolean }[]}
 */
function submittedHits(p) {
  const slots = Array.isArray(p.slot_hits) ? p.slot_hits : [];
  return slots.filter((s) => s && s.submitted && s.hit);
}

/**
 * @param {Record<string, unknown>} p
 * @returns {boolean}
 */
function hasBoardFacts(p) {
  const slots = Array.isArray(p.slot_hits) ? p.slot_hits : [];
  return slots.some((s) => s && s.submitted) || typeof p.correct_picks_count === "number";
}

/**
 * Your card — which of *their* slots hit; bustout they caught or missed.
 * Does not name unpicked songs unless the clause is clearly show-context.
 * @param {Record<string, unknown>} p
 * @returns {string}
 */
function composeCardSentence(p) {
  if (!hasBoardFacts(p)) return "";

  const hits = submittedHits(p);
  const hitLabels = hits.map((s) => s.label);
  const count = hitCountClause(p);
  const total = typeof p.total_picks_count === "number" ? p.total_picks_count : 6;
  const correct = typeof p.correct_picks_count === "number" ? p.correct_picks_count : null;
  const bustoutCtx = labeledBustoutContext(p);
  const userHits = Array.isArray(p.user_bustout_hits) ? p.user_bustout_hits : [];
  const caughtGap = formatBustoutSongGap(userHits);
  const bustoutSlot = hits.find((s) =>
    userHits.some(
      (h) =>
        h?.title &&
        s.title &&
        String(h.title).toLowerCase() === String(s.title).toLowerCase(),
    ),
  );
  const missedBustout = Boolean(bustoutCtx) && !p.user_hit_bustout;

  if (p.narrative_branch === "bustout_hero") {
    let caught = "You caught a bustout";
    if (caughtGap) caught += ` — ${caughtGap}`;
    else if (bustoutCtx) {
      caught += ` — ${bustoutCtx.replace(/^Bustouts?:\s*/i, "")}`;
    }
    if (bustoutSlot) caught += ` on your ${bustoutSlot.label}`;
    if (count) caught += ` (${count})`;
    return ensurePeriod(caught);
  }

  let board;
  if (correct === 0) {
    board = "none of your six landed";
  } else if (correct != null && correct === total) {
    board = "you hit all six";
  } else if (hitLabels.length) {
    board = `you hit ${formatHitList(hitLabels)}`;
  } else if (count) {
    board = `you had ${count} hitting`;
  } else {
    board = "";
  }

  const countSuffix =
    count && correct != null && correct > 0 && correct < total ? ` (${count})` : "";

  if (p.narrative_branch === "hot_night") {
    const lead = board
      ? `Strong night — ${board}${countSuffix}`
      : "Strong night — your board landed";
    if (missedBustout) return `${lead}; ${bustoutCtx} stayed off your board.`;
    return ensurePeriod(lead);
  }

  if (p.narrative_branch === "cold") {
    const lead = board ? `Tough board — ${board}${countSuffix}` : "Tough board";
    if (missedBustout) {
      return `${lead}; still a night to remember: ${ensurePeriod(bustoutCtx)}`;
    }
    return ensurePeriod(lead);
  }

  // mixed
  if (board && missedBustout) {
    return `${capitalizeSentence(board)}${countSuffix}; ${bustoutCtx} stayed off your board.`;
  }
  if (board) return ensurePeriod(`${capitalizeSentence(board)}${countSuffix}`);
  if (bustoutCtx) return ensurePeriod(bustoutCtx);
  return "";
}

/**
 * Weave global (and pool when present) night rank. Tour rank_change stays
 * on the morning email tour paragraph — never here.
 * @param {Record<string, unknown>} p
 * @returns {string}
 */
function composeRelativeRankSentence(p) {
  const rankRaw = p.global_rank;
  const rank =
    rankRaw != null && Number.isFinite(Number(rankRaw)) ? Number(rankRaw) : null;
  if (rank == null) return "";
  const totalRaw = p.global_total_pickers;
  const total =
    totalRaw != null && Number.isFinite(Number(totalRaw))
      ? Number(totalRaw)
      : null;
  const of = total != null ? ` of ${total}` : "";
  const global = `#${rank}${of} globally`;

  let pool = "";
  const poolRankRaw = p.pool_rank;
  if (poolRankRaw != null && Number.isFinite(Number(poolRankRaw))) {
    const poolName = trimText(p.pool_name) || "your pool";
    const poolTotalRaw = p.pool_total_pickers;
    const poolOf =
      poolTotalRaw != null && Number.isFinite(Number(poolTotalRaw))
        ? ` of ${Number(poolTotalRaw)}`
        : "";
    pool = ` and #${Number(poolRankRaw)}${poolOf} in ${poolName}`;
  }

  let verb = "That puts you";
  if (total != null && total > 0) {
    const pct = rank / total;
    if (pct <= 0.15) verb = "That puts you";
    else if (pct >= 0.75) verb = "That lands you";
    else verb = "You sit";
  }
  return `${verb} ${global}${pool}.`;
}

/**
 * 2–4 short sentences: arc + card + relative night, each only when facts exist.
 * @param {Record<string, unknown>} p
 * @returns {string}
 */
function composeShowRecapNarrative(p) {
  const input = p && typeof p === "object" ? p : {};
  const arc = composeArcSentence(input);
  const card = composeCardSentence(input);
  const rank = composeRelativeRankSentence(input);
  const parts = [arc, card, rank].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return buildLegacyNarrativeLine(input);
}

/**
 * Public composer entry (inbox Tonight / morning night-para / narrative_line).
 * @param {Record<string, unknown>} p
 * @returns {string}
 */
function buildNarrativePersonalLine(p) {
  return composeShowRecapNarrative(p);
}

/**
 * Merge show context + user scorecard into payload fields.
 * `slot_hits` stays composer-internal — not a declared catalog var.
 * @param {{
 *   showLevel?: Record<string, unknown>,
 *   userPicks?: Record<string, unknown> | null,
 *   actualSetlist?: Record<string, unknown> | null,
 *   show_score?: number | null,
 *   top_scorer_handle?: string | null,
 *   top_score?: number | null,
 *   global_rank?: number | null,
 *   global_total_pickers?: number | null,
 *   pool_name?: string | null,
 *   pool_rank?: number | null,
 *   pool_total_pickers?: number | null,
 * }} input
 */
function buildShowRecapEnrichment({
  showLevel = {},
  userPicks = null,
  actualSetlist = null,
  show_score = null,
  top_scorer_handle = null,
  top_score = null,
  global_rank = null,
  global_total_pickers = null,
  pool_name = null,
  pool_rank = null,
  pool_total_pickers = null,
} = {}) {
  const bustoutEntries = Array.isArray(showLevel.bustout_entries)
    ? showLevel.bustout_entries
    : [];
  const scorecard = buildUserShowScorecard(userPicks, actualSetlist, bustoutEntries);
  const { slot_hits, ...publicScorecard } = scorecard;
  const narrative_branch = resolveNarrativeBranch({
    ...scorecard,
    show_score,
  });
  return {
    ...showLevel,
    ...publicScorecard,
    narrative_branch,
    top_scorer_handle: top_scorer_handle || null,
    top_score: top_score ?? null,
    narrative_line: composeShowRecapNarrative({
      narrative_branch,
      user_hit_bustout: scorecard.user_hit_bustout,
      user_bustout_hits: scorecard.user_bustout_hits,
      slot_hits,
      correct_picks_count: scorecard.correct_picks_count,
      total_picks_count: scorecard.total_picks_count,
      setlist_highlight: showLevel.setlist_highlight,
      set_flow_summary: showLevel.set_flow_summary,
      opener_title: showLevel.opener_title,
      encore_title: showLevel.encore_title,
      bustout_titles: showLevel.bustout_titles,
      bustout_entries: bustoutEntries,
      show_score,
      global_rank,
      global_total_pickers,
      pool_name,
      pool_rank,
      pool_total_pickers,
    }),
  };
}

module.exports = {
  SLOT_RESULT_KEYS,
  SLOT_PROSE,
  buildUserShowScorecard,
  resolveNarrativeBranch,
  buildNarrativePersonalLine,
  composeShowRecapNarrative,
  composeArcSentence,
  composeCardSentence,
  composeRelativeRankSentence,
  buildShowRecapEnrichment,
};
