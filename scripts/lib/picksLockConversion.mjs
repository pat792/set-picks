/**
 * Pure join logic for picks_lock conversion (#698).
 *
 * Join key: (userId, showYmd, triggerId=picks_lock_reminder)
 *   — delivery doc id `reminder_{YYYY-MM-DD}_{uid}` + fcm_notification_log fields
 * Conversion: non-empty picks/{showDate}_{uid} with updatedAt < lockInstant
 *
 * No Admin / network I/O here — unit-testable.
 */

export const TRIGGER_ID = "picks_lock_reminder";
export const REMINDER_DOC_RE = /^reminder_(\d{4}-\d{2}-\d{2})_(.+)$/;

const CHANNELS = Object.freeze(["inApp", "push", "email"]);

/**
 * @param {string} docId
 * @returns {{ showYmd: string, userId: string } | null}
 */
export function parseReminderLogDocId(docId) {
  if (typeof docId !== "string") return null;
  const m = docId.match(REMINDER_DOC_RE);
  if (!m) return null;
  return { showYmd: m[1], userId: m[2] };
}

/**
 * @param {unknown} picks
 * @returns {boolean}
 */
export function hasNonEmptyPicksObject(picks) {
  if (picks == null || typeof picks !== "object" || Array.isArray(picks)) {
    return false;
  }
  return Object.values(picks).some(
    (v) => v != null && String(v).trim() !== ""
  );
}

/**
 * @param {string} showDate
 * @param {string} userId
 */
export function pickDocId(showDate, userId) {
  return `${showDate}_${userId}`;
}

/**
 * @param {Date} date
 * @param {string} timeZone
 */
function getZonedParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const map = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value])
  );
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    h: Number(map.hour === "24" ? "0" : map.hour),
    min: Number(map.minute),
    s: Number(map.second),
  };
}

/**
 * Venue-local wall clock → UTC Date (DST-aware via iterative offset).
 *
 * @param {string} ymd YYYY-MM-DD
 * @param {number} hour
 * @param {number} minute
 * @param {string} timeZone IANA
 * @returns {Date}
 */
export function venueLocalToUtc(ymd, hour, minute, timeZone) {
  const [y, m, d] = ymd.split("-").map(Number);
  let utc = Date.UTC(y, m - 1, d, hour, minute, 0);
  for (let i = 0; i < 4; i += 1) {
    const parts = getZonedParts(new Date(utc), timeZone);
    const asLocalMs = Date.UTC(
      parts.y,
      parts.m - 1,
      parts.d,
      parts.h,
      parts.min,
      parts.s
    );
    const wantedMs = Date.UTC(y, m - 1, d, hour, minute, 0);
    const delta = wantedMs - asLocalMs;
    if (delta === 0) break;
    utc += delta;
  }
  return new Date(utc);
}

/**
 * @param {unknown} value Firestore Timestamp | Date | string | number | null
 * @returns {Date | null}
 */
export function toDate(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value?.toDate === "function") {
    try {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    } catch {
      return null;
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (
    typeof value === "object" &&
    typeof value.seconds === "number" &&
    Number.isFinite(value.seconds)
  ) {
    const d = new Date(value.seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Hours from event → lock (positive = before lock).
 * @param {Date | null} eventAt
 * @param {Date} lockAt
 * @returns {number | null}
 */
export function hoursBeforeLock(eventAt, lockAt) {
  if (!eventAt || !lockAt) return null;
  return (lockAt.getTime() - eventAt.getTime()) / (1000 * 60 * 60);
}

/**
 * @param {number[]} values
 * @returns {number | null}
 */
export function median(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * @param {number} n
 * @param {number} d
 * @returns {number | null}
 */
export function pct(n, d) {
  if (!d) return null;
  return Math.round((n / d) * 1000) / 10;
}

/**
 * @typedef {{
 *   docId: string,
 *   userId: string,
 *   showYmd: string,
 *   channels: string[],
 *   decidedAt: Date | null,
 * }} DeliveryRow
 *
 * @typedef {{
 *   userId: string,
 *   showDate: string,
 *   hasPicks: boolean,
 *   updatedAt: Date | null,
 *   inboxReadAt?: Date | null,
 * }} PickJoinRow
 *
 * @typedef {{
 *   showYmd: string,
 *   timeZone: string,
 *   lockHour: number,
 *   lockMinute: number,
 *   lockAt: Date,
 * }} ShowLockMeta
 */

/**
 * @param {DeliveryRow[]} deliveries
 * @param {Map<string, PickJoinRow>} pickByKey key = `${showYmd}_${userId}`
 * @param {Map<string, ShowLockMeta>} lockByShow
 */
export function computeShowConversion(deliveries, pickByKey, lockByShow) {
  /** @type {Map<string, object>} */
  const byShow = new Map();

  for (const d of deliveries) {
    const lock = lockByShow.get(d.showYmd);
    if (!lock) continue;

    if (!byShow.has(d.showYmd)) {
      byShow.set(d.showYmd, {
        showYmd: d.showYmd,
        deliveredUsers: 0,
        convertedBeforeLock: 0,
        convertedAfterLock: 0,
        neverConverted: 0,
        deliverHrsBeforeLock: [],
        submitHrsBeforeLock: [],
        inboxReadHrsBeforeLock: [],
        channels: Object.fromEntries(
          CHANNELS.map((c) => [
            c,
            { delivered: 0, convertedBeforeLock: 0 },
          ])
        ),
      });
    }
    const row = byShow.get(d.showYmd);
    row.deliveredUsers += 1;

    const hrsDeliver = hoursBeforeLock(d.decidedAt, lock.lockAt);
    if (hrsDeliver != null) row.deliverHrsBeforeLock.push(hrsDeliver);

    const channels = Array.isArray(d.channels) ? d.channels : [];
    for (const c of CHANNELS) {
      if (channels.includes(c)) row.channels[c].delivered += 1;
    }

    const pick = pickByKey.get(`${d.showYmd}_${d.userId}`);
    const converted = Boolean(pick?.hasPicks);
    const submitAt = pick?.updatedAt ?? null;
    const beforeLock =
      converted &&
      submitAt != null &&
      submitAt.getTime() < lock.lockAt.getTime();
    const afterLock =
      converted &&
      (submitAt == null || submitAt.getTime() >= lock.lockAt.getTime());

    if (beforeLock) {
      row.convertedBeforeLock += 1;
      const hrsSubmit = hoursBeforeLock(submitAt, lock.lockAt);
      if (hrsSubmit != null) row.submitHrsBeforeLock.push(hrsSubmit);
      for (const c of CHANNELS) {
        if (channels.includes(c)) row.channels[c].convertedBeforeLock += 1;
      }
    } else if (afterLock) {
      row.convertedAfterLock += 1;
    } else {
      row.neverConverted += 1;
    }

    const readAt = pick?.inboxReadAt ?? null;
    const hrsRead = hoursBeforeLock(readAt, lock.lockAt);
    if (hrsRead != null) row.inboxReadHrsBeforeLock.push(hrsRead);
  }

  return [...byShow.values()]
    .map((row) => ({
      showYmd: row.showYmd,
      deliveredUsers: row.deliveredUsers,
      convertedBeforeLock: row.convertedBeforeLock,
      convertedAfterLock: row.convertedAfterLock,
      neverConverted: row.neverConverted,
      convPct: pct(row.convertedBeforeLock, row.deliveredUsers),
      medianHrsDeliverToLock: median(row.deliverHrsBeforeLock),
      medianHrsSubmitToLock: median(row.submitHrsBeforeLock),
      medianHrsInboxReadToLock: median(row.inboxReadHrsBeforeLock),
      channels: Object.fromEntries(
        CHANNELS.map((c) => {
          const ch = row.channels[c];
          return [
            c,
            {
              delivered: ch.delivered,
              convertedBeforeLock: ch.convertedBeforeLock,
              convPct: pct(ch.convertedBeforeLock, ch.delivered),
            },
          ];
        })
      ),
    }))
    .sort((a, b) => a.showYmd.localeCompare(b.showYmd));
}

/**
 * @param {ReturnType<typeof computeShowConversion>} showRows
 */
export function aggregateChannelSplit(showRows) {
  const out = Object.fromEntries(
    CHANNELS.map((c) => [c, { delivered: 0, convertedBeforeLock: 0 }])
  );
  for (const row of showRows) {
    for (const c of CHANNELS) {
      out[c].delivered += row.channels[c].delivered;
      out[c].convertedBeforeLock += row.channels[c].convertedBeforeLock;
    }
  }
  return CHANNELS.map((c) => ({
    channel: c,
    delivered: out[c].delivered,
    convertedBeforeLock: out[c].convertedBeforeLock,
    convPct: pct(out[c].convertedBeforeLock, out[c].delivered),
  }));
}

/**
 * @param {object} opts
 * @param {string} opts.windowLabel
 * @param {string[]} opts.showDates
 * @param {string} opts.generatedAt ISO
 * @param {ReturnType<typeof computeShowConversion>} opts.showRows
 * @param {ReturnType<typeof aggregateChannelSplit>} opts.channelSplit
 * @param {string[]} [opts.caveats]
 */
export function formatConversionMarkdown(opts) {
  const {
    windowLabel,
    showDates,
    generatedAt,
    showRows,
    channelSplit,
    caveats = [],
  } = opts;

  const fmt = (n) => (n == null ? "—" : typeof n === "number" ? String(n) : n);
  const pctCell = (n) => (n == null ? "—" : `${n}%`);

  const lines = [
    `# picks_lock conversion — delivery-log join (#698)`,
    ``,
    `- **Window:** ${windowLabel}`,
    `- **Show dates:** ${showDates.length ? showDates.join(", ") : "(none)"}`,
    `- **Generated:** ${generatedAt}`,
    `- **Source:** Firestore Admin read-only (\`fcm_notification_log\` ∩ \`picks\`)`,
    `- **Join key:** \`(userId, showYmd, triggerId=${TRIGGER_ID})\` via doc id \`reminder_{showYmd}_{uid}\``,
    ``,
    `## Per show`,
    ``,
    `| showYmd | delivered | before_lock | after_lock | never | conv_% | med_hrs_deliver→lock | med_hrs_submit→lock |`,
    `|---|---:|---:|---:|---:|---:|---:|---:|`,
  ];

  for (const r of showRows) {
    lines.push(
      `| ${r.showYmd} | ${r.deliveredUsers} | ${r.convertedBeforeLock} | ${r.convertedAfterLock} | ${r.neverConverted} | ${pctCell(r.convPct)} | ${fmt(r.medianHrsDeliverToLock == null ? null : Math.round(r.medianHrsDeliverToLock * 10) / 10)} | ${fmt(r.medianHrsSubmitToLock == null ? null : Math.round(r.medianHrsSubmitToLock * 10) / 10)} |`
    );
  }
  if (showRows.length === 0) {
    lines.push(`| — | 0 | 0 | 0 | 0 | — | — | — |`);
  }

  lines.push(
    ``,
    `## Channel split (non-exclusive)`,
    ``,
    `Users with multiple successful channels appear in each channel row.`,
    ``,
    `| channel | delivered | before_lock | conv_% |`,
    `|---|---:|---:|---:|`
  );
  for (const c of channelSplit) {
    lines.push(
      `| ${c.channel} | ${c.delivered} | ${c.convertedBeforeLock} | ${pctCell(c.convPct)} |`
    );
  }

  lines.push(``, `## Caveats`, ``);
  const defaultCaveats = [
    "GA4 session join not used (client GA4 has no `user_id`; no BigQuery export).",
    "`channels[]` = successful send planes, not exclusive attribution.",
    "Email opens still Resend/#512 / UTM proxy until wired.",
    "Conversion = non-empty picks with `updatedAt` strictly before venue-local lock instant.",
  ];
  for (const c of [...defaultCaveats, ...caveats]) {
    lines.push(`- ${c}`);
  }
  lines.push(``);

  return lines.join("\n");
}
