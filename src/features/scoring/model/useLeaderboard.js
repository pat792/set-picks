import { useMemo, useState } from 'react';
import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import { calculateTotalScore } from '../../../shared/utils/scoring';

/**
 * @param {Record<string, unknown> | null | undefined} pickEntry
 * @returns {Record<string, unknown>}
 */
export function getPickPayloadFromEntry(pickEntry) {
  if (pickEntry?.picks && typeof pickEntry.picks === 'object') {
    return pickEntry.picks;
  }

  return FORM_FIELDS.reduce((acc, field) => {
    acc[field.id] = pickEntry?.[field.id] || '';
    return acc;
  }, {});
}

/**
 * Pull the signed-in user's row to rank 1 pre-grade (#255). Once
 * `actualSetlist` arrives, scores drive ordering and the row falls into
 * its natural rank. Non-mutating; leaves relative order of the rest.
 *
 * @template {{ userId?: string, uid?: string }} T
 * @param {T[]} rows
 * @param {string | null | undefined} selfUserId
 * @returns {T[]}
 */
export function pinSelfToTop(rows, selfUserId) {
  if (!selfUserId || !Array.isArray(rows) || rows.length === 0) return rows;
  const idx = rows.findIndex((row) => (row?.userId || row?.uid) === selfUserId);
  if (idx <= 0) return rows;
  const next = rows.slice();
  const [self] = next.splice(idx, 1);
  next.unshift(self);
  return next;
}

/**
 * Same ordering as the Standings leaderboard (score sort + pre-grade self pin).
 *
 * @template {{ userId?: string, uid?: string }} T
 * @param {T[]} poolPicks
 * @param {unknown[] | null} actualSetlist
 * @param {string | null | undefined} selfUserId
 * @returns {T[]}
 */
export function sortPicksForLeaderboard(poolPicks, actualSetlist, selfUserId) {
  const byScore = [...poolPicks].sort((a, b) => {
    const scoreA = calculateTotalScore(getPickPayloadFromEntry(a), actualSetlist);
    const scoreB = calculateTotalScore(getPickPayloadFromEntry(b), actualSetlist);
    return scoreB - scoreA;
  });
  if (!actualSetlist && selfUserId) {
    return pinSelfToTop(byScore, selfUserId);
  }
  return byScore;
}

/**
 * @param {Array<Record<string, unknown>>} poolPicks
 * @param {unknown[] | null} actualSetlist
 * @param {{ selfUserId?: string | null }} [options]
 */
export function useLeaderboard(poolPicks = [], actualSetlist = null, options = {}) {
  const { selfUserId = null } = options;
  const [expandedUser, setExpandedUser] = useState(null);

  const getPickPayload = getPickPayloadFromEntry;

  const sortedPicks = useMemo(
    () => sortPicksForLeaderboard(poolPicks, actualSetlist, selfUserId),
    [poolPicks, actualSetlist, selfUserId]
  );

  const toggleUserExpansion = (userId) => {
    setExpandedUser((prev) => (prev === userId ? null : userId));
  };

  return {
    sortedPicks,
    getPickPayload,
    expandedUser,
    toggleUserExpansion,
  };
}
