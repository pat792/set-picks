// src/shared/utils/timeLogic.js
import { ymdInTimeZone } from './dateUtils';

/** Venue / broadcast schedule — picks lock uses wall time in this zone (not the viewer’s local zone). */
export const SHOW_SCHEDULE_TIMEZONE = 'America/Los_Angeles';

/** Picks lock at this local time in {@link SHOW_SCHEDULE_TIMEZONE} on the show’s calendar date (15 min before a typical 8pm PT start). */
export const SHOW_PICKS_LOCK_HOUR_PT = 19;
export const SHOW_PICKS_LOCK_MINUTE_PT = 45;

export function scheduleTodayYmd() {
  return ymdInTimeZone(new Date(), SHOW_SCHEDULE_TIMEZONE);
}

function pacificClockOnShowYmd(showYmd) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: SHOW_SCHEDULE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(new Date());
  const map = Object.fromEntries(
    parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
  );
  const ymd = `${map.year}-${map.month}-${map.day}`;
  if (ymd !== showYmd) return null;
  return { hour: Number(map.hour), minute: Number(map.minute) };
}

/** True when it is still `showYmd` in the show timezone and local time there is at/after the picks lock. */
export function isPastPicksLockPacific(showYmd) {
  const clock = pacificClockOnShowYmd(showYmd);
  if (!clock) return false;
  const { hour, minute } = clock;
  return (
    hour > SHOW_PICKS_LOCK_HOUR_PT ||
    (hour === SHOW_PICKS_LOCK_HOUR_PT && minute >= SHOW_PICKS_LOCK_MINUTE_PT)
  );
}

/**
 * @param {{ date: string }[]} showDates — chronological flat list from show calendar (Phish.net or fallback).
 */
export function getNextShow(showDates) {
  if (!Array.isArray(showDates) || showDates.length === 0) {
    throw new Error('getNextShow requires a non-empty showDates array.');
  }
  const today = scheduleTodayYmd();

  const nextShow = showDates.find((show) => show.date >= today);

  return nextShow || showDates[showDates.length - 1];
}

/**
 * NEXT — only date users can enter picks (the upcoming show from “today” in {@link SHOW_SCHEDULE_TIMEZONE}, before lock).
 * LIVE — that show date in PT and wall time there is at/after 7:45pm PT: picks locked, live standings UX.
 * PAST — calendar date before schedule “today” in PT (show already happened).
 * FUTURE — any other listed date (e.g. later tour nights): too early until that show becomes "next".
 */

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
  const today = scheduleTodayYmd();
  const nextShow = getNextShow(showDates);

  if (selectedDate < today) return 'PAST';
  if (selectedDate === nextShow.date) {
    if (selectedDate === today) {
      if (isPastPicksLockPacific(selectedDate)) return 'LIVE';
    }
    return 'NEXT';
  }
  return 'FUTURE';
};
