import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

import { arrayUnionPoolOntoUserPickDocs } from '../../picks';
import { db } from '../../../shared/lib/firebase';
import { MAX_USER_POOLS_FETCH } from './poolReadLimits';
import {
  STANDINGS_SCOPE_FROM_MEMBERSHIP,
  isFromMembershipStandingsScope,
} from './poolFirestore';

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
    where('members', 'array-contains', userId),
    limit(MAX_USER_POOLS_FETCH)
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
 * `showDates` is accepted for call-site compatibility but unused: new pools are
 * `from_membership` and never backfill historical `pick.pools` snapshots (#417).
 */
export async function createPool({ userId, name, showDates: _showDates }) {
  const trimmedName = name?.trim();
  if (!userId || !trimmedName) {
    throw new Error('Missing required create pool fields.');
  }

  const inviteCode = generateInviteCode();
  const poolRef = doc(collection(db, 'pools'));
  const userRef = doc(db, 'users', userId);
  const createdAt = new Date().toISOString();

  // New pools start at zero for every member (#417). Absent standingsScope
  // on existing docs remains legacy (retroactive carryover + backfill).
  const poolPayload = {
    name: trimmedName,
    inviteCode,
    ownerId: userId,
    members: [userId],
    createdAt,
    status: 'active',
    standingsScope: STANDINGS_SCOPE_FROM_MEMBERSHIP,
    memberJoinedAt: { [userId]: createdAt },
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

  // from_membership: do not backfill historical pick.pools snapshots.
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
    err.poolId = poolDoc.id;
    throw err;
  }

  const poolRef = doc(db, 'pools', poolDoc.id);
  const userRef = doc(db, 'users', userId);
  const joinedAt = new Date().toISOString();
  const fromMembership = isFromMembershipStandingsScope(poolData.standingsScope);

  const poolUpdate = { members: arrayUnion(userId) };
  if (fromMembership) {
    poolUpdate[`memberJoinedAt.${userId}`] = joinedAt;
  }

  const batch = writeBatch(db);
  batch.update(poolRef, poolUpdate);
  batch.set(
    userRef,
    {
      pools: arrayUnion(poolDoc.id),
    },
    { merge: true }
  );
  await batch.commit();

  const poolName =
    typeof poolData.name === 'string' && poolData.name.trim()
      ? poolData.name.trim()
      : '';

  // Legacy pools only: backfill pick.pools so pre-join graded shows count.
  // Non-blocking (#729) — membership already committed; do not hold Join UI.
  if (!fromMembership) {
    void arrayUnionPoolOntoUserPickDocs(
      userId,
      { id: poolDoc.id, name: poolName },
      showDates
    ).catch((e) => {
      console.error('joinPool: pick snapshot backfill failed:', e);
    });
  }

  const nextMemberJoinedAt = fromMembership
    ? {
        ...(poolData.memberJoinedAt &&
        typeof poolData.memberJoinedAt === 'object'
          ? poolData.memberJoinedAt
          : {}),
        [userId]: joinedAt,
      }
    : poolData.memberJoinedAt;

  return {
    id: poolDoc.id,
    ...poolData,
    members: [...(poolData.members || []), userId],
    ...(fromMembership ? { memberJoinedAt: nextMemberJoinedAt } : {}),
  };
}
