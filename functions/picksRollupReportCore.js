/**
 * Pure aggregation for the internal picks rollup report (#687).
 *
 * Night key = `showDate` (YYYY-MM-DD). Song values are title strings on
 * `picks.{s1o,s1c,s2o,s2c,enc,wild}` — no catalog IDs.
 *
 * No PII in aggregates: counts and titles only.
 */

const { hasNonEmptyPicksObject } = require("./rollupSeasonAggregates");

const SLOT_IDS = ["s1o", "s1c", "s2o", "s2c", "enc", "wild"];

const SLOT_LABELS = {
  s1o: "Set 1 Opener",
  s1c: "Set 1 Closer",
  s2o: "Set 2 Opener",
  s2c: "Set 2 Closer",
  enc: "Encore",
  wild: "Wildcard",
};

/**
 * @param {unknown} raw
 * @returns {string}
 */
function normalizeTitle(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim();
}

/**
 * @param {string} title
 * @returns {string}
 */
function titleKey(title) {
  return title.toLowerCase();
}

/**
 * @param {Record<string, unknown> | null | undefined} pools
 * @returns {boolean}
 */
function hasPoolAffiliation(pools) {
  return Array.isArray(pools) && pools.length > 0;
}

/**
 * Increment a song counter map.
 * @param {Map<string, { title: string, count: number }>} map
 * @param {string} title
 */
function bumpSong(map, title) {
  const key = titleKey(title);
  const existing = map.get(key);
  if (existing) {
    existing.count += 1;
  } else {
    map.set(key, { title, count: 1 });
  }
}

/**
 * @param {Map<string, { title: string, count: number }>} map
 * @param {number} submitted
 * @param {number} [limit]
 * @returns {Array<{ title: string, count: number, pct: number }>}
 */
function rankedSongs(map, submitted, limit = 20) {
  const denom = submitted > 0 ? submitted : 1;
  return [...map.values()]
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map((row) => ({
      title: row.title,
      count: row.count,
      pct: Math.round((1000 * row.count) / denom) / 10,
    }));
}

/**
 * Aggregate one night's pick docs.
 *
 * @param {string} showDate
 * @param {Array<Record<string, unknown>>} pickDocs
 * @param {{
 *   consensusPct?: number,
 *   topN?: number,
 *   setlist?: Record<string, unknown> | null,
 * }} [options]
 */
function aggregateNight(showDate, pickDocs, options = {}) {
  const consensusPct =
    typeof options.consensusPct === "number" && options.consensusPct > 0
      ? options.consensusPct
      : 25;
  const topN =
    typeof options.topN === "number" && options.topN > 0
      ? Math.trunc(options.topN)
      : 15;
  const setlist =
    options.setlist && typeof options.setlist === "object"
      ? options.setlist
      : null;

  const list = Array.isArray(pickDocs) ? pickDocs : [];
  const totalDocs = list.length;

  /** @type {Array<Record<string, unknown>>} */
  const submitted = [];
  let graded = 0;
  let poolAffiliated = 0;

  for (const doc of list) {
    if (!hasNonEmptyPicksObject(doc?.picks)) continue;
    submitted.push(doc);
    if (doc.isGraded === true) graded += 1;
    if (hasPoolAffiliation(doc.pools)) poolAffiliated += 1;
  }

  const submittedCount = submitted.length;
  /** @type {Map<string, { title: string, count: number }>} */
  const overall = new Map();
  /** @type {Record<string, Map<string, { title: string, count: number }>>} */
  const bySlot = Object.fromEntries(SLOT_IDS.map((id) => [id, new Map()]));
  /** @type {Record<string, number>} */
  const slotFills = Object.fromEntries(SLOT_IDS.map((id) => [id, 0]));

  let slotFillTotal = 0;

  for (const doc of submitted) {
    const slots =
      doc.picks && typeof doc.picks === "object" && !Array.isArray(doc.picks)
        ? doc.picks
        : {};
    /** @type {Set<string>} */
    const seenInCard = new Set();
    for (const slotId of SLOT_IDS) {
      const title = normalizeTitle(slots[slotId]);
      if (!title) continue;
      slotFills[slotId] += 1;
      slotFillTotal += 1;
      bumpSong(bySlot[slotId], title);
      const key = titleKey(title);
      if (!seenInCard.has(key)) {
        seenInCard.add(key);
        bumpSong(overall, title);
      }
    }
  }

  const uniqueSongs = overall.size;
  const diversity =
    slotFillTotal > 0
      ? Math.round((1000 * uniqueSongs) / slotFillTotal) / 10
      : 0;

  const topOverall = rankedSongs(overall, submittedCount, topN);
  /** @type {Record<string, Array<{ title: string, count: number, pct: number }>>} */
  const topBySlot = {};
  for (const slotId of SLOT_IDS) {
    topBySlot[slotId] = rankedSongs(bySlot[slotId], submittedCount, 5);
  }

  const consensus = [...overall.values()]
    .filter((row) => {
      const pct = submittedCount > 0 ? (100 * row.count) / submittedCount : 0;
      return pct >= consensusPct;
    })
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
    .map((row) => ({
      title: row.title,
      count: row.count,
      pct: Math.round((1000 * row.count) / (submittedCount || 1)) / 10,
    }));

  const rare = [...overall.values()]
    .filter((row) => row.count === 1)
    .sort((a, b) => a.title.localeCompare(b.title));

  /** @type {Record<string, number>} */
  const slotFillPct = {};
  for (const slotId of SLOT_IDS) {
    slotFillPct[slotId] =
      submittedCount > 0
        ? Math.round((1000 * slotFills[slotId]) / submittedCount) / 10
        : 0;
  }

  /** @type {null | { slotId: string, title: string, count: number, pct: number, matched: boolean | null }[]} */
  let consensusVsActual = null;
  if (setlist) {
    consensusVsActual = [];
    for (const slotId of SLOT_IDS) {
      if (slotId === "wild") continue;
      const top = topBySlot[slotId]?.[0];
      if (!top) continue;
      const actualRaw = setlist[slotId];
      const actual = normalizeTitle(actualRaw);
      const matched = actual
        ? titleKey(actual) === titleKey(top.title)
        : null;
      consensusVsActual.push({
        slotId,
        title: top.title,
        count: top.count,
        pct: top.pct,
        matched,
        ...(actual ? { actual } : {}),
      });
    }
  }

  return {
    showDate,
    totalDocs,
    submitted: submittedCount,
    graded,
    emptyOrDraft: totalDocs - submittedCount,
    poolAffiliated,
    poolAffiliatedPct:
      submittedCount > 0
        ? Math.round((1000 * poolAffiliated) / submittedCount) / 10
        : 0,
    uniqueSongs,
    slotFillTotal,
    diversityPerFill: diversity,
    slotFills,
    slotFillPct,
    topOverall,
    topBySlot,
    consensus,
    rareCount: rare.length,
    rareTitles: rare.slice(0, 40).map((r) => r.title),
    consensusVsActual,
    hasSetlist: Boolean(setlist),
  };
}

/**
 * Roll up an array of per-night aggregates into a window summary.
 *
 * @param {ReturnType<typeof aggregateNight>[]} nights
 * @param {{ topN?: number, consensusPct?: number }} [options]
 */
function aggregateWindow(nights, options = {}) {
  const list = Array.isArray(nights) ? nights : [];
  const topN =
    typeof options.topN === "number" && options.topN > 0
      ? Math.trunc(options.topN)
      : 25;
  const consensusPct =
    typeof options.consensusPct === "number" && options.consensusPct > 0
      ? options.consensusPct
      : 25;

  const series = list.map((n) => ({
    showDate: n.showDate,
    submitted: n.submitted,
    graded: n.graded,
    totalDocs: n.totalDocs,
    uniqueSongs: n.uniqueSongs,
    poolAffiliatedPct: n.poolAffiliatedPct,
    diversityPerFill: n.diversityPerFill,
    rareCount: n.rareCount,
  }));

  const submittedValues = series.map((s) => s.submitted);
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr) =>
    arr.length ? Math.round((10 * sum(arr)) / arr.length) / 10 : 0;

  let consensusHits = 0;
  let consensusComparisons = 0;
  for (const night of list) {
    if (!Array.isArray(night.consensusVsActual)) continue;
    for (const row of night.consensusVsActual) {
      if (row.matched == null) continue;
      consensusComparisons += 1;
      if (row.matched) consensusHits += 1;
    }
  }

  return {
    nightCount: list.length,
    nightsWithPicks: list.filter((n) => n.submitted > 0).length,
    series,
    submitted: {
      min: submittedValues.length ? Math.min(...submittedValues) : 0,
      max: submittedValues.length ? Math.max(...submittedValues) : 0,
      avg: avg(submittedValues),
      total: sum(submittedValues),
    },
    consensusHitRate:
      consensusComparisons > 0
        ? Math.round((1000 * consensusHits) / consensusComparisons) / 10
        : null,
    consensusComparisons,
    consensusHits,
    consensusPctThreshold: consensusPct,
    topN,
  };
}

/**
 * Accumulate song frequencies across nights (full cards, not truncated tops).
 *
 * @param {Array<{ showDate?: string, picks?: unknown }>} pickDocs
 * @param {{ topN?: number }} [options]
 */
function aggregateSongsAcrossDocs(pickDocs, options = {}) {
  const topN =
    typeof options.topN === "number" && options.topN > 0
      ? Math.trunc(options.topN)
      : 25;
  const list = Array.isArray(pickDocs) ? pickDocs : [];

  /** @type {Map<string, { title: string, pickAppearances: number, cardAppearances: number }>} */
  const byKey = new Map();
  let submittedCards = 0;

  for (const doc of list) {
    if (!hasNonEmptyPicksObject(doc?.picks)) continue;
    submittedCards += 1;
    const slots =
      doc.picks && typeof doc.picks === "object" && !Array.isArray(doc.picks)
        ? doc.picks
        : {};
    /** @type {Set<string>} */
    const seen = new Set();
    for (const slotId of SLOT_IDS) {
      const title = normalizeTitle(slots[slotId]);
      if (!title) continue;
      const key = titleKey(title);
      let row = byKey.get(key);
      if (!row) {
        row = { title, pickAppearances: 0, cardAppearances: 0 };
        byKey.set(key, row);
      }
      row.pickAppearances += 1;
      if (!seen.has(key)) {
        seen.add(key);
        row.cardAppearances += 1;
      }
    }
  }

  const ranked = [...byKey.values()]
    .sort(
      (a, b) =>
        b.cardAppearances - a.cardAppearances ||
        b.pickAppearances - a.pickAppearances ||
        a.title.localeCompare(b.title)
    )
    .map((row) => ({
      title: row.title,
      cardAppearances: row.cardAppearances,
      pickAppearances: row.pickAppearances,
      pctOfCards:
        submittedCards > 0
          ? Math.round((1000 * row.cardAppearances) / submittedCards) / 10
          : 0,
    }));

  return {
    submittedCards,
    uniqueSongs: byKey.size,
    top: ranked.slice(0, topN),
    rare: ranked.filter((r) => r.cardAppearances === 1).slice(0, 40),
    rareCount: ranked.filter((r) => r.cardAppearances === 1).length,
  };
}

/**
 * Render a markdown report from window + night aggregates + tour songs.
 *
 * @param {{
 *   title: string,
 *   generatedAt: string,
 *   window: ReturnType<typeof aggregateWindow>,
 *   nights: ReturnType<typeof aggregateNight>[],
 *   tourSongs: ReturnType<typeof aggregateSongsAcrossDocs>,
 *   meta?: Record<string, unknown>,
 * }} input
 * @returns {string}
 */
function renderMarkdownReport(input) {
  const { title, generatedAt, window, nights, tourSongs, meta } = input;
  const lines = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  if (meta && typeof meta === "object") {
    for (const [k, v] of Object.entries(meta)) {
      lines.push(`- **${k}:** ${v}`);
    }
  }
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Nights in window | ${window.nightCount} |`);
  lines.push(`| Nights with picks | ${window.nightsWithPicks} |`);
  lines.push(`| Submitted pick cards (sum) | ${window.submitted.total} |`);
  lines.push(
    `| Pickers / night (min · avg · max) | ${window.submitted.min} · ${window.submitted.avg} · ${window.submitted.max} |`
  );
  lines.push(`| Unique songs (tour window) | ${tourSongs.uniqueSongs} |`);
  lines.push(`| Rare songs (1 card only) | ${tourSongs.rareCount} |`);
  if (window.consensusHitRate != null) {
    lines.push(
      `| Crowd consensus hit rate (slot favorites vs setlist) | ${window.consensusHitRate}% (${window.consensusHits}/${window.consensusComparisons}) |`
    );
  }
  lines.push("");
  lines.push("## Nightly picker trend");
  lines.push("");
  lines.push(
    `| showDate | submitted | graded | docs | unique songs | pool % | diversity | rare |`
  );
  lines.push(
    `|----------|-----------|--------|------|--------------|--------|-----------|------|`
  );
  for (const s of window.series) {
    lines.push(
      `| ${s.showDate} | ${s.submitted} | ${s.graded} | ${s.totalDocs} | ${s.uniqueSongs} | ${s.poolAffiliatedPct} | ${s.diversityPerFill} | ${s.rareCount} |`
    );
  }
  lines.push("");
  lines.push("## Top picks across window");
  lines.push("");
  lines.push(`| Rank | Song | Cards | % of cards | Slot fills |`);
  lines.push(`|------|------|-------|------------|------------|`);
  tourSongs.top.forEach((row, i) => {
    lines.push(
      `| ${i + 1} | ${row.title} | ${row.cardAppearances} | ${row.pctOfCards} | ${row.pickAppearances} |`
    );
  });
  lines.push("");
  lines.push("## Per-night highlights");
  lines.push("");
  for (const night of nights) {
    lines.push(`### ${night.showDate}`);
    lines.push("");
    lines.push(
      `- Submitted **${night.submitted}** · graded **${night.graded}** · unique songs **${night.uniqueSongs}** · rare **${night.rareCount}**`
    );
    if (night.topOverall[0]) {
      const t = night.topOverall[0];
      lines.push(
        `- Top overall: **${t.title}** (${t.count}, ${t.pct}% of pickers)`
      );
    }
    if (night.consensus.length) {
      lines.push(
        `- Consensus (≥${window.consensusPctThreshold}%): ${night.consensus
          .map((c) => `${c.title} ${c.pct}%`)
          .join("; ")}`
      );
    }
    if (Array.isArray(night.consensusVsActual) && night.consensusVsActual.length) {
      const hits = night.consensusVsActual.filter((r) => r.matched === true);
      const misses = night.consensusVsActual.filter((r) => r.matched === false);
      lines.push(
        `- Slot-favorite vs setlist: ${hits.length} hit / ${misses.length} miss`
      );
      for (const row of night.consensusVsActual) {
        const mark =
          row.matched === true ? "HIT" : row.matched === false ? "MISS" : "?";
        const actual = row.actual ? ` (actual: ${row.actual})` : "";
        lines.push(
          `  - ${SLOT_LABELS[row.slotId] || row.slotId}: crowd **${row.title}** ${row.pct}% → ${mark}${actual}`
        );
      }
    }
    lines.push("");
  }
  lines.push("---");
  lines.push("");
  lines.push(
    "_Internal report (#687). Aggregates only — no user handles or UIDs._"
  );
  lines.push("");
  return lines.join("\n");
}

module.exports = {
  SLOT_IDS,
  SLOT_LABELS,
  normalizeTitle,
  aggregateNight,
  aggregateWindow,
  aggregateSongsAcrossDocs,
  renderMarkdownReport,
};
