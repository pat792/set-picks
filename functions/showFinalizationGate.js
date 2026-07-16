/**
 * Server-side mirror of `src/shared/utils/timeLogic.js` show status rules
 * (#326) — CommonJS only, no ESM client imports.
 *
 * Used to refuse manual `rollupScoresForShow` until the show is PAST, unless
 * post-encore auto-finalize already stamped `live_setlist_automation.autoFinalizedAt`
 * or the admin passes `force: true`.
 */

const DEFAULT_SHOW_TIME_ZONE = "America/Los_Angeles";

const SHOW_PICKS_LOCK_HOUR_LOCAL = 19;
const SHOW_PICKS_LOCK_MINUTE_LOCAL = 55;

function resolveShowTimeZone(show, fallback = DEFAULT_SHOW_TIME_ZONE) {
  const explicit =
    typeof show?.timeZone === "string"
      ? show.timeZone.trim()
      : typeof show?.timezone === "string"
        ? show.timezone.trim()
        : "";
  if (explicit) return explicit;
  return fallback;
}

function scheduleTodayYmd(timeZone = DEFAULT_SHOW_TIME_ZONE, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function showClockOnShowYmd(showYmd, showTimeZone, now = new Date()) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: showTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(now);
  const map = Object.fromEntries(
    parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  );
  const ymd = `${map.year}-${map.month}-${map.day}`;
  if (ymd !== showYmd) return null;
  return { hour: Number(map.hour), minute: Number(map.minute) };
}

function isPastPicksLock(showYmd, showTimeZone = DEFAULT_SHOW_TIME_ZONE, now = new Date()) {
  const clock = showClockOnShowYmd(showYmd, showTimeZone, now);
  if (!clock) return false;
  const { hour, minute } = clock;
  return (
    hour > SHOW_PICKS_LOCK_HOUR_LOCAL ||
    (hour === SHOW_PICKS_LOCK_HOUR_LOCAL && minute >= SHOW_PICKS_LOCK_MINUTE_LOCAL)
  );
}

/**
 * @param {{ date: string }[]} showDates — chronological flat list from show calendar.
 */
function getNextShow(showDates, now = new Date()) {
  if (!Array.isArray(showDates) || showDates.length === 0) {
    throw new Error("getNextShow requires a non-empty showDates array.");
  }
  const nextShow = showDates.find((show) => {
    const tz = resolveShowTimeZone(show);
    const showToday = scheduleTodayYmd(tz, now);
    return show.date >= showToday;
  });
  return nextShow || showDates[showDates.length - 1];
}

/**
 * @param {string} selectedDate — YYYY-MM-DD
 * @param {{ date: string, timeZone?: string }[]} showDates
 * @param {Date} [now]
 * @returns {'NEXT' | 'LIVE' | 'PAST' | 'FUTURE'}
 */
function getShowStatus(selectedDate, showDates, now = new Date()) {
  const nextShow = getNextShow(showDates, now);
  const selectedShow = showDates.find((show) => show.date === selectedDate) || null;
  const selectedTimeZone = resolveShowTimeZone(selectedShow);
  const today = scheduleTodayYmd(selectedTimeZone, now);

  if (selectedDate < today) return "PAST";
  if (selectedDate === nextShow.date) {
    if (selectedDate === today) {
      if (isPastPicksLock(selectedDate, selectedTimeZone, now)) return "LIVE";
    }
    return "NEXT";
  }
  return "FUTURE";
}

/**
 * @param {string} showDate
 * @param {{ date: string, timeZone?: string }[] | null | undefined} calendarShows
 * @param {import('firebase-admin').firestore.Timestamp | import('firebase-admin').firestore.FieldValue | null | undefined} autoFinalizedAt
 * @param {boolean} force
 * @param {Date} [now]
 */
function evaluateManualFinalizeTimingGate({
  showDate,
  calendarShows,
  autoFinalizedAt,
  force,
  /** @type {Date | undefined} */
  now,
}) {
  const nowDate = now instanceof Date ? now : new Date();
  if (force) {
    return {
      allowed: true,
      reason: "force-early",
      showStatus: null,
      autoFinalized: false,
    };
  }
  if (autoFinalizedAt != null) {
    return {
      allowed: true,
      reason: "auto-finalized",
      showStatus: null,
      autoFinalized: true,
    };
  }
  if (!Array.isArray(calendarShows) || calendarShows.length === 0) {
    return {
      allowed: false,
      reason: "no-calendar",
      showStatus: null,
      autoFinalized: false,
      message:
        "show_calendar snapshot is missing or empty. Cannot verify the show is over. Save calendar sync, or pass force: true to finalize early.",
    };
  }
  const onCalendar = calendarShows.some((s) => s && s.date === showDate);
  if (!onCalendar) {
    return {
      allowed: false,
      reason: "date-not-on-calendar",
      showStatus: null,
      autoFinalized: false,
      message: `Show date ${showDate} is not on the current show_calendar snapshot. Pass force: true to finalize early anyway.`,
    };
  }
  const showStatus = getShowStatus(showDate, calendarShows, nowDate);
  if (showStatus === "PAST") {
    return {
      allowed: true,
      reason: "past",
      showStatus,
      autoFinalized: false,
    };
  }
  const human =
    showStatus === "LIVE"
      ? "This show is LIVE (picks locked) — wait until the calendar date is PAST in the venue timezone, or use force after post-encore auto-finalize."
      : showStatus === "NEXT"
        ? "This show is still NEXT on the calendar — not finalizable until it becomes PAST."
        : "This show date is still FUTURE on the tour calendar — not finalizable yet.";
  return {
    allowed: false,
    reason: "show-not-past",
    showStatus,
    autoFinalized: false,
    message: `${human} (${showStatus}). Pass force: true only if you intentionally finalize early; this is logged on rollup_audit.`,
  };
}

module.exports = {
  DEFAULT_SHOW_TIME_ZONE,
  evaluateManualFinalizeTimingGate,
  getShowStatus,
  getNextShow,
};
