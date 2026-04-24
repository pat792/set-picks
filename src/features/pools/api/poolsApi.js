import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

import { arrayUnionPoolOntoUserPickDocs } from '../../picks';
import { db } from '../../../shared/lib/firebase';

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function fetchPools(userId) {
  if (!userId) return [];

  const poolsQuery = query(
    collection(db, 'pools'),
    where('members', 'array-contains', userId)
  );
  const snapshot = await getDocs(poolsQuery);

  return snapshot.docs
    .map((poolDoc) => ({
      id: poolDoc.id,
      ...poolDoc.data(),
    }))
    .filter((p) => p.status !== 'archived');
}

/**
 * @param {{ userId: string, name: string, showDates?: Array<string | { date?: string }> }} params
 */
export async function createPool({ userId, name, showDates }) {
  const trimmedName = name?.trim();
  if (!userId || !trimmedName) {
    throw new Error('Missing required create pool fields.');
  }

  const inviteCode = generateInviteCode();
  const poolRef = doc(collection(db, 'pools'));
  const userRef = doc(db, 'users', userId);
  const createdAt = new Date().toISOString();

  const poolPayload = {
    name: trimmedName,
    inviteCode,
    ownerId: userId,
    members: [userId],
    createdAt,
    status: 'active',
  };

  const batch = writeBatch(db);
  batch.set(poolRef, poolPayload);
  batch.set(
    userRef,
    {
      pools: arrayUnion(poolRef.id),
    },
    { merge: true }
  );
  await batch.commit();

  try {
    await arrayUnionPoolOntoUserPickDocs(
      userId,
      { id: poolRef.id, name: trimmedName },
      showDates
    );
  } catch (e) {
    console.error('createPool: pick snapshot backfill failed:', e);
  }

  return {
    id: poolRef.id,
    ...poolPayload,
  };
}

/**
 * @param {{ userId: string, inviteCode: string, showDates?: Array<string | { date?: string }> }} params
 */
export async function joinPool({ userId, inviteCode, showDates }) {
  const normalizedCode = inviteCode?.trim().toUpperCase();
  if (!userId || !normalizedCode) {
    throw new Error('Missing required join pool fields.');
  }

  const poolQuery = query(
    collection(db, 'pools'),
    where('inviteCode', '==', normalizedCode)
  );
  const snapshot = await getDocs(poolQuery);

  if (snapshot.empty) {
    const err = new Error('Invalid invite code.');
    err.code = 'invalid-invite-code';
    throw err;
  }

  const poolDoc = snapshot.docs[0];
  const poolData = poolDoc.data();

  if (poolData.status === 'archived') {
    const err = new Error('This pool is archived.');
    err.code = 'pool-archived';
    throw err;
  }

  if (
    typeof poolData.maxMembers === 'number' &&
    poolData.maxMembers > 0 &&
    (poolData.members?.length ?? 0) >= poolData.maxMembers
  ) {
    const err = new Error('Pool is full.');
    err.code = 'pool-full';
    throw err;
  }

  if (poolData.members?.includes(userId)) {
    const err = new Error('User already in pool.');
    err.code = 'already-in-pool';
    throw err;
  }

  const poolRef = doc(db, 'pools', poolDoc.id);
  const userRef = doc(db, 'users', userId);

  const batch = writeBatch(db);
  batch.update(poolRef, { members: arrayUnion(userId) });
  batch.set(
    userRef,
    {
      pools: arrayUnion(poolDoc.id),
    },
    { merge: true }
  );
  await batch.commit();

  try {
    await arrayUnionPoolOntoUserPickDocs(
      userId,
      {
        id: poolDoc.id,
        name:
          typeof poolData.name === 'string' && poolData.name.trim()
            ? poolData.name.trim()
            : '',
      },
      showDates
    );
  } catch (e) {
    console.error('joinPool: pick snapshot backfill failed:', e);
  }

  return {
    id: poolDoc.id,
    ...poolData,
    members: [...(poolData.members || []), userId],
  };
}
