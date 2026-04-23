import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';
import { pickCountsTowardSeason } from '../../../shared/utils/showAggregation';

/** @type {number} */
export const POOL_NAME_MAX_LENGTH = 80;

function pickDocId(showDate, userId) {
  return `${showDate}_${userId}`;
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
 * @param {string} poolId
 * @param {string[]} memberIds
 * @param {{ date: string }[]} showDates
 * @returns {Promise<Map<string, { totalScore: number, showsPlayed: number, wins: number }>>}
 */
export async function computePoolSeasonTotalsByUser(poolId, memberIds, showDates) {
  const pid = poolId?.trim();
  const members = Array.isArray(memberIds) ? memberIds.filter(Boolean) : [];
  const totals = new Map();
  for (const uid of members) {
    totals.set(uid, { totalScore: 0, showsPlayed: 0, wins: 0 });
  }
  if (!pid || members.length === 0) return totals;
  if (!Array.isArray(showDates) || showDates.length === 0) return totals;

  const dates = showDates.map((s) => s.date);
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
      if (!pickCountsTowardSeason(data)) continue;
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
 * @param {{ date: string }[]} showDates
 * @returns {string[]}
 */
export function pastScheduledShowDates(todayYmd, showDates) {
  if (!Array.isArray(showDates) || showDates.length === 0) return [];
  return showDates.map((s) => s.date).filter((d) => d < todayYmd);
}
