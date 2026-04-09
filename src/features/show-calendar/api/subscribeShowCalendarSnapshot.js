import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';

/**
 * Live subscription to `show_calendar/snapshot` (issue #160).
 * @param {(data: import('firebase/firestore').DocumentData | null) => void} onData
 * @param {(err: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeShowCalendarSnapshot(onData, onError) {
  const ref = doc(db, 'show_calendar', 'snapshot');
  return onSnapshot(
    ref,
    (snap) => {
      onData(snap.exists() ? snap.data() : null);
    },
    (err) => {
      if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    }
  );
}
