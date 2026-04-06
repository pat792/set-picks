// src/utils/timeLogic.js
import { SHOW_DATES } from '../data/showDates';
import { todayYmd } from './dateUtils';

export const getNextShow = () => {
  const today = todayYmd();
  
  // Find the first show that hasn't happened yet
  const nextShow = SHOW_DATES.find(show => show.date >= today);
  
  // Fallback to the last show if tour is over
  return nextShow || SHOW_DATES[SHOW_DATES.length - 1]; 
};

/**
 * NEXT — only date users can enter picks (the upcoming show from today; same calendar day as next show, before live cutoff).
 * LIVE — next show is tonight (local) and local time is at/after {@link SHOW_DAY_LIVE_FROM_HOUR_LOCAL}: picks locked, live standings UX.
 * PAST — calendar date before today (show already happened).
 * FUTURE — any other listed date (e.g. later tour nights): too early until that show becomes "next".
 */
export const SHOW_DAY_LIVE_FROM_HOUR_LOCAL = 17;

/** Tour ordering: show immediately before `ymd` in `SHOW_DATES`, or null. */
export function getShowBeforeDate(ymd) {
  const i = SHOW_DATES.findIndex((s) => s.date === ymd);
  if (i <= 0) return null;
  return SHOW_DATES[i - 1];
}

export const getShowStatus = (selectedDate) => {
  const today = todayYmd();
  const nextShow = getNextShow();

  if (selectedDate < today) return 'PAST';
  if (selectedDate === nextShow.date) {
    if (selectedDate === today) {
      const hour = new Date().getHours();
      if (hour >= SHOW_DAY_LIVE_FROM_HOUR_LOCAL) return 'LIVE';
    }
    return 'NEXT';
  }
  return 'FUTURE';
};