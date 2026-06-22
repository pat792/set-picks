import { useEffect, useRef } from 'react';

import { showSuccessToast } from '../../../shared/ui/toast';

/**
 * Fires a toast notification exactly once when the active show transitions
 * from the open-picks state ('NEXT') to the locked state ('LIVE').
 *
 * Handles the common case where the user has the dashboard open around show
 * time: without a page reload, the status changes live and the toast fires
 * when 7:55 pm local arrives.  A hard reload after lock (initial status
 * already 'LIVE') does not re-fire the toast.
 *
 * @param {string|null} showStatus - Result of getShowStatus() for the active
 *   show date: 'NEXT' | 'LIVE' | 'PAST' | 'FUTURE' | null
 */
export function useSetlistLockToast(showStatus) {
  const prevStatusRef = useRef(showStatus);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = showStatus;

    if (prev === 'NEXT' && showStatus === 'LIVE') {
      showSuccessToast("Picks are locked — show time! 🎸");
    }
  }, [showStatus]);
}
