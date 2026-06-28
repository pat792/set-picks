import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';

/**
 * Defaults when `notificationPrefs` is missing.
 *
 * - `reminders`, `results`, `nearMiss`: existing categories, default on (issue #274).
 * - `lifecycle`: onboarding / countdown / engagement family (welcome, tour countdown,
 *   picks confirmed, tour engagement). Default on — these are P0/P1 retention messages.
 * - `commercial`: Phase 3 sponsor / affiliate slots. Default OFF — commercial sends are
 *   strictly opt-in and gated by `COMMERCIAL_PHASE3.md`; we never default users in.
 *
 * Keys here map 1:1 to `prefKeys` in `docs/comms-triggers/catalog.json`, which is what the
 * server-side delivery orchestrator gates on.
 */
export const DEFAULT_NOTIFICATION_PREFS = Object.freeze({
  reminders: true,
  results: true,
  nearMiss: true,
  lifecycle: true,
  commercial: false,
});

/**
 * @typedef {{
 *   reminders: boolean,
 *   results: boolean,
 *   nearMiss: boolean,
 *   lifecycle: boolean,
 *   commercial: boolean,
 * }} NotificationPrefs
 */

/**
 * @param {import('firebase/firestore').DocumentData | null | undefined} userData
 * @returns {NotificationPrefs}
 */
export function resolveNotificationPrefs(userData) {
  const raw = userData?.notificationPrefs;
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
  return {
    // Default-allow categories: only `false` opts out.
    reminders: raw.reminders !== false,
    results: raw.results !== false,
    nearMiss: raw.nearMiss !== false,
    lifecycle: raw.lifecycle !== false,
    // Default-deny category: only an explicit `true` opts in.
    commercial: raw.commercial === true,
  };
}

/**
 * @param {string} uid
 * @param {(prefs: NotificationPrefs) => void} onPrefs
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

/**
 * Merge-updates `users/{uid}.notificationPrefs` (partial keys allowed).
 *
 * @param {string} uid
 * @param {Partial<NotificationPrefs>} patch
 */
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
