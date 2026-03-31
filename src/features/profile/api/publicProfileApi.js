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

/**
 * Read-only public profile by Firebase uid (`users/{uid}`).
 * @returns {Promise<object|null>} Document data or null if missing / invalid id.
 */
export async function fetchPublicProfileByUid(uid) {
  const id = uid?.trim();
  if (!id) return null;
  const snap = await getDoc(doc(db, 'users', id));
  if (!snap.exists()) return null;
  return snap.data();
}

/**
 * Resolve a public profile by exact display handle (first match).
 * @returns {Promise<{ uid: string } & object | null>}
 */
export async function fetchPublicProfileByHandle(handle) {
  const h = handle?.trim();
  if (!h) return null;
  const q = query(
    collection(db, 'users'),
    where('handle', '==', h),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { uid: docSnap.id, ...docSnap.data() };
}

/**
 * Pools that list this uid in `members`.
 */
export async function fetchPoolsForMember(uid) {
  const id = uid?.trim();
  if (!id) return [];
  const poolsQuery = query(
    collection(db, 'pools'),
    where('members', 'array-contains', id)
  );
  const poolSnapshot = await getDocs(poolsQuery);
  return poolSnapshot.docs.map((poolDoc) => ({
    id: poolDoc.id,
    ...poolDoc.data(),
  }));
}
