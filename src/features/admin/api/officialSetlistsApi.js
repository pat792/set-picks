import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../shared/lib/firebase';
import {
  sanitizeBustouts,
  sanitizeOfficialSongList,
  sanitizeSetlistSlots,
  sanitizeSongGaps,
} from '../../../shared/utils/officialSetlistSanitize.js';

const OFFICIAL_SETLISTS_COLLECTION = 'official_setlists';

export { sanitizeBustouts, sanitizeOfficialSongList, sanitizeSetlistSlots, sanitizeSongGaps };

function encoreSongsFromOfficialDoc(data) {
  if (!data || typeof data !== 'object') return [];
  const raw = data.encoreSongs;
  if (Array.isArray(raw) && raw.length > 0) {
    return sanitizeOfficialSongList(raw);
  }
  const enc = data.setlist?.enc;
  return typeof enc === 'string' && enc.trim() ? [enc.trim()] : [];
}

export async function fetchOfficialSetlistByDate(showDate, slotFields) {
  const docRef = doc(db, OFFICIAL_SETLISTS_COLLECTION, showDate);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return {
      exists: false,
      setlist: sanitizeSetlistSlots({}, slotFields),
      officialSetlist: [],
      encoreSongs: [],
    };
  }

  const data = docSnap.data();
  return {
    exists: true,
    setlist: sanitizeSetlistSlots(data.setlist || {}, slotFields),
    officialSetlist: sanitizeOfficialSongList(data.officialSetlist),
    encoreSongs: encoreSongsFromOfficialDoc(data),
    bustouts: sanitizeBustouts(data.bustouts),
    songGaps: sanitizeSongGaps(data.songGaps),
    raw: data,
  };
}

/**
 * Persist an official setlist for a show date.
 *
 * `bustouts` is the per-show bustout snapshot (#214). Callers should derive
 * it from Phish.net row `gap` values (via the parser DTO or a live fetch) and
 * pass it explicitly. Omitting it preserves the prior snapshot on the doc so
 * a save triggered without fresh Phish.net data (e.g. pure slot edit) does
 * not erase bustouts captured earlier. Pass an empty array only when you
 * affirmatively know there are no bustouts.
 *
 * `songGaps` (#587 Phase B) follows the same explicit-wins / preserve-prior
 * policy: because this write replaces the whole doc, omitting `songGaps`
 * preserves any gap map frozen by live automation or a prior ingest.
 */
export async function saveOfficialSetlistByDate({
  showDate,
  setlistData,
  officialSetlist,
  slotFields,
  updatedBy,
  encoreSongs: encoreSongsExplicit,
  bustouts: bustoutsExplicit,
  songGaps: songGapsExplicit,
}) {
  const cleanedSlots = sanitizeSetlistSlots(setlistData, slotFields);
  const cleanedOfficialSetlist = sanitizeOfficialSongList(officialSetlist);

  const docRef = doc(db, OFFICIAL_SETLISTS_COLLECTION, showDate);
  const snap = await getDoc(docRef);
  const prior = snap.exists() ? snap.data() : {};
  const priorList = Array.isArray(prior.encoreSongs)
    ? sanitizeOfficialSongList(prior.encoreSongs)
    : [];
  const priorBustouts = sanitizeBustouts(prior.bustouts);
  const priorSongGaps = sanitizeSongGaps(prior.songGaps);

  let encoreSongs;
  if (encoreSongsExplicit !== undefined) {
    encoreSongs = sanitizeOfficialSongList(encoreSongsExplicit);
  } else if (!cleanedSlots.enc) {
    encoreSongs = [];
  } else if (priorList.length > 0) {
    encoreSongs = priorList;
  } else {
    encoreSongs = [cleanedSlots.enc];
  }

  // Bustouts policy: explicit caller value wins (even an empty array — that
  // is the affirmative "no bustouts" signal). When the caller omits the field
  // entirely (undefined), fall back to whatever was previously on the doc so
  // we never silently clobber a good snapshot on an unrelated edit.
  const bustouts =
    bustoutsExplicit !== undefined
      ? sanitizeBustouts(bustoutsExplicit)
      : priorBustouts;

  const songGaps =
    songGapsExplicit !== undefined
      ? sanitizeSongGaps(songGapsExplicit)
      : priorSongGaps;

  await setDoc(docRef, {
    showDate,
    status: 'COMPLETED',
    isScored: false,
    updatedAt: new Date().toISOString(),
    updatedBy,
    setlist: cleanedSlots,
    officialSetlist: cleanedOfficialSetlist,
    encoreSongs,
    bustouts,
    songGaps,
  });

  return {
    cleanedSlots,
    cleanedOfficialSetlist,
    encoreSongs,
    bustouts,
    songGaps,
  };
}
