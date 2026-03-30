import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';

export async function fetchPoolById(poolId) {
  const trimmed = poolId?.trim();
  if (!trimmed) return null;

  const poolSnap = await getDoc(doc(db, 'pools', trimmed));
  if (!poolSnap.exists()) return null;

  return { id: poolSnap.id, ...poolSnap.data() };
}

/**
 * Loads member profiles for a pool via users where `pools` array-contains poolId.
 * Results are sorted by totalPoints descending.
 */
export async function fetchPoolMemberProfiles(poolId) {
  const trimmed = poolId?.trim();
  if (!trimmed) return [];

  let rows = [];
  try {
    const q = query(
      collection(db, 'users'),
      where('pools', 'array-contains', trimmed)
    );
    const snap = await getDocs(q);
    rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Pool hub: users pools query failed:', e);
  }

  rows.sort(
    (a, b) =>
      (typeof b.totalPoints === 'number' ? b.totalPoints : 0) -
      (typeof a.totalPoints === 'number' ? a.totalPoints : 0)
  );
  return rows;
}
