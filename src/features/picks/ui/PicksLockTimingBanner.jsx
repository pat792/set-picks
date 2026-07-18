import React, { useState } from 'react';
import { Clock3, X } from 'lucide-react';

import {
  PICKS_LOCK_SAFETY_MIN,
  TOUR_AVG_DOORS_TO_START_MIN,
  formatLockTimeLocalLabel,
  parseLocalHm,
  resolvePicksLockHm,
} from '../../../shared/utils/picksLockTime';

function durationWords(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (mins > 0) parts.push(`${mins} minute${mins === 1 ? '' : 's'}`);
  return parts.join(' ');
}

/**
 * @param {{ date?: string, doorsLocal?: string, picksLockLocal?: string, picksLockSource?: string } | null | undefined} show
 */
export function buildPicksLockTimingMessage(show) {
  const lock = resolvePicksLockHm(show);
  const lockLabel = formatLockTimeLocalLabel(lock);
  const doors = parseLocalHm(lock.doorsLocal);
  const isDoorsBased =
    lock.source === 'doors' || show?.picksLockSource === 'doors';

  if (doors && isDoorsBased) {
    const offsetMinutes =
      TOUR_AVG_DOORS_TO_START_MIN - PICKS_LOCK_SAFETY_MIN;
    return `Picks lock at ${lockLabel} — ${durationWords(
      offsetMinutes
    )} after tonight’s published doors time (${formatLockTimeLocalLabel(doors)}).`;
  }

  return `Picks lock at ${lockLabel} venue-local.`;
}

function dismissalKey(showDate) {
  return `picks-lock-timing-dismissed:${showDate}`;
}

function wasDismissed(showDate) {
  if (!showDate || typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(dismissalKey(showDate)) === '1';
  } catch {
    return false;
  }
}

function rememberDismissal(showDate) {
  if (!showDate || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(dismissalKey(showDate), '1');
  } catch {
    // Storage can be disabled; local state still dismisses for this mount.
  }
}

/**
 * Small pre-lock timing notice shared by Picks and Standings.
 *
 * @param {{
 *   show: { date?: string, doorsLocal?: string, picksLockLocal?: string, picksLockSource?: string } | null | undefined,
 *   showStatus: string | null | undefined
 * }} props
 */
export default function PicksLockTimingBanner({ show, showStatus }) {
  const showDate = typeof show?.date === 'string' ? show.date : '';
  const [dismissed, setDismissed] = useState(() => wasDismissed(showDate));

  if (!show || showStatus !== 'NEXT' || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    rememberDismissal(showDate);
  };

  return (
    <div
      className="mb-4 flex items-start gap-2.5 rounded-md border border-sky-400/30 bg-sky-400/10 p-3 text-sm text-sky-100/90"
      role="status"
    >
      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden />
      <span className="min-w-0 flex-1">{buildPicksLockTimingMessage(show)}</span>
      <button
        type="button"
        onClick={dismiss}
        className="-mr-1 -mt-1 rounded-md p-1 text-sky-200/70 transition hover:bg-sky-300/10 hover:text-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
        aria-label="Dismiss picks lock timing"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
