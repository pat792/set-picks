import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';

function encodeHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveTokenId(token) {
  const input = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return encodeHex(new Uint8Array(digest)).slice(0, 40);
}

function tokenDocRef(userId, tokenId) {
  return doc(db, 'users', userId, 'private_fcmTokens', tokenId);
}

/**
 * Upsert per-device token metadata at:
 * users/{uid}/private_fcmTokens/{tokenId}
 */
export async function upsertFcmTokenForUser({
  userId,
  token,
  permission = 'granted',
  platform = 'web',
}) {
  if (!userId) throw new Error('Missing userId');
  if (!token) throw new Error('Missing token');

  const tokenId = await deriveTokenId(token);
  const ref = tokenDocRef(userId, tokenId);

  const base = {
    token,
    permission,
    platform,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    lastSeenAt: serverTimestamp(),
  };

  try {
    await updateDoc(ref, base);
  } catch {
    await setDoc(ref, {
      ...base,
      createdAt: serverTimestamp(),
    });
  }

  return tokenId;
}
