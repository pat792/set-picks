import { arrayRemove, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';

import { SHOW_DATES } from '../../../shared/data/showDates';
import { db } from '../../../shared/lib/firebase';

/** @type {number} */
export const POOL_NAME_MAX_LENGTH = 80;

function pickDocId(showDate, userId) {
  return `${showDate}_${userId}`;
}

function hasNonEmptyPicksObject(picks) {
  if (picks == null || typeof picks !== 'object' || Array.isArray(picks)) {
    return false;
  }
  return Object.values(picks).some(
    (v) => v != null && String(v).trim() !== ''
  );
}

/**
 * Whether a pick document should count toward this pool (snapshot or legacy).
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

/**
 * Pool season totals / wins: finalized (rollup) only, with submitted picks.
 * Do not use gradedAt — live CF scoring must not imply season eligibility.
 */
function pickCountsTowardPoolSeasonTotals(pickData) {
  if (pickData.isGraded !== true) return false;
  return hasNonEmptyPicksObject(pickData.picks);
}

function pickDocHasPoolActivity(pickData, poolId) {
  if (!pickDataCountsForPool(pickData, poolId)) return false;
  if (hasNonEmptyPicksObject(pickData.picks)) return true;
  if (pickData.isGraded === true) return true;
  if (typeof pickData.score === 'number' && pickData.score > 0) return true;
  return false;
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

/**
 * @returns {Promise<boolean>}
 */
export async function poolHasPickActivityApi(poolId, memberIds) {
  const pid = poolId?.trim();
  const members = Array.isArray(memberIds) ? memberIds.filter(Boolean) : [];
  if (!pid || members.length === 0) return false;

  const dates = SHOW_DATES.map((s) => s.date);
  const chunkSize = 24;
  const tasks = [];
  for (const showDate of dates) {
    for (const userId of members) {
      tasks.push({ showDate, userId });
    }
  }

  for (let i = 0; i < tasks.length; i += chunkSize) {
    const slice = tasks.slice(i, i + chunkSize);
    const snaps = await Promise.all(
      slice.map(({ showDate, userId }) =>
        getDoc(doc(db, 'picks', pickDocId(showDate, userId)))
      )
    );
    for (let j = 0; j < snaps.length; j += 1) {
      const snap = snaps[j];
      if (!snap.exists()) continue;
      if (pickDocHasPoolActivity(snap.data(), pid)) return true;
    }
  }
  return false;
}

/**
 * Deletes the pool doc and removes the pool id from the owner’s `users.pools` only.
 * Multi-member pools cannot be fully cleaned up from the client without a Cloud Function
 * (Firestore rules keep user updates owner-scoped).
 */
export async function deleteOwnerOnlyEmptyPoolApi(poolId, ownerId) {
  const pid = poolId?.trim();
  const uid = ownerId?.trim();
  if (!pid || !uid) throw new Error('Missing pool or owner id.');

  const batch = writeBatch(db);
  batch.set(
    doc(db, 'users', uid),
    { pools: arrayRemove(pid) },
    { merge: true }
  );
  batch.delete(doc(db, 'pools', pid));
  await batch.commit();
}

/**
 * @param {string} ownerId — pool.ownerId (creator)
 */
export async function deletePoolApi(poolId, memberIds, ownerId) {
  const pid = poolId?.trim();
  const oid = ownerId?.trim();
  const members = Array.isArray(memberIds) ? memberIds.filter(Boolean) : [];
  if (!pid) throw new Error('Missing pool id.');
  if (!oid) throw new Error('Missing pool owner id.');

  const unique = [...new Set(members)];
  if (unique.length !== 1 || unique[0] !== oid) {
    const err = new Error(
      'You can only delete a pool that has no other members. Ask others to leave, or archive the pool.'
    );
    err.code = 'pool-has-members';
    throw err;
  }

  const active = await poolHasPickActivityApi(pid, unique);
  if (active) {
    const err = new Error(
      'This pool has pick history. Archive it instead of deleting.'
    );
    err.code = 'pool-has-activity';
    throw err;
  }

  await deleteOwnerOnlyEmptyPoolApi(pid, oid);
}

/**
 * @param {string} poolId
 * @param {string[]} memberIds
 * @returns {Promise<Map<string, { totalScore: number, showsPlayed: number, wins: number }>>}
 */
export async function computePoolSeasonTotalsByUser(poolId, memberIds) {
  const pid = poolId?.trim();
  const members = Array.isArray(memberIds) ? memberIds.filter(Boolean) : [];
  const totals = new Map();
  for (const uid of members) {
    totals.set(uid, { totalScore: 0, showsPlayed: 0, wins: 0 });
  }
  if (!pid || members.length === 0) return totals;

  const dates = SHOW_DATES.map((s) => s.date);
  const chunkSize = 24;

  /** @type {Map<string, Array<{ userId: string, score: number }>>} */
  const byShow = new Map();

  const tasks = [];
  for (const showDate of dates) {
    for (const userId of members) {
      tasks.push({ showDate, userId });
    }
  }

  for (let i = 0; i < tasks.length; i += chunkSize) {
    const slice = tasks.slice(i, i + chunkSize);
    const snaps = await Promise.all(
      slice.map(({ showDate, userId }) =>
        getDoc(doc(db, 'picks', pickDocId(showDate, userId)))
      )
    );
    for (let j = 0; j < slice.length; j += 1) {
      const snap = snaps[j];
      const { showDate, userId } = slice[j];
      if (!snap.exists()) continue;
      const data = snap.data();
      if (!pickDataCountsForPool(data, pid)) continue;
      if (!pickCountsTowardPoolSeasonTotals(data)) continue;
      const score = typeof data.score === 'number' ? data.score : 0;
      const row = totals.get(userId);
      if (row) {
        row.totalScore += score;
        row.showsPlayed += 1;
      }
      const list = byShow.get(showDate) || [];
      list.push({ userId, score });
      byShow.set(showDate, list);
    }
  }

  for (const [, list] of byShow) {
    if (list.length === 0) continue;
    const max = Math.max(...list.map((x) => x.score));
    if (max === 0) continue;
    const winners = list.filter((x) => x.score === max).map((x) => x.userId);
    for (const uid of winners) {
      const row = totals.get(uid);
      if (row) row.wins += 1;
    }
  }

  return totals;
}

/**
 * Past scheduled show dates (chronological), for "shows in pool season" denominator.
 * @param {string} todayYmd
 * @returns {string[]}
 */
export function pastScheduledShowDates(todayYmd) {
  return SHOW_DATES.map((s) => s.date).filter((d) => d < todayYmd);
}
