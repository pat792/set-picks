import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';
import { MAX_POOL_MEMBERS_FETCH } from './poolReadLimits';

export { MAX_POOL_MEMBERS_FETCH, MAX_USER_POOLS_FETCH } from './poolReadLimits';

export async function fetchPoolById(poolId) {
  const trimmed = poolId?.trim();
  if (!trimmed) return null;

  const poolSnap = await getDoc(doc(db, 'pools', trimmed));
  if (!poolSnap.exists()) return null;

  return { id: poolSnap.id, ...poolSnap.data() };
}

/**
 * Load member profiles for a pool, capped at {@link MAX_POOL_MEMBERS_FETCH}.
 *
 * Prefer `memberIds` from the pool document (`members` array) so we only read
 * known members (O(members)) instead of an unbounded `users` collection query.
 *
 * @param {string} poolId
 * @param {{ memberIds?: string[], maxMembers?: number }} [options]
 */
export async function fetchPoolMemberProfiles(poolId, options = {}) {
  const trimmed = poolId?.trim();
  if (!trimmed) return [];

  const maxMembers =
    typeof options.maxMembers === 'number' && options.maxMembers > 0
      ? options.maxMembers
      : MAX_POOL_MEMBERS_FETCH;

  const memberIds = Array.isArray(options.memberIds)
    ? options.memberIds.map((id) => String(id || '').trim()).filter(Boolean)
    : null;

  let rows = [];
  try {
    if (memberIds && memberIds.length > 0) {
      const cappedIds = memberIds.slice(0, maxMembers);
      const snaps = await Promise.all(
        cappedIds.map((uid) => getDoc(doc(db, 'users', uid)))
      );
      rows = snaps.map((snap, i) => {
        if (!snap.exists()) return { id: cappedIds[i] };
        return { id: snap.id, ...snap.data() };
      });
    } else {
      const q = query(
        collection(db, 'users'),
        where('pools', 'array-contains', trimmed),
        limit(maxMembers)
      );
      const snap = await getDocs(q);
      rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  } catch (e) {
    console.error('Pool hub: member profiles query failed:', e);
  }

  rows.sort(
    (a, b) =>
      (typeof b.totalPoints === 'number' ? b.totalPoints : 0) -
      (typeof a.totalPoints === 'number' ? a.totalPoints : 0)
  );
  return rows;
}
