import { doc, updateDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';

/** @type {number} */
export const POOL_NAME_MAX_LENGTH = 80;

/**
 * Whether a pick document should count toward this pool (snapshot or legacy).
 *
 * Pool standings, the active-show pool view, and the server-side pool
 * delete path all gate inclusion on `pick.pools` (the snapshot of which
 * pools the author belonged to at pick-save time). After pool **create**
 * or **join**, `arrayUnionPoolOntoUserPickDocs` (picks API) merges the
 * pool into that user's existing pick docs for the season calendar so
 * pre-create / pre-join graded picks count for that pool.
 *
 * Legacy fallback: pick docs written before snapshots were introduced
 * (no `pools` field, or `pools: []`) count for every pool the user is
 * currently a member of — there is no other signal available for those
 * rows.
 *
 * @param {Record<string, unknown>} pickData
 * @param {string} poolId
 */
export function pickDataCountsForPool(pickData, poolId) {
  if (!poolId?.trim() || !pickData) return false;
  const pools = pickData.pools;
  if (Array.isArray(pools) && pools.length > 0) {
    return pools.some((p) => p && p.id === poolId);
  }
  return true;
}

export async function updatePoolNameApi(poolId, newName) {
  const trimmed = newName?.trim() ?? '';
  if (!poolId?.trim()) throw new Error('Missing pool id.');
  if (!trimmed) throw new Error('Pool name is required.');
  if (trimmed.length > POOL_NAME_MAX_LENGTH) {
    throw new Error(`Pool name must be at most ${POOL_NAME_MAX_LENGTH} characters.`);
  }
  await updateDoc(doc(db, 'pools', poolId.trim()), { name: trimmed });
}

/**
 * @param {string} poolId
 * @param {'active' | 'archived'} status
 */
export async function updatePoolStatusApi(poolId, status) {
  if (!poolId?.trim()) throw new Error('Missing pool id.');
  if (status !== 'active' && status !== 'archived') {
    throw new Error('Invalid pool status.');
  }
  await updateDoc(doc(db, 'pools', poolId.trim()), { status });
}

