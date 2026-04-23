import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';
import { whenFirebaseReady } from '../../../shared/lib/firebaseAppCheck';

/**
 * Live subscription to `show_calendar/snapshot` (issue #160).
 *
 * Gates the inner `onSnapshot` on `whenFirebaseReady()` so App Check
 * Enforcement (prod) doesn't race with this — usually the earliest
 * Firestore read on the dashboard. Preserves the synchronous-unsub
 * contract callers expect (issue #242).
 *
 * @param {(data: import('firebase/firestore').DocumentData | null) => void} onData
 * @param {(err: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeShowCalendarSnapshot(onData, onError) {
  let innerUnsub = () => {};
  let cancelled = false;

  whenFirebaseReady().then(() => {
    if (cancelled) return;
    const ref = doc(db, 'show_calendar', 'snapshot');
    innerUnsub = onSnapshot(
      ref,
      (snap) => {
        onData(snap.exists() ? snap.data() : null);
      },
      (err) => {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    );
  });

  return () => {
    cancelled = true;
    innerUnsub();
  };
}
