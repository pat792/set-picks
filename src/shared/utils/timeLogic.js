// src/shared/utils/timeLogic.js
import { todayYmd } from './dateUtils';

/**
 * @param {{ date: string }[]} showDates — chronological flat list from show calendar (Phish.net or fallback).
 */
export function getNextShow(showDates) {
  if (!Array.isArray(showDates) || showDates.length === 0) {
    throw new Error('getNextShow requires a non-empty showDates array.');
  }
  const today = todayYmd();

  const nextShow = showDates.find((show) => show.date >= today);

  return nextShow || showDates[showDates.length - 1];
}

/**
 * NEXT — only date users can enter picks (the upcoming show from today; same calendar day as next show, before live cutoff).
 * LIVE — next show is tonight (local) and local time is at/after {@link SHOW_DAY_LIVE_FROM_HOUR_LOCAL}: picks locked, live standings UX.
 * PAST — calendar date before today (show already happened).
 * FUTURE — any other listed date (e.g. later tour nights): too early until that show becomes "next".
 */
export const SHOW_DAY_LIVE_FROM_HOUR_LOCAL = 17;

/**
 * Tour ordering: show immediately before `ymd` in `showDates`, or null.
 * @param {string} ymd
 * @param {{ date: string }[]} showDates
 */
export function getShowBeforeDate(ymd, showDates) {
  if (!Array.isArray(showDates) || showDates.length === 0) return null;
  const i = showDates.findIndex((s) => s.date === ymd);
  if (i <= 0) return null;
  return showDates[i - 1];
}

/**
 * @param {string} selectedDate — YYYY-MM-DD
 * @param {{ date: string }[]} showDates
 */
export const getShowStatus = (selectedDate, showDates) => {
  const today = todayYmd();
  const nextShow = getNextShow(showDates);

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
