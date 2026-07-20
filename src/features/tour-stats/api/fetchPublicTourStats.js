import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';

/**
 * @typedef {{
 *   tourSlug: string,
 *   tourLabel: string,
 *   lastShowDate?: string | null,
 *   firstShowDate?: string | null,
 *   showCount?: number,
 * }} PublicTourIndexEntry
 */

/**
 * @returns {Promise<{
 *   tours: PublicTourIndexEntry[],
 *   defaultTourSlug: string,
 * }>}
 */
export async function fetchPublicTourStatsIndex() {
  const snap = await getDoc(doc(db, 'public_tour_stats', '_index'));
  if (!snap.exists()) {
    return { tours: [], defaultTourSlug: '2026-sphere' };
  }
  const data = snap.data() || {};
  const tours = Array.isArray(data.tours) ? data.tours : [];
  const defaultTourSlug =
    typeof data.defaultTourSlug === 'string' && data.defaultTourSlug
      ? data.defaultTourSlug
      : '2026-sphere';
  return { tours, defaultTourSlug };
}

/**
 * @param {string} tourSlug
 * @returns {Promise<null | Record<string, unknown>>}
 */
export async function fetchPublicTourStatsDoc(tourSlug) {
  const slug = String(tourSlug ?? '').trim();
  if (!slug || slug.startsWith('_')) return null;
  const snap = await getDoc(doc(db, 'public_tour_stats', slug));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Fallback if `_index` is missing: list non-index docs (bounded).
 * @returns {Promise<PublicTourIndexEntry[]>}
 */
export async function listPublicTourStatsDocs() {
  const q = query(collection(db, 'public_tour_stats'), where('schemaVersion', '==', 1));
  const snap = await getDocs(q);
  return snap.docs
    .filter((d) => d.id !== '_index')
    .map((d) => {
      const data = d.data() || {};
      return {
        tourSlug: d.id,
        tourLabel: typeof data.tourLabel === 'string' ? data.tourLabel : d.id,
        lastShowDate: data.lastShowDate ?? null,
        firstShowDate: data.firstShowDate ?? null,
        showCount: data.tourShowCount ?? data.showCount ?? null,
      };
    });
}
