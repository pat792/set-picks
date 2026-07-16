/**
 * Night-of show context for `show_recap` / `tour_rankings_daily` (#572).
 * Pure helpers — no Firestore I/O. Deterministic TTDMOM narrative (no LLM).
 */

"use strict";

/**
 * @param {unknown} value
 * @returns {string}
 */
function trimTitle(value) {
  return String(value ?? "").trim();
}

/**
 * @param {string} a
 * @param {string} b
 */
function titlesEqual(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Group official setlist into sets (mirrors client `groupOfficialSetlistBySet`).
 * @param {Record<string, unknown> | null | undefined} setlistDoc
 * @returns {{ set1: string[], set2: string[], encore: string[], hasSongs: boolean }}
 */
function groupOfficialSetlistBySet(setlistDoc) {
  if (!setlistDoc || typeof setlistDoc !== "object") {
    return { set1: [], set2: [], encore: [], hasSongs: false };
  }

  const list = Array.isArray(setlistDoc.officialSetlist)
    ? setlistDoc.officialSetlist.map(trimTitle).filter(Boolean)
    : [];

  const encoreSongs = Array.isArray(setlistDoc.encoreSongs)
    ? setlistDoc.encoreSongs.map(trimTitle).filter(Boolean)
    : [];

  const s2o = trimTitle(setlistDoc.s2o ?? setlistDoc.setlist?.s2o);
  const enc = trimTitle(setlistDoc.enc ?? setlistDoc.setlist?.enc);

  let mainList = list;
  let encoreFromList = [];

  if (encoreSongs.length > 0) {
    const firstEncIdx = list.findIndex((t) => titlesEqual(t, encoreSongs[0]));
    if (firstEncIdx >= 0) {
      mainList = list.slice(0, firstEncIdx);
      encoreFromList = list.slice(firstEncIdx);
    }
  } else if (enc) {
    const encIdx = list.findIndex((t) => titlesEqual(t, enc));
    if (encIdx >= 0) {
      mainList = list.slice(0, encIdx);
      encoreFromList = list.slice(encIdx);
    }
  }

  const encore = encoreSongs.length > 0 ? encoreSongs : encoreFromList;

  let set1 = [];
  let set2 = [];
  if (s2o) {
    const s2Idx = mainList.findIndex((t) => titlesEqual(t, s2o));
    if (s2Idx >= 0) {
      set1 = mainList.slice(0, s2Idx);
      set2 = mainList.slice(s2Idx);
    } else {
      set1 = mainList;
    }
  } else {
    set1 = mainList;
  }

  const hasSongs = set1.length + set2.length + encore.length > 0;
  return { set1, set2, encore, hasSongs };
}

/**
 * @param {Record<string, unknown> | null | undefined} setlistDoc
 * @returns {string[]}
 */
function bustoutTitlesFromDoc(setlistDoc) {
  if (!Array.isArray(setlistDoc?.bustouts)) return [];
  return setlistDoc.bustouts.map(trimTitle).filter(Boolean);
}

/**
 * @param {Record<string, unknown> | null | undefined} setlistDoc
 * @returns {string[]}
 */
function tonightTitles(setlistDoc) {
  const { set1, set2, encore } = groupOfficialSetlistBySet(setlistDoc);
  const fromGroups = [...set1, ...set2, ...encore];
  if (fromGroups.length > 0) return fromGroups;
  if (Array.isArray(setlistDoc?.officialSetlist)) {
    return setlistDoc.officialSetlist.map(trimTitle).filter(Boolean);
  }
  return [];
}

/**
 * Titles played on prior tour dates (union).
 * @param {Array<Record<string, unknown> | null | undefined>} priorDocs
 * @returns {Set<string>}
 */
function priorTourTitleSet(priorDocs) {
  const set = new Set();
  for (const doc of priorDocs || []) {
    for (const t of tonightTitles(doc)) {
      set.add(t.toLowerCase());
    }
  }
  return set;
}

/**
 * Songs played tonight that were not played earlier this tour.
 * @param {Record<string, unknown> | null | undefined} setlistDoc
 * @param {Array<Record<string, unknown> | null | undefined>} priorDocs
 * @returns {string[]}
 */
function tourDebutTitles(setlistDoc, priorDocs) {
  const prior = priorTourTitleSet(priorDocs);
  if (prior.size === 0) {
    // First show of tour / no priors: treat all as "new to tour" but keep list short.
    return tonightTitles(setlistDoc).slice(0, 8);
  }
  const debuts = [];
  for (const t of tonightTitles(setlistDoc)) {
    if (!prior.has(t.toLowerCase())) debuts.push(t);
  }
  return debuts;
}

/**
 * @param {{ set1: string[], set2: string[], encore: string[] }} groups
 * @param {string} opener
 * @param {string} encoreTitle
 * @returns {string}
 */
function composeSetFlowSummary(groups, opener, encoreTitle) {
  const parts = [];
  if (groups.set1.length) {
    parts.push(
      opener
        ? `Set 1 opened with ${opener} (${groups.set1.length} songs)`
        : `Set 1 ran ${groups.set1.length} songs`,
    );
  }
  if (groups.set2.length) {
    parts.push(`Set 2 added ${groups.set2.length}`);
  }
  if (groups.encore.length) {
    parts.push(
      encoreTitle
        ? `encore closed on ${encoreTitle}`
        : `${groups.encore.length}-song encore`,
    );
  }
  if (parts.length === 0) return "";
  const joined = parts.join("; ");
  return joined.charAt(0).toUpperCase() + joined.slice(1) + ".";
}

/**
 * Bustout titles with gaps from Phish.net rows (gap ≥ BUSTOUT_MIN_GAP).
 * @param {{ title: string, gap?: number | null }[]} rows
 * @param {number} [minGap=30]
 * @returns {{ title: string, gap: number | null }[]}
 */
function bustoutEntriesFromRows(rows, minGap = 30) {
  const seen = new Set();
  /** @type {{ title: string, gap: number | null }[]} */
  const out = [];
  for (const row of rows || []) {
    if (!row || typeof row.title !== "string") continue;
    const title = row.title.trim();
    if (!title) continue;
    const gap =
      typeof row.gap === "number" && Number.isFinite(row.gap)
        ? Math.trunc(row.gap)
        : null;
    if (gap == null || gap < minGap) continue;
    const norm = title.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push({ title, gap });
  }
  return out;
}

/**
 * @param {{ title: string, gap?: number | null }[]} entries
 * @returns {string}
 */
function formatBustoutSongGap(entries) {
  const list = (entries || []).filter((e) => e && e.title);
  if (!list.length) return "";
  return list
    .map((e) =>
      e.gap != null && Number.isFinite(e.gap)
        ? `${e.title} - ${e.gap} show gap`
        : e.title,
    )
    .join(", ");
}

/**
 * One-liner highlight for push / Tonight block.
 * @param {{
 *   bustoutTitles: string[],
 *   bustoutEntries?: { title: string, gap?: number | null }[],
 *   tourDebuts: string[],
 *   openerTitle: string,
 *   encoreTitle: string,
 * }} input
 * @returns {string}
 */
function composeSetlistHighlight({
  bustoutTitles,
  bustoutEntries,
  tourDebuts,
  openerTitle,
  encoreTitle,
}) {
  const entries =
    Array.isArray(bustoutEntries) && bustoutEntries.length
      ? bustoutEntries
      : (bustoutTitles || []).map((title) => ({ title, gap: null }));
  const bustoutLine = formatBustoutSongGap(entries);
  if (bustoutLine) {
    return entries.length === 1 ? bustoutLine : `Bustouts: ${bustoutLine}.`;
  }
  if (tourDebuts.length >= 3) {
    return `${tourDebuts.length} songs new to this tour — including ${tourDebuts[0]}.`;
  }
  if (tourDebuts.length === 1 || tourDebuts.length === 2) {
    return `Tour debut${tourDebuts.length > 1 ? "s" : ""}: ${tourDebuts.join(", ")}.`;
  }
  if (openerTitle && encoreTitle) {
    return `${openerTitle} opened; ${encoreTitle} closed the night.`;
  }
  if (openerTitle) return `${openerTitle} opened the night.`;
  if (encoreTitle) return `Encore: ${encoreTitle}.`;
  return "";
}

/**
 * @param {{ bustoutTitles: string[], tourDebuts: string[], groups: { set2: string[], encore: string[] } }} input
 * @returns {string[]}
 */
function deriveShowMomentTags({ bustoutTitles, tourDebuts, groups }) {
  /** @type {string[]} */
  const tags = [];
  if (bustoutTitles.length) tags.push("bustout");
  if (tourDebuts.length) tags.push("tour_debut");
  if (groups.encore.length >= 2) tags.push("multi_encore");
  if (groups.set2.length === 0 && groups.encore.length > 0) tags.push("short_main");
  return tags;
}

/**
 * Build the persisted / payload-ready show context artifact.
 * @param {{
 *   showDate: string,
 *   setlistDoc: Record<string, unknown> | null | undefined,
 *   priorTourSetlistDocs?: Array<Record<string, unknown> | null | undefined>,
 *   tourKey?: string | null,
 * }} input
 */
function buildCommsShowContext({
  showDate,
  setlistDoc,
  priorTourSetlistDocs = [],
  tourKey = null,
  /** @type {{ title: string, gap?: number | null }[] | null} */
  bustoutEntries = null,
  /** @type {{ title: string, gap?: number | null }[] | null} */
  phishnetRows = null,
}) {
  const slotMap =
    setlistDoc?.setlist && typeof setlistDoc.setlist === "object"
      ? setlistDoc.setlist
      : {};
  const normalizedDoc = {
    ...(setlistDoc || {}),
    s1o: trimTitle(setlistDoc?.s1o) || trimTitle(slotMap.s1o),
    s2o: trimTitle(setlistDoc?.s2o) || trimTitle(slotMap.s2o),
    enc: trimTitle(setlistDoc?.enc) || trimTitle(slotMap.enc),
  };

  const groups = groupOfficialSetlistBySet(normalizedDoc);

  const openerTitle =
    trimTitle(normalizedDoc.s1o) || (groups.set1[0] ? groups.set1[0] : "");
  const encoreTitle =
    trimTitle(normalizedDoc.enc) ||
    (groups.encore[0] ? groups.encore[0] : "");

  const bustoutTitles = bustoutTitlesFromDoc(normalizedDoc);
  /** @type {{ title: string, gap: number | null }[]} */
  let entries = Array.isArray(bustoutEntries) ? bustoutEntries.filter((e) => e?.title) : [];
  if (!entries.length && Array.isArray(phishnetRows)) {
    entries = bustoutEntriesFromRows(phishnetRows);
  }
  if (!entries.length && bustoutTitles.length) {
    entries = bustoutTitles.map((title) => ({ title, gap: null }));
  }
  // Prefer titles from entries when present
  const titlesFromEntries = entries.map((e) => e.title);
  const resolvedBustoutTitles = titlesFromEntries.length
    ? titlesFromEntries
    : bustoutTitles;

  const tourDebuts = tourDebutTitles(normalizedDoc, priorTourSetlistDocs);
  const set_flow_summary = composeSetFlowSummary(groups, openerTitle, encoreTitle);
  const setlist_highlight = composeSetlistHighlight({
    bustoutTitles: resolvedBustoutTitles,
    bustoutEntries: entries,
    tourDebuts,
    openerTitle,
    encoreTitle,
  });
  const show_moment_tags = deriveShowMomentTags({
    bustoutTitles: resolvedBustoutTitles,
    tourDebuts,
    groups,
  });

  return {
    showDate,
    tourKey: tourKey || null,
    opener_title: openerTitle || null,
    encore_title: encoreTitle || null,
    bustout_titles: resolvedBustoutTitles,
    bustout_entries: entries,
    tour_debut_titles: tourDebuts,
    set_flow_summary: set_flow_summary || null,
    setlist_highlight: setlist_highlight || null,
    show_moment_tags,
    set_counts: {
      set1: groups.set1.length,
      set2: groups.set2.length,
      encore: groups.encore.length,
    },
    schemaVersion: 1,
  };
}

/**
 * Fields merged into comms payloads (show-level).
 * @param {Record<string, unknown> | null | undefined} context
 */
function showLevelPayloadFields(context) {
  if (!context || typeof context !== "object") return {};
  return {
    setlist_highlight: context.setlist_highlight || null,
    set_flow_summary: context.set_flow_summary || null,
    bustout_titles: Array.isArray(context.bustout_titles)
      ? context.bustout_titles
      : [],
    bustout_entries: Array.isArray(context.bustout_entries)
      ? context.bustout_entries
      : [],
    tour_debut_titles: Array.isArray(context.tour_debut_titles)
      ? context.tour_debut_titles
      : [],
    opener_title: context.opener_title || null,
    encore_title: context.encore_title || null,
    show_moment_tags: Array.isArray(context.show_moment_tags)
      ? context.show_moment_tags
      : [],
  };
}

module.exports = {
  groupOfficialSetlistBySet,
  bustoutTitlesFromDoc,
  bustoutEntriesFromRows,
  formatBustoutSongGap,
  tonightTitles,
  priorTourTitleSet,
  tourDebutTitles,
  composeSetFlowSummary,
  composeSetlistHighlight,
  deriveShowMomentTags,
  buildCommsShowContext,
  showLevelPayloadFields,
};
