const crypto = require("node:crypto");

const LIVE_AUTOMATION_COLLECTION = "live_setlist_automation";
const OFFICIAL_SETLISTS_COLLECTION = "official_setlists";
const PHISHNET_API_ROOT = "https://api.phish.net/v5/setlists/showdate";
const MAX_BACKOFF_MINUTES = 30;

const SLOT_KEYS = ["s1o", "s1c", "s2o", "s2c", "enc"];

/** Minimum shows-since-last-play for a song to count as a bustout. Mirrors SCORING_RULES.BUSTOUT_MIN_GAP. */
const BUSTOUT_MIN_GAP = 30;

/** Normalize a song title for dedupe/compare (must match `normalizeSong` in scoring code). */
function normalizeSongTitle(value) {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Parse a Phish.net setlist row `gap` field into a non-negative integer or null.
 * Phish.net has returned gap as number or numeric string across versions; treat
 * anything unparseable or negative as "unknown" (null).
 */
function parseRowGap(gap) {
  if (typeof gap === "number" && Number.isFinite(gap) && gap >= 0) {
    return Math.trunc(gap);
  }
  if (typeof gap === "string") {
    const n = Number.parseInt(gap.trim(), 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function formatEtShowDate(now = new Date()) {
  const asEt = now.toLocaleString("en-CA", { timeZone: "America/New_York" });
  return String(asEt).slice(0, 10);
}

/** Wall-clock hour 0–23 in `America/New_York` for `now`. */
function getEtHour(now = new Date()) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  });
  const parts = dtf.formatToParts(now);
  const hPart = parts.find((p) => p.type === "hour");
  return Number.parseInt(String(hPart?.value ?? "0"), 10);
}

/**
 * Live setlist scheduled polling window: 4:00 PM ET through 3:00 AM ET the next
 * calendar day (active when hour ≥ 16 or hour < 3, America/New_York wall clock).
 */
function isWithinLiveSetlistPollWindow(now = new Date()) {
  const h = getEtHour(now);
  return h >= 16 || h < 3;
}

function ymdDaysAgo(ymd, days) {
  const [y, m, d] = String(ymd)
    .split("-")
    .map((x) => Number.parseInt(x, 10));
  const t = Date.UTC(y, m - 1, d) - days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * Admin / manual recovery: ET today + ET yesterday (not gated on show_calendar).
 * Used by `pollLiveSetlistNow` when no explicit date is passed.
 */
function candidateShowDates(now = new Date()) {
  const etToday = formatEtShowDate(now);
  return [etToday, ymdDaysAgo(etToday, 1)];
}

/**
 * Parse `show_calendar/snapshot` into a Set of YYYY-MM-DD show dates.
 * Returns `null` if missing, empty, or unreadable (strict — scheduled poller must skip).
 */
function parseShowCalendarSnapshotToDateSet(snapshotData) {
  if (!snapshotData || typeof snapshotData !== "object") return null;
  const raw = snapshotData.showDates;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const set = new Set();
  for (const item of raw) {
    const d =
      typeof item === "string"
        ? item
        : item && typeof item === "object" && typeof item.date === "string"
        ? item.date
        : null;
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) set.add(d);
  }
  return set.size > 0 ? set : null;
}

/**
 * Scheduled poller target dates (intersected with show_calendar in the caller).
 *
 * - Always consider ET "today" when it is a show date in the calendar set.
 * - Do not include "yesterday" by default (before local ET midnight).
 * - After local midnight ET (hours 0–2), also include "yesterday" when that date
 *   is still a show date — same gig can receive encore/post-midnight updates until
 *   the 3 AM window end. This is **not** comparing two setlists: each `showDate`
 *   doc is still diffed only against its own last saved official payload/signature.
 */
function scheduledCandidateShowDates(now, calendarDateSet) {
  const etToday = formatEtShowDate(now);
  const etYesterday = ymdDaysAgo(etToday, 1);
  const hourEt = getEtHour(now);
  const out = [];
  if (calendarDateSet.has(etToday)) out.push(etToday);
  if (hourEt >= 0 && hourEt < 3 && calendarDateSet.has(etYesterday)) {
    out.push(etYesterday);
  }
  return out;
}

/** Uniform random delay in [3, 5] minutes — scheduled cadence jitter (issue #180). */
function randomScheduledPollDelayMs(rng = Math.random) {
  const min = 3 * 60 * 1000;
  const max = 5 * 60 * 1000;
  return min + Math.floor(rng() * (max - min + 1));
}

function phishNetResponseOk(data) {
  const apiErr = data && typeof data === "object" ? data.error : undefined;
  return (
    apiErr === undefined ||
    apiErr === null ||
    apiErr === false ||
    apiErr === 0 ||
    apiErr === "0"
  );
}

function classifySetLabel(setLabel) {
  const raw = String(setLabel ?? "").trim().toLowerCase();
  if (raw === "e" || raw === "encore" || raw.startsWith("encore")) {
    return { kind: "encore", order: 1000 };
  }
  const m = /^set\s*(\d+)$/.exec(raw);
  if (m) return { kind: "main", order: Number.parseInt(m[1], 10) };
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n) && n >= 0) return { kind: "main", order: n };
  return { kind: "other", order: 500 };
}

function compareRows(a, b) {
  const ca = classifySetLabel(a.setKey);
  const cb = classifySetLabel(b.setKey);
  if (ca.order !== cb.order) return ca.order - cb.order;
  if (a.position !== b.position) return a.position - b.position;
  return a.title.localeCompare(b.title);
}

function normalizeSetlistRows(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Phish.net payload must be an object.");
  }
  if (!phishNetResponseOk(payload)) {
    const msg =
      typeof payload.error_message === "string"
        ? payload.error_message
        : "Phish.net API error.";
    throw new Error(msg);
  }
  const data = payload.data;
  if (!Array.isArray(data)) {
    throw new Error("Phish.net payload has no data array.");
  }
  const rows = [];
  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const song = typeof row.song === "string" ? row.song.trim() : "";
    if (!song) continue;
    const setRaw = row.set;
    const setKey =
      typeof setRaw === "string"
        ? setRaw.trim()
        : typeof setRaw === "number"
        ? String(setRaw)
        : "unknown";
    const position =
      typeof row.position === "number" && Number.isFinite(row.position)
        ? row.position
        : typeof row.idx === "number" && Number.isFinite(row.idx)
        ? row.idx
        : 0;
    const gap = parseRowGap(row.gap);
    rows.push({ setKey: setKey || "unknown", position, title: song, gap });
  }
  rows.sort(compareRows);
  return rows;
}

function buildSetlistDocFromRows(rows, existingDoc = {}) {
  const officialSetlist = rows.map((r) => r.title).filter(Boolean);
  const slots = {};
  for (const key of SLOT_KEYS) slots[key] = "";

  const bySet = new Map();
  for (const row of rows) {
    if (!bySet.has(row.setKey)) bySet.set(row.setKey, []);
    bySet.get(row.setKey).push(row);
  }
  const set1 = bySet.get("1");
  const set2 = bySet.get("2");
  const encRows = [...bySet.entries()]
    .filter(([k]) => classifySetLabel(k).kind === "encore")
    .flatMap(([, arr]) => arr)
    .sort((a, b) => a.position - b.position);

  /** Set 1 closer is unknown until set 2 has started (live feeds list the current last song). */
  const set1Complete = Boolean(set2?.length);
  /** Set 2 closer is unknown until the encore has started. */
  const set2Complete = Boolean(encRows.length);

  if (set1?.length) {
    set1.sort((a, b) => a.position - b.position);
    slots.s1o = set1[0].title;
    if (set1Complete) {
      slots.s1c = set1[set1.length - 1].title;
    }
  }
  if (set2?.length) {
    set2.sort((a, b) => a.position - b.position);
    slots.s2o = set2[0].title;
    if (set2Complete) {
      slots.s2c = set2[set2.length - 1].title;
    }
  }
  const encoreSongsFromRows = encRows.map((r) => r.title).filter(Boolean);
  if (encoreSongsFromRows.length) {
    slots.enc = encoreSongsFromRows[0];
  }

  // Preserve prior slot values when the upstream payload is still partial.
  // Do not preserve set closers: a stale closer would keep wrong live scores until the set ends.
  const prevSlots = existingDoc?.setlist || {};
  const noPreserveKeys = new Set(["s1c", "s2c"]);
  for (const key of SLOT_KEYS) {
    if (noPreserveKeys.has(key)) continue;
    if (!slots[key] && typeof prevSlots[key] === "string" && prevSlots[key].trim()) {
      slots[key] = prevSlots[key].trim();
    }
  }

  const prevEncoreSongs = Array.isArray(existingDoc?.encoreSongs)
    ? existingDoc.encoreSongs.map((t) => String(t ?? "").trim()).filter(Boolean)
    : [];
  const encoreSongs =
    encoreSongsFromRows.length > 0 ? encoreSongsFromRows : prevEncoreSongs;

  // Per-show bustout snapshot from per-row pre-show gap (#214). Phish.net
  // setlist rows expose `gap` = shows since the song was last played prior to
  // this show. Freezing that at save time decouples scoring from the weekly
  // `song-catalog.json` refresh cadence, which would reset to gap ≈ 0 after
  // this show plays and silently erase the bustout boost.
  const bustoutsFromRows = deriveBustoutsFromRows(rows);
  const prevBustouts = Array.isArray(existingDoc?.bustouts)
    ? existingDoc.bustouts
        .map((t) => String(t ?? "").trim())
        .filter(Boolean)
    : [];
  // Live automation may see a partial feed (only set 1 so far). Preserve the
  // wider `bustouts` superset so mid-show polls never shrink the list and
  // erase a bustout captured in a prior poll. Rows that newly appear extend
  // the list; rows that existed but no longer appear (very rare edit) remain.
  const bustouts = mergeBustouts(prevBustouts, bustoutsFromRows);

  return {
    setlist: slots,
    officialSetlist,
    encoreSongs,
    bustouts,
  };
}

/**
 * @param {{ title: string, gap: number | null }[]} rows
 * @returns {string[]} original-cased titles, deduped by normalized form
 */
function deriveBustoutsFromRows(rows) {
  const seenNormalized = new Set();
  const out = [];
  for (const row of rows) {
    if (!row || typeof row.title !== "string") continue;
    const title = row.title.trim();
    if (!title) continue;
    const gap = typeof row.gap === "number" ? row.gap : parseRowGap(row.gap);
    if (gap == null || gap < BUSTOUT_MIN_GAP) continue;
    const norm = normalizeSongTitle(title);
    if (seenNormalized.has(norm)) continue;
    seenNormalized.add(norm);
    out.push(title);
  }
  return out;
}

/**
 * Union of two bustout string[] lists, deduped by normalized title, preserving
 * the first occurrence's original casing. `prev` takes precedence so the
 * stored casing is stable across polls.
 */
function mergeBustouts(prev, next) {
  const seen = new Set();
  const out = [];
  for (const list of [prev, next]) {
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      const title = typeof raw === "string" ? raw.trim() : "";
      if (!title) continue;
      const norm = normalizeSongTitle(title);
      if (seen.has(norm)) continue;
      seen.add(norm);
      out.push(title);
    }
  }
  return out;
}

function signatureFromRows(rows) {
  const stable = rows.map((r) => `${r.setKey}|${r.position}|${r.title}`).join("\n");
  return crypto.createHash("sha256").update(stable).digest("hex");
}

function setlistPayloadEqual(a, b) {
  const aSet = a?.setlist || {};
  const bSet = b?.setlist || {};
  if (JSON.stringify(aSet) !== JSON.stringify(bSet)) return false;
  const aOrder = Array.isArray(a?.officialSetlist) ? a.officialSetlist : [];
  const bOrder = Array.isArray(b?.officialSetlist) ? b.officialSetlist : [];
  if (JSON.stringify(aOrder) !== JSON.stringify(bOrder)) return false;
  const aEnc = Array.isArray(a?.encoreSongs) ? a.encoreSongs : [];
  const bEnc = Array.isArray(b?.encoreSongs) ? b.encoreSongs : [];
  if (JSON.stringify(aEnc) !== JSON.stringify(bEnc)) return false;
  // Compare `bustouts` by normalized set so a pure casing/ordering change
  // does not trigger a re-score write; a real membership change does (#214).
  const aBust = Array.isArray(a?.bustouts) ? a.bustouts : [];
  const bBust = Array.isArray(b?.bustouts) ? b.bustouts : [];
  const aNorm = [...new Set(aBust.map((t) => normalizeSongTitle(t)).filter(Boolean))].sort();
  const bNorm = [...new Set(bBust.map((t) => normalizeSongTitle(t)).filter(Boolean))].sort();
  return JSON.stringify(aNorm) === JSON.stringify(bNorm);
}

function nextBackoffMinutes(failureCount) {
  const n = Number.isFinite(failureCount) ? Math.max(1, failureCount) : 1;
  return Math.min(2 ** (n - 1), MAX_BACKOFF_MINUTES);
}

async function fetchPhishnetSetlistForDate(showDate, apiKey) {
  const url = `${PHISHNET_API_ROOT}/${encodeURIComponent(
    showDate
  )}.json?apikey=${encodeURIComponent(String(apiKey).trim())}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${bodyText.slice(0, 240)}`);
  }
  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    throw new Error("Phish.net returned non-JSON payload.");
  }
  return payload;
}

async function pollSingleShowDate({
  db,
  admin,
  showDate,
  apiKey,
  logger,
  force = false,
  requestorEmail = null,
}) {
  const started = Date.now();
  const automationRef = db.collection(LIVE_AUTOMATION_COLLECTION).doc(showDate);
  const setlistRef = db.collection(OFFICIAL_SETLISTS_COLLECTION).doc(showDate);
  const [automationSnap, setlistSnap] = await Promise.all([
    automationRef.get(),
    setlistRef.get(),
  ]);
  const automation = automationSnap.exists ? automationSnap.data() || {} : {};
  if (!force && automation.enabled === false) {
    return { showDate, skipped: "paused", changed: false, updatedPicks: 0 };
  }

  const now = Date.now();
  const nextPollAtMs =
    automation?.nextPollAt && typeof automation.nextPollAt.toMillis === "function"
      ? automation.nextPollAt.toMillis()
      : null;
  if (!force && nextPollAtMs != null && nextPollAtMs > now) {
    return { showDate, skipped: "backoff", changed: false, updatedPicks: 0 };
  }

  const scheduledCadenceStamp = () =>
    !force
      ? {
          nextPollAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + randomScheduledPollDelayMs())
          ),
        }
      : {};

  try {
    const payload = await fetchPhishnetSetlistForDate(showDate, apiKey);
    const rows = normalizeSetlistRows(payload);
    if (rows.length === 0) {
      if (!force) {
        await automationRef.set(
          {
            showDate,
            enabled: automation.enabled !== false,
            failureCount: 0,
            lastPolledAt: admin.firestore.FieldValue.serverTimestamp(),
            lastResult: "no-rows",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            ...scheduledCadenceStamp(),
          },
          { merge: true }
        );
      }
      return { showDate, changed: false, updatedPicks: 0, reason: "no-rows" };
    }

    const signature = signatureFromRows(rows);
    const prev = setlistSnap.exists ? setlistSnap.data() || {} : {};
    const prevSignature =
      prev?.sourceMeta && typeof prev.sourceMeta.signature === "string"
        ? prev.sourceMeta.signature
        : null;
    const nextPayload = buildSetlistDocFromRows(rows, prev);

    if (prevSignature === signature || setlistPayloadEqual(prev, nextPayload)) {
      await automationRef.set(
        {
          showDate,
          enabled: automation.enabled !== false,
          failureCount: 0,
          lastPolledAt: admin.firestore.FieldValue.serverTimestamp(),
          lastResult: "no-change",
          lastNoChangeAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          ...scheduledCadenceStamp(),
        },
        { merge: true }
      );
      return { showDate, changed: false, updatedPicks: 0, reason: "unchanged" };
    }

    const setlistPayload = {
      showDate,
      status: "LIVE",
      isScored: false,
      setlist: nextPayload.setlist,
      officialSetlist: nextPayload.officialSetlist,
      encoreSongs: nextPayload.encoreSongs || [],
      bustouts: nextPayload.bustouts || [],
      updatedBy: requestorEmail || "setlist-automation",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      sourceMeta: {
        source: "phishnet",
        signature,
        songCount: rows.length,
        lastFetchedAt: admin.firestore.FieldValue.serverTimestamp(),
        pollMode: force ? "manual" : "scheduled",
      },
    };
    const automationPayload = {
      showDate,
      enabled: automation.enabled !== false,
      failureCount: 0,
      lastPolledAt: admin.firestore.FieldValue.serverTimestamp(),
      lastResult: "changed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...scheduledCadenceStamp(),
    };
    const batch = db.batch();
    batch.set(setlistRef, setlistPayload, { merge: true });
    batch.set(automationRef, automationPayload, { merge: true });
    await batch.commit();
    return { showDate, changed: true, updatedPicks: null, durationMs: Date.now() - started };
  } catch (e) {
    const failureCount = Number(automation.failureCount || 0) + 1;
    const backoffMinutes = nextBackoffMinutes(failureCount);
    const nextPollAt = new Date(Date.now() + backoffMinutes * 60_000);
    await automationRef.set(
      {
        showDate,
        enabled: automation.enabled !== false,
        failureCount,
        nextPollAt: admin.firestore.Timestamp.fromDate(nextPollAt),
        lastResult: "error",
        lastError: e instanceof Error ? e.message : String(e),
        lastErrorAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    logger?.error?.("live setlist poll failed", {
      showDate,
      failureCount,
      backoffMinutes,
      error: e instanceof Error ? e.message : String(e),
    });
    return {
      showDate,
      changed: false,
      updatedPicks: 0,
      error: e instanceof Error ? e.message : String(e),
      failureCount,
      backoffMinutes,
    };
  }
}

module.exports = {
  BUSTOUT_MIN_GAP,
  buildSetlistDocFromRows,
  candidateShowDates,
  deriveBustoutsFromRows,
  fetchPhishnetSetlistForDate,
  getEtHour,
  isWithinLiveSetlistPollWindow,
  normalizeSetlistRows,
  parseShowCalendarSnapshotToDateSet,
  pollSingleShowDate,
  randomScheduledPollDelayMs,
  scheduledCandidateShowDates,
  setlistPayloadEqual,
  signatureFromRows,
};
