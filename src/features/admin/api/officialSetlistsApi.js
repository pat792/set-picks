import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../shared/lib/firebase';
import {
  sanitizeOfficialSongList,
  sanitizeSetlistSlots,
} from '../../../shared/utils/officialSetlistSanitize.js';

const OFFICIAL_SETLISTS_COLLECTION = 'official_setlists';

export { sanitizeOfficialSongList, sanitizeSetlistSlots };

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
    raw: data,
  };
}

export async function saveOfficialSetlistByDate({
  showDate,
  setlistData,
  officialSetlist,
  slotFields,
  updatedBy,
  encoreSongs: encoreSongsExplicit,
}) {
  const cleanedSlots = sanitizeSetlistSlots(setlistData, slotFields);
  const cleanedOfficialSetlist = sanitizeOfficialSongList(officialSetlist);

  const docRef = doc(db, OFFICIAL_SETLISTS_COLLECTION, showDate);
  const snap = await getDoc(docRef);
  const prior = snap.exists() ? snap.data() : {};
  const priorList = Array.isArray(prior.encoreSongs)
    ? sanitizeOfficialSongList(prior.encoreSongs)
    : [];

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

  await setDoc(docRef, {
    showDate,
    status: 'COMPLETED',
    isScored: false,
    updatedAt: new Date().toISOString(),
    updatedBy,
    setlist: cleanedSlots,
    officialSetlist: cleanedOfficialSetlist,
    encoreSongs,
  });

  return {
    cleanedSlots,
    cleanedOfficialSetlist,
    encoreSongs,
  };
}
