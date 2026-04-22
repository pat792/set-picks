import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';
import {
  sanitizeBustouts,
  sanitizeOfficialSongList,
} from '../../../shared/utils/officialSetlistSanitize.js';

/**
 * @param {string} showDate
 * @returns {Promise<Array<{ id: string } & Record<string, unknown>>>}
 */
export async function fetchPicksForShowDate(showDate) {
  if (!showDate) return [];

  const picksQuery = query(collection(db, 'picks'), where('showDate', '==', showDate));
  const snapshot = await getDocs(picksQuery);

  return snapshot.docs.map((pickDoc) => ({
    id: pickDoc.id,
    ...pickDoc.data(),
  }));
}

/**
 * @param {string} showDate
 * @returns {Promise<null | { officialSetlist: unknown[] } & Record<string, unknown>>}
 */
export async function fetchOfficialSetlistForShow(showDate) {
  if (!showDate) return null;

  const setlistRef = doc(db, 'official_setlists', showDate);
  const setlistSnap = await getDoc(setlistRef);

  if (!setlistSnap.exists()) return null;

  const data = setlistSnap.data();
  const rawEnc = data.encoreSongs;
  const encoreSongs =
    Array.isArray(rawEnc) && rawEnc.length > 0
      ? sanitizeOfficialSongList(rawEnc)
      : [];
  const bustouts = sanitizeBustouts(data.bustouts);
  return {
    ...(data.setlist || {}),
    officialSetlist: Array.isArray(data.officialSetlist) ? data.officialSetlist : [],
    ...(encoreSongs.length > 0 ? { encoreSongs } : {}),
    // Always include the bustouts key (even when empty) so downstream scoring
    // treats absence = empty without ambiguity (#214).
    bustouts,
  };
}
