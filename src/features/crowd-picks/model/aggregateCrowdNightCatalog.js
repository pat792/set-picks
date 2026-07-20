import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import { debutYearFromCatalogDebut } from '../../profile';
import { hasNonEmptyPicksObject } from '../../../shared/utils/showAggregation';

const SLOT_IDS = FORM_FIELDS.map((f) => f.id);

/**
 * @param {unknown} gap
 * @returns {number | null}
 */
export function parseCatalogGap(gap) {
  if (typeof gap === 'number' && Number.isFinite(gap) && gap >= 0) {
    return Math.trunc(gap);
  }
  if (typeof gap !== 'string') return null;
  const t = gap.trim();
  if (!t || t === '—' || t === '-') return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

/**
 * @param {{ name?: unknown, gap?: unknown, debut?: unknown }[] | null | undefined} songs
 * @returns {{
 *   gapByName: Map<string, number>,
 *   debutYearByName: Map<string, number>,
 * }}
 */
export function buildCatalogLookups(songs) {
  /** @type {Map<string, number>} */
  const gapByName = new Map();
  /** @type {Map<string, number>} */
  const debutYearByName = new Map();
  if (!Array.isArray(songs)) return { gapByName, debutYearByName };
  for (const song of songs) {
    const name =
      typeof song?.name === 'string' ? song.name.trim().toLowerCase() : '';
    if (!name) continue;
    if (!gapByName.has(name)) {
      const g = parseCatalogGap(song?.gap);
      if (g != null) gapByName.set(name, g);
    }
    if (!debutYearByName.has(name)) {
      const y = debutYearFromCatalogDebut(song?.debut);
      if (y != null) debutYearByName.set(name, y);
    }
  }
  return { gapByName, debutYearByName };
}

/**
 * Highest-gap songs among tonight's picked titles (C2 / #691).
 *
 * @param {Array<{ title: string, cardCount: number }>} songRows
 * @param {Map<string, number> | Record<string, number> | null | undefined} gapByName
 * @param {{ topN?: number }} [options]
 */
export function rankCrowdNightByGap(songRows, gapByName, options = {}) {
  const topN =
    typeof options.topN === 'number' && options.topN > 0
      ? Math.trunc(options.topN)
      : 10;
  const lookup =
    gapByName instanceof Map
      ? (k) => gapByName.get(k)
      : gapByName && typeof gapByName === 'object'
        ? (k) => gapByName[k]
        : () => undefined;

  const ranked = [];
  for (const row of Array.isArray(songRows) ? songRows : []) {
    const title = typeof row?.title === 'string' ? row.title.trim() : '';
    if (!title) continue;
    const gap = lookup(title.toLowerCase());
    if (typeof gap !== 'number' || !Number.isFinite(gap)) continue;
    ranked.push({
      title,
      gap,
      cardCount: typeof row.cardCount === 'number' ? row.cardCount : 0,
    });
  }
  ranked.sort(
    (a, b) =>
      b.gap - a.gap ||
      b.cardCount - a.cardCount ||
      a.title.localeCompare(b.title)
  );
  return ranked.slice(0, topN);
}

/**
 * Slot-weighted mean debut year across all filled slots (C2 / #691 locked).
 *
 * @param {Array<Record<string, unknown>> | null | undefined} submittedDocs
 * @param {Map<string, number> | Record<string, number> | null | undefined} debutYearByName
 */
export function computeSlotWeightedVintage(submittedDocs, debutYearByName) {
  const lookup =
    debutYearByName instanceof Map
      ? (k) => debutYearByName.get(k)
      : debutYearByName && typeof debutYearByName === 'object'
        ? (k) => debutYearByName[k]
        : () => undefined;

  let sum = 0;
  let datedSlots = 0;
  let totalSlots = 0;
  const years = [];

  for (const doc of Array.isArray(submittedDocs) ? submittedDocs : []) {
    if (!hasNonEmptyPicksObject(doc?.picks)) continue;
    const slots =
      doc.picks && typeof doc.picks === 'object' && !Array.isArray(doc.picks)
        ? doc.picks
        : {};
    for (const slotId of SLOT_IDS) {
      const raw = slots[slotId];
      if (typeof raw !== 'string' || !raw.trim()) continue;
      totalSlots += 1;
      const year = lookup(raw.trim().toLowerCase());
      if (typeof year === 'number' && Number.isFinite(year)) {
        sum += year;
        datedSlots += 1;
        years.push(year);
      }
    }
  }

  years.sort((a, b) => a - b);
  let medianYear = null;
  if (years.length) {
    const mid = Math.floor(years.length / 2);
    medianYear =
      years.length % 2 === 1
        ? years[mid]
        : (years[mid - 1] + years[mid]) / 2;
  }

  return {
    avgYear:
      datedSlots > 0 ? Math.round((1000 * sum) / datedSlots) / 1000 : null,
    medianYear,
    datedSlots,
    totalSlots,
    coveragePct:
      totalSlots > 0
        ? Math.round((1000 * datedSlots) / totalSlots) / 10
        : 0,
  };
}

/**
 * @param {import('./aggregateCrowdNightSongs').CrowdNightSongStats} nightStats
 * @param {{ name?: unknown, gap?: unknown, debut?: unknown }[] | null | undefined} catalogSongs
 * @param {{ gapTopN?: number }} [options]
 */
export function aggregateCrowdNightCatalog(nightStats, catalogSongs, options = {}) {
  const { gapByName, debutYearByName } = buildCatalogLookups(catalogSongs);
  const gapTopN =
    typeof options.gapTopN === 'number' && options.gapTopN > 0
      ? Math.trunc(options.gapTopN)
      : 10;
  return {
    highestGap: rankCrowdNightByGap(nightStats?.songs, gapByName, {
      topN: gapTopN,
    }),
    vintage: computeSlotWeightedVintage(
      nightStats?.submittedDocs,
      debutYearByName
    ),
  };
}
