import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';

/** Defaults when `notificationPrefs` is missing — all channels on (issue #274). */
export const DEFAULT_NOTIFICATION_PREFS = Object.freeze({
  reminders: true,
  results: true,
  nearMiss: true,
});

/**
 * @param {import('firebase/firestore').DocumentData | null | undefined} userData
 * @returns {{ reminders: boolean, results: boolean, nearMiss: boolean }}
 */
export function resolveNotificationPrefs(userData) {
  const raw = userData?.notificationPrefs;
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
  return {
    reminders: raw.reminders !== false,
    results: raw.results !== false,
    nearMiss: raw.nearMiss !== false,
  };
}

/**
 * Merge-updates `users/{uid}.notificationPrefs` (partial keys allowed).
 *
 * @param {string} uid
 * @param {Partial<{ reminders: boolean, results: boolean, nearMiss: boolean }>} patch
 */
/**
 * @param {string} uid
 * @param {(prefs: { reminders: boolean, results: boolean, nearMiss: boolean }) => void} onPrefs
 * @param {(err: unknown) => void} onError
 * @returns {() => void} unsubscribe
 */
export function subscribeNotificationPrefs(uid, onPrefs, onError) {
  if (!uid) return () => {};
  const ref = doc(db, 'users', uid);
  return onSnapshot(
    ref,
    (snap) => {
      onPrefs(resolveNotificationPrefs(snap.exists() ? snap.data() : null));
    },
    (err) => {
      onError(err);
    }
  );
}

export async function mergeNotificationPrefs(uid, patch) {
  if (!uid) throw new Error('Missing uid');
  const ref = doc(db, 'users', uid);
  const updates = { updatedAt: serverTimestamp() };
  for (const [k, v] of Object.entries(patch)) {
    if (typeof v === 'boolean') {
      updates[`notificationPrefs.${k}`] = v;
    }
  }
  await updateDoc(ref, updates);
}
