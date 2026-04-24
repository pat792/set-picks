import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';

/** Firestore rejects `undefined` anywhere in document data; strip from shallow objects. */
function omitUndefinedShallow(record) {
  return Object.fromEntries(
    Object.entries(record || {}).filter(([, v]) => v !== undefined)
  );
}

export function getPickDocumentId(selectedDate, userId) {
  return `${selectedDate}_${userId}`;
}

/**
 * Load the user's pick map for a show (field id → song string).
 */
function hasNonEmptyPicksObject(picks) {
  if (picks == null || typeof picks !== 'object' || Array.isArray(picks)) {
    return false;
  }
  return Object.values(picks).some(
    (v) => v != null && String(v).trim() !== ''
  );
}

export async function fetchPickDoc(selectedDate, userId) {
  if (!userId || !selectedDate) return {};

  const pickId = getPickDocumentId(selectedDate, userId);
  const docSnap = await getDoc(doc(db, 'picks', pickId));

  if (!docSnap.exists()) return {};
  return docSnap.data().picks ?? {};
}

/**
 * True when the pick document exists for this show/user and `picks` has at least one non-empty value.
 * (Unlike {@link fetchPickDoc}, distinguishes missing doc from empty picks map.)
 */
export async function hasSubmittedPicksForShow(selectedDate, userId) {
  if (!userId || !selectedDate) return false;

  const pickId = getPickDocumentId(selectedDate, userId);
  const docSnap = await getDoc(doc(db, 'picks', pickId));

  if (!docSnap.exists()) return false;
  return hasNonEmptyPicksObject(docSnap.data().picks);
}

/**
 * Resolve display handle: users/{uid}.handle, else auth fallbacks.
 */
export async function resolveHandleForPicks(userId, user) {
  let handle = user?.displayName || user?.email?.split('@')[0] || 'Anonymous';

  const userSnap = await getDoc(doc(db, 'users', userId));
  if (userSnap.exists() && userSnap.data().handle) {
    handle = userSnap.data().handle;
  }

  return handle;
}

/**
 * Pools the user belongs to, stored on the pick doc for snapshotting.
 */
export async function fetchPoolsSnapshotForPick(userId) {
  if (!userId) return [];

  const poolsQuery = query(
    collection(db, 'pools'),
    where('members', 'array-contains', userId)
  );
  const poolSnapshot = await getDocs(poolsQuery);

  return poolSnapshot.docs.map((poolDoc) => ({
    id: poolDoc.id,
    name: poolDoc.data().name,
  }));
}

const BACKFILL_READ_CHUNK = 40;
const BACKFILL_BATCH_MAX = 400;

/**
 * Normalize calendar entries to `YYYY-MM-DD` strings.
 * @param {Array<string | { date?: string }> | null | undefined} showDates
 * @returns {string[]}
 */
function normalizeCalendarDates(showDates) {
  if (!Array.isArray(showDates)) return [];
  return showDates
    .map((s) =>
      typeof s === 'string' ? s.trim() : String(s?.date ?? '').trim()
    )
    .filter(Boolean);
}

/**
 * After creating or joining a pool, merge `{ id, name }` into `pools` on every
 * existing pick doc for this user across the season calendar. Idempotent via
 * {@link arrayUnion}. Picks saved before the pool existed otherwise stay
 * invisible to `pickDataCountsForPool` / pool standings.
 *
 * Failures are swallowed by callers (pool membership still succeeds); this
 * only repairs snapshot alignment.
 *
 * @param {string} userId
 * @param {{ id: string, name?: string }} pool
 * @param {Array<string | { date?: string }> | null | undefined} showDates
 */
export async function arrayUnionPoolOntoUserPickDocs(userId, pool, showDates) {
  const uid = userId?.trim();
  const pid = pool?.id?.trim();
  if (!uid || !pid) return;

  const dates = normalizeCalendarDates(showDates);
  if (dates.length === 0) return;

  const poolEntry = { id: pid, name: pool.name?.trim() ?? '' };

  for (let i = 0; i < dates.length; i += BACKFILL_READ_CHUNK) {
    const chunkDates = dates.slice(i, i + BACKFILL_READ_CHUNK);
    const snaps = await Promise.all(
      chunkDates.map((d) =>
        getDoc(doc(db, 'picks', getPickDocumentId(d, uid)))
      )
    );

    let batch = writeBatch(db);
    let pending = 0;

    const flush = async () => {
      if (pending === 0) return;
      await batch.commit();
      batch = writeBatch(db);
      pending = 0;
    };

    for (let j = 0; j < snaps.length; j += 1) {
      if (!snaps[j].exists()) continue;
      const ref = doc(db, 'picks', getPickDocumentId(chunkDates[j], uid));
      batch.update(ref, { pools: arrayUnion(poolEntry) });
      pending += 1;
      if (pending >= BACKFILL_BATCH_MAX) {
        await flush();
      }
    }
    await flush();
  }
}

/**
 * Write or replace the pick document for this user + show.
 */
export async function savePickDoc({
  userId,
  selectedDate,
  picks,
  handle,
  pools,
}) {
  const pickId = getPickDocumentId(selectedDate, userId);

  const safePicks = omitUndefinedShallow(picks);
  const safePools = (pools || []).map((p) => ({
    id: p.id,
    name: p.name ?? '',
  }));

  await setDoc(doc(db, 'picks', pickId), {
    userId,
    handle: handle ?? 'Anonymous',
    showDate: selectedDate,
    updatedAt: new Date().toISOString(),
    score: 0,
    isGraded: false,
    picks: safePicks,
    pools: safePools,
  });
}
