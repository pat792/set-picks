import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

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

  return snapshot.docs.map((poolDoc) => ({
    id: poolDoc.id,
    ...poolDoc.data(),
  }));
}

export async function createPool({ userId, name }) {
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

  return {
    id: poolRef.id,
    ...poolPayload,
  };
}

export async function joinPool({ userId, inviteCode }) {
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

  return {
    id: poolDoc.id,
    ...poolData,
    members: [...(poolData.members || []), userId],
  };
}
