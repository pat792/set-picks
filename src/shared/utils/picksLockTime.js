/**
 * Per-show picks wall-clock lock (#522).
 *
 * When doors are known: lock = doors + (tourAvgDoorsToStart − safety).
 * Summer Tour 2026 setlist.fm avg doors→start is 1h59m (119); safety 34 → doors+85 (1h25).
 * Fallback when doors unknown: 19:30 venue-local.
 */

/** @type {{ hour: number, minute: number }} */
export const DEFAULT_PICKS_LOCK_HM = Object.freeze({ hour: 19, minute: 30 });

/** Back-compat aliases for callers that still import fixed hour/minute. */
export const SHOW_PICKS_LOCK_HOUR_LOCAL = DEFAULT_PICKS_LOCK_HM.hour;
export const SHOW_PICKS_LOCK_MINUTE_LOCAL = DEFAULT_PICKS_LOCK_HM.minute;

/** setlist.fm Summer Tour 2026 “Avg start time after doors”. */
export const TOUR_AVG_DOORS_TO_START_MIN = 119;

/** Minutes before average start to lock picks (doors+85 when avg is 119). */
export const PICKS_LOCK_SAFETY_MIN = 34;

/**
 * Known doors times (venue-local 24h `HH:mm`) from setlist.fm / tickets.
 * Ops: extend as future dates publish. Calendar fields `doorsLocal` /
 * `picksLockLocal` override this seed when present.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const SHOW_DOORS_LOCAL_BY_DATE = Object.freeze({
  '2026-07-18': '17:30', // Merriweather
  '2026-07-19': '17:30',
  '2026-07-21': '17:30', // Syracuse
  '2026-07-22': '18:30', // MSG
  '2026-07-24': '18:30',
  '2026-07-25': '18:30',
  '2026-07-27': '18:30',
  '2026-07-29': '18:30',
  '2026-07-31': '17:00', // Fenway
  '2026-08-01': '17:00',
  '2026-09-04': '18:00', // Dick's
  '2026-09-05': '18:00',
  '2026-09-06': '18:00',
});

/**
 * @param {string | null | undefined} value
 * @returns {{ hour: number, minute: number } | null}
 */
export function parseLocalHm(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const h24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const hour = Number(h24[1]);
    const minute = Number(h24[2]);
    if (
      Number.isInteger(hour) &&
      Number.isInteger(minute) &&
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59
    ) {
      return { hour, minute };
    }
    return null;
  }

  const h12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (!h12) return null;
  let hour = Number(h12[1]);
  const minute = Number(h12[2]);
  const ap = h12[3].toUpperCase();
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 1 ||
    hour > 12 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  if (ap === 'AM') {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }
  return { hour, minute };
}

/**
 * @param {{ hour: number, minute: number }} hm
 * @returns {string} `HH:mm` 24h
 */
export function formatLocalHm24(hm) {
  return `${String(hm.hour).padStart(2, '0')}:${String(hm.minute).padStart(2, '0')}`;
}

/**
 * @param {{ hour: number, minute: number }} hm
 * @returns {string} e.g. `7:10 PM`
 */
export function formatLockTimeLocalLabel(hm) {
  const hour12 = ((hm.hour + 11) % 12) + 1;
  const suffix = hm.hour >= 12 ? 'PM' : 'AM';
  return `${hour12}:${String(hm.minute).padStart(2, '0')} ${suffix}`;
}

/**
 * @param {{ hour: number, minute: number }} doors
 * @param {{ tourAvgDoorsToStartMin?: number, safetyMin?: number }} [opts]
 * @returns {{ hour: number, minute: number }}
 */
export function lockHmFromDoors(
  doors,
  {
    tourAvgDoorsToStartMin = TOUR_AVG_DOORS_TO_START_MIN,
    safetyMin = PICKS_LOCK_SAFETY_MIN,
  } = {}
) {
  const offset = Math.max(0, tourAvgDoorsToStartMin - safetyMin);
  const total = doors.hour * 60 + doors.minute + offset;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 };
}

/**
 * Resolve venue-local picks lock for a show.
 *
 * Priority:
 * 1. `show.picksLockLocal` (materialized / override)
 * 2. `show.doorsLocal` or seeded doors for `show.date` → doors + (avg − safety)
 * 3. Default 19:30
 *
 * @param {{ date?: string, doorsLocal?: string, picksLockLocal?: string } | null | undefined} show
 * @param {{
 *   doorsByDate?: Record<string, string>,
 *   tourAvgDoorsToStartMin?: number,
 *   safetyMin?: number,
 *   fallback?: { hour: number, minute: number },
 * }} [opts]
 * @returns {{ hour: number, minute: number, source: 'picksLockLocal' | 'doors' | 'fallback', doorsLocal: string | null }}
 */
export function resolvePicksLockHm(show, opts = {}) {
  const fallback = opts.fallback ?? DEFAULT_PICKS_LOCK_HM;
  const doorsByDate = opts.doorsByDate ?? SHOW_DOORS_LOCAL_BY_DATE;

  const explicitLock = parseLocalHm(show?.picksLockLocal);
  if (explicitLock) {
    return {
      ...explicitLock,
      source: 'picksLockLocal',
      doorsLocal: typeof show?.doorsLocal === 'string' ? show.doorsLocal.trim() || null : null,
    };
  }

  const date = typeof show?.date === 'string' ? show.date.trim() : '';
  const doorsRaw =
    (typeof show?.doorsLocal === 'string' && show.doorsLocal.trim()) ||
    (date && doorsByDate[date]) ||
    null;
  const doors = parseLocalHm(doorsRaw);
  if (doors) {
    const lock = lockHmFromDoors(doors, opts);
    return {
      ...lock,
      source: 'doors',
      doorsLocal: formatLocalHm24(doors),
    };
  }

  return {
    ...fallback,
    source: 'fallback',
    doorsLocal: null,
  };
}

/**
 * Enrich a show row with resolved lock fields (idempotent).
 * @param {{ date: string, venue?: string, timeZone?: string, doorsLocal?: string, picksLockLocal?: string }} show
 */
export function enrichShowWithPicksLock(show) {
  if (!show || typeof show !== 'object') return show;
  const resolved = resolvePicksLockHm(show);
  if (resolved.source === 'fallback') return { ...show };

  const enriched = {
    ...show,
    picksLockLocal: show.picksLockLocal || formatLocalHm24(resolved),
    picksLockSource: resolved.source,
  };
  const doorsLocal = show.doorsLocal || resolved.doorsLocal;
  if (doorsLocal) enriched.doorsLocal = doorsLocal;
  return enriched;
}
