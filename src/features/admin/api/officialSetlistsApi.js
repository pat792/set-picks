import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../shared/lib/firebase';
import {
  sanitizeOfficialSongList,
  sanitizeSetlistSlots,
} from '../../../shared/utils/officialSetlistSanitize.js';

const OFFICIAL_SETLISTS_COLLECTION = 'official_setlists';

export { sanitizeOfficialSongList, sanitizeSetlistSlots };

export async function fetchOfficialSetlistByDate(showDate, slotFields) {
  const docRef = doc(db, OFFICIAL_SETLISTS_COLLECTION, showDate);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return {
      exists: false,
      setlist: sanitizeSetlistSlots({}, slotFields),
      officialSetlist: [],
    };
  }

  const data = docSnap.data();
  return {
    exists: true,
    setlist: sanitizeSetlistSlots(data.setlist || {}, slotFields),
    officialSetlist: sanitizeOfficialSongList(data.officialSetlist),
    raw: data,
  };
}

export async function saveOfficialSetlistByDate({
  showDate,
  setlistData,
  officialSetlist,
  slotFields,
  updatedBy,
}) {
  const cleanedSlots = sanitizeSetlistSlots(setlistData, slotFields);
  const cleanedOfficialSetlist = sanitizeOfficialSongList(officialSetlist);

  const docRef = doc(db, OFFICIAL_SETLISTS_COLLECTION, showDate);
  await setDoc(docRef, {
    showDate,
    status: 'COMPLETED',
    isScored: false,
    updatedAt: new Date().toISOString(),
    updatedBy,
    setlist: cleanedSlots,
    officialSetlist: cleanedOfficialSetlist,
  });

  return {
    cleanedSlots,
    cleanedOfficialSetlist,
  };
}
