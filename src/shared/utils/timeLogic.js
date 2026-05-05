// src/shared/utils/timeLogic.js
import { ymdInTimeZone } from './dateUtils';
import { DEFAULT_SHOW_TIME_ZONE, resolveShowTimeZone } from './showTimeZone';

/** Fallback when a show does not carry an explicit `timeZone` field. */
export const SHOW_SCHEDULE_TIMEZONE = DEFAULT_SHOW_TIME_ZONE;

/**
 * Picks lock at this local time on the show's calendar date in the show's local timezone.
 * Interim 7:55pm local wall clock (#303 / #278).
 */
export const SHOW_PICKS_LOCK_HOUR_LOCAL = 19;
export const SHOW_PICKS_LOCK_MINUTE_LOCAL = 55;
// Back-compat aliases for existing imports.
export const SHOW_PICKS_LOCK_HOUR_PT = SHOW_PICKS_LOCK_HOUR_LOCAL;
export const SHOW_PICKS_LOCK_MINUTE_PT = SHOW_PICKS_LOCK_MINUTE_LOCAL;

export function scheduleTodayYmd(timeZone = SHOW_SCHEDULE_TIMEZONE, now = new Date()) {
  return ymdInTimeZone(now, timeZone);
}

function showClockOnShowYmd(showYmd, showTimeZone, now = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: showTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(now);
  const map = Object.fromEntries(
    parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
  );
  const ymd = `${map.year}-${map.month}-${map.day}`;
  if (ymd !== showYmd) return null;
  return { hour: Number(map.hour), minute: Number(map.minute) };
}

/**
 * True when it is still `showYmd` in the show timezone and local time there is
 * at/after the picks lock.
 *
 * DST fall-back ambiguity is handled by deriving wall-clock parts from a real
 * instant (`now`) in the show's timezone; both repeated local hours map to the
 * same show date boundary and compare consistently against lock hh:mm.
 */
export function isPastPicksLock(showYmd, showTimeZone = SHOW_SCHEDULE_TIMEZONE, now = new Date()) {
  const clock = showClockOnShowYmd(showYmd, showTimeZone, now);
  if (!clock) return false;
  const { hour, minute } = clock;
  return (
    hour > SHOW_PICKS_LOCK_HOUR_LOCAL ||
    (hour === SHOW_PICKS_LOCK_HOUR_LOCAL && minute >= SHOW_PICKS_LOCK_MINUTE_LOCAL)
  );
}
// Back-compat alias.
export const isPastPicksLockPacific = isPastPicksLock;

/**
 * @param {{ date: string }[]} showDates — chronological flat list from show calendar (Phish.net or fallback).
 */
export function getNextShow(showDates) {
  if (!Array.isArray(showDates) || showDates.length === 0) {
    throw new Error('getNextShow requires a non-empty showDates array.');
  }
  const now = new Date();
  const nextShow = showDates.find((show) => {
    const tz = resolveShowTimeZone(show);
    const showToday = scheduleTodayYmd(tz, now);
    return show.date >= showToday;
  });

  return nextShow || showDates[showDates.length - 1];
}

/**
 * NEXT — only date users can enter picks (the upcoming show from each show's local "today", before lock).
 * LIVE — selected show date in local timezone and wall time there is at/after picks lock ({@link SHOW_PICKS_LOCK_HOUR_LOCAL}:{@link SHOW_PICKS_LOCK_MINUTE_LOCAL} local): picks locked, live standings UX.
 * PAST — calendar date before local "today" in the selected show timezone (show already happened there).
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
  const nextShow = getNextShow(showDates);
  const selectedShow = showDates.find((show) => show.date === selectedDate) || null;
  const selectedTimeZone = resolveShowTimeZone(selectedShow);
  const today = scheduleTodayYmd(selectedTimeZone);

  if (selectedDate < today) return 'PAST';
  if (selectedDate === nextShow.date) {
    if (selectedDate === today) {
      if (isPastPicksLock(selectedDate, selectedTimeZone)) return 'LIVE';
    }
    return 'NEXT';
  }
  return 'FUTURE';
};

/**
 * Standings pick privacy (#303): opponent song titles stay obscured until picks
 * lock flips the show to LIVE (wall clock) or an official setlist exists for scoring.
 *
 * @param {unknown} actualSetlist — official setlist snapshot when graded (truthy => never redact).
 * @param {string} showStatus — from {@link getShowStatus}
 * @returns {boolean}
 */
export function shouldRedactOpponentPicksPreLock(actualSetlist, showStatus) {
  return !actualSetlist && showStatus === 'NEXT';
}
