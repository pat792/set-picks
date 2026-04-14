const crypto = require("node:crypto");

const LIVE_AUTOMATION_COLLECTION = "live_setlist_automation";
const OFFICIAL_SETLISTS_COLLECTION = "official_setlists";
const PHISHNET_API_ROOT = "https://api.phish.net/v5/setlists/showdate";
const MAX_BACKOFF_MINUTES = 30;

const SLOT_KEYS = ["s1o", "s1c", "s2o", "s2c", "enc"];

function formatEtShowDate(now = new Date()) {
  const asEt = now.toLocaleString("en-CA", { timeZone: "America/New_York" });
  return String(asEt).slice(0, 10);
}

function ymdDaysAgo(ymd, days) {
  const [y, m, d] = String(ymd)
    .split("-")
    .map((x) => Number.parseInt(x, 10));
  const t = Date.UTC(y, m - 1, d) - days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

function candidateShowDates(now = new Date()) {
  const etToday = formatEtShowDate(now);
  return [etToday, ymdDaysAgo(etToday, 1)];
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
    rows.push({ setKey: setKey || "unknown", position, title: song });
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
  if (set1?.length) {
    set1.sort((a, b) => a.position - b.position);
    slots.s1o = set1[0].title;
    if (set1.length > 1) {
      slots.s1c = set1[set1.length - 1].title;
    }
  }
  if (set2?.length) {
    set2.sort((a, b) => a.position - b.position);
    slots.s2o = set2[0].title;
    if (set2.length > 1) {
      slots.s2c = set2[set2.length - 1].title;
    }
  }
  if (encRows.length) {
    slots.enc = encRows[0].title;
  }

  // Preserve prior slot values when the upstream payload is still partial.
  const prevSlots = existingDoc?.setlist || {};
  for (const key of SLOT_KEYS) {
    if (!slots[key] && typeof prevSlots[key] === "string" && prevSlots[key].trim()) {
      slots[key] = prevSlots[key].trim();
    }
  }

  return {
    setlist: slots,
    officialSetlist,
  };
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
  return JSON.stringify(aOrder) === JSON.stringify(bOrder);
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

  try {
    const payload = await fetchPhishnetSetlistForDate(showDate, apiKey);
    const rows = normalizeSetlistRows(payload);
    if (rows.length === 0) {
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
  buildSetlistDocFromRows,
  candidateShowDates,
  normalizeSetlistRows,
  pollSingleShowDate,
  setlistPayloadEqual,
  signatureFromRows,
};
