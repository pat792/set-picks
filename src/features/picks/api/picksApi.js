import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
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
export async function fetchPickDoc(selectedDate, userId) {
  if (!userId || !selectedDate) return {};

  const pickId = getPickDocumentId(selectedDate, userId);
  const docSnap = await getDoc(doc(db, 'picks', pickId));

  if (!docSnap.exists()) return {};
  return docSnap.data().picks ?? {};
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
