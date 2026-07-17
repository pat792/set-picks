import { doc, getDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';
import { whenFirebaseReady } from '../../../shared/lib/firebaseAppCheck';

/**
 * @param {string[]} uids
 * @returns {Promise<Record<string, { avatarId: string | null, badges: Record<string, unknown> | null }>>}
 */
export async function fetchPlayerIdentityMap(uids) {
  /** @type {Record<string, { avatarId: string | null, badges: Record<string, unknown> | null }>} */
  const map = {};
  const list = Array.isArray(uids) ? uids : [];
  if (list.length === 0) return map;

  await whenFirebaseReady();
  const chunk = 24;
  for (let i = 0; i < list.length; i += chunk) {
    const slice = list.slice(i, i + chunk);
    const snaps = await Promise.all(
      slice.map((uid) => getDoc(doc(db, 'users', uid)))
    );
    for (let j = 0; j < slice.length; j += 1) {
      const uid = slice[j];
      const snap = snaps[j];
      if (!snap.exists()) {
        map[uid] = { avatarId: null, badges: null };
        continue;
      }
      const data = snap.data() || {};
      map[uid] = {
        avatarId:
          typeof data.avatarId === 'string' && data.avatarId.trim()
            ? data.avatarId.trim()
            : null,
        badges:
          data.badges &&
          typeof data.badges === 'object' &&
          !Array.isArray(data.badges)
            ? data.badges
            : null,
      };
    }
  }
  return map;
}
