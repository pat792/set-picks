const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { PHISH_SONGS: phishSongs } = require("./phishSongs");
const {
  syncPhishnetShowCalendarToFirestore,
} = require("./phishnetShowCalendar");
const {
  syncPhishnetSongCatalogToStorage,
} = require("./phishnetSongCatalog");
const {
  candidateShowDates,
  isWithinLiveSetlistPollWindow,
  parseShowCalendarSnapshotToDateSet,
  pollSingleShowDate,
  scheduledCandidateShowDates,
} = require("./phishnetLiveSetlistAutomation");

/** Must match admin setlist gate in `src/features/admin/model/useAdminSetlistForm.js`. */
const ADMIN_EMAIL_FOR_SETLIST_PROXY = "pat@road2media.com";

const phishnetApiKey = defineSecret("PHISHNET_API_KEY");

admin.initializeApp();
const db = admin.firestore();

// Mirrors src/utils/scoring.js (keep in sync).
const SCORING_RULES = {
  EXACT_SLOT: 10,
  ENCORE_EXACT: 15,
  IN_SETLIST: 5,
  WILDCARD_HIT: 10,
  BUSTOUT_BOOST: 20,
  BUSTOUT_MIN_GAP: 30,
};

const SCORE_FIELDS = ["s1o", "s1c", "s2o", "s2c", "enc", "wild"];

/** Keys on the scoring payload that are not slot song strings. */
const NON_SONG_SETLIST_KEYS = new Set(["officialSetlist", "id", "bustouts"]);

function normalizeSong(value) {
  return String(value ?? "").trim().toLowerCase();
}

function parseGap(gap) {
  if (gap == null || gap === "" || gap === "—") return null;
  const n = Number.parseInt(String(gap), 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Slot strings from the flat map plus ordered officialSetlist, normalized and deduped.
 * Same as buildAllPlayedNormalized in src/utils/scoring.js.
 * @param {Record<string, unknown>} actualSetlist
 * @returns {string[]}
 */
function buildAllPlayedNormalized(actualSetlist) {
  const fromSlots = [];
  for (const [key, val] of Object.entries(actualSetlist || {})) {
    if (NON_SONG_SETLIST_KEYS.has(key)) continue;
    if (typeof val !== "string") continue;
    const t = val.trim();
    if (!t) continue;
    fromSlots.push(normalizeSong(t));
  }

  const rawOfficial = actualSetlist.officialSetlist;
  const fromOfficial = Array.isArray(rawOfficial)
    ? rawOfficial
        .map((s) =>
          typeof s === "string" ? s.trim() : String(s ?? "").trim()
        )
        .filter(Boolean)
        .map((s) => normalizeSong(s))
    : [];

  const combined = [...fromSlots, ...fromOfficial];
  return [...new Set(combined)];
}

/** Matches computeSlotResult + bustout from getSlotScoreBreakdown in src/utils/scoring.js. */
function calculateSlotScore(fieldId, guessedSong, actualSetlist) {
  if (!actualSetlist || !guessedSong) return 0;

  const guess = normalizeSong(guessedSong);
  if (!guess) return 0;

  const allPlayed = buildAllPlayedNormalized(actualSetlist);

  let base = 0;
  if (fieldId === "wild") {
    if (allPlayed.includes(guess)) {
      base = SCORING_RULES.WILDCARD_HIT;
    } else {
      return 0;
    }
  } else {
    const actualExact = normalizeSong(actualSetlist[fieldId]);
    if (actualExact === guess) {
      base =
        fieldId === "enc"
          ? SCORING_RULES.ENCORE_EXACT
          : SCORING_RULES.EXACT_SLOT;
    } else if (allPlayed.includes(guess)) {
      base = SCORING_RULES.IN_SETLIST;
    } else {
      return 0;
    }
  }

  const matched = phishSongs.find(
    (song) => normalizeSong(song.name) === guess
  );
  let bustoutBoost = false;
  if (matched) {
    const gapNum = parseGap(matched.gap);
    bustoutBoost =
      gapNum != null && gapNum >= SCORING_RULES.BUSTOUT_MIN_GAP;
  }

  return base + (bustoutBoost ? SCORING_RULES.BUSTOUT_BOOST : 0);
}

function calculateTotalScore(userPicks, actualSetlist) {
  if (!actualSetlist || !userPicks) return 0;
  return SCORE_FIELDS.reduce((total, fieldId) => {
    return total + calculateSlotScore(fieldId, userPicks[fieldId], actualSetlist);
  }, 0);
}

function assertAdminEmail(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const email = request.auth.token?.email;
  if (email !== ADMIN_EMAIL_FOR_SETLIST_PROXY) {
    throw new HttpsError(
      "permission-denied",
      "Only the designated admin can perform this action."
    );
  }
}

function assertShowDateString(showDate) {
  if (
    typeof showDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(showDate.trim())
  ) {
    throw new HttpsError(
      "invalid-argument",
      "showDate must be a YYYY-MM-DD string."
    );
  }
  return showDate.trim();
}

async function recomputeLiveScoresForShow(showDate, actualSetlistFromWrite = null) {
  const setlistDoc =
    actualSetlistFromWrite ||
    (() => {
      throw new Error("actualSetlistFromWrite required when no Firestore fallback");
    })();
  const picksSnap = await db
    .collection("picks")
    .where("showDate", "==", showDate)
    .get();

  if (picksSnap.empty) {
    return { updatedPicks: 0 };
  }

  const batch = db.batch();
  let updatedPicks = 0;

  picksSnap.forEach((pickDoc) => {
    const pickData = pickDoc.data() || {};
    const userPicks = pickData.picks || {};
    const score = calculateTotalScore(userPicks, setlistDoc);

    // Live scoring only: do not set gradedAt here (pool season uses isGraded from rollup).
    const update = { score };
    if (pickData.isGraded !== true) {
      update.gradedAt = admin.firestore.FieldValue.delete();
    }
    batch.update(pickDoc.ref, update);
    updatedPicks += 1;
  });

  await batch.commit();
  return { updatedPicks };
}

exports.gradePicksOnSetlistWrite = onDocumentWritten(
  "official_setlists/{showDate}",
  async (event) => {
    if (!event.data.after.exists) {
      return null;
    }

    const showDate = event.params.showDate;
    const setlistDoc = event.data.after.data() || {};
    const setlistFlat = setlistDoc.setlist || {};
    const actualSetlist = {
      ...setlistFlat,
      officialSetlist: Array.isArray(setlistDoc.officialSetlist)
        ? setlistDoc.officialSetlist
        : [],
    };

    await recomputeLiveScoresForShow(showDate, actualSetlist);
    return null;
  }
);

const PHISHNET_FUNCTIONS_REGION = "us-central1";

exports.refreshLiveScoresForShow = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    assertAdminEmail(request);
    const showDate = assertShowDateString(request.data?.showDate);

    const setlistSnap = await db
      .collection("official_setlists")
      .doc(showDate)
      .get();
    if (!setlistSnap.exists) {
      throw new HttpsError(
        "failed-precondition",
        `official_setlists/${showDate} does not exist. Save the setlist first.`
      );
    }
    const setlistDoc = setlistSnap.data() || {};
    const setlistFlat = setlistDoc.setlist || {};
    const actualSetlist = {
      ...setlistFlat,
      officialSetlist: Array.isArray(setlistDoc.officialSetlist)
        ? setlistDoc.officialSetlist
        : [],
    };
    const result = await recomputeLiveScoresForShow(showDate, actualSetlist);
    return { ok: true, ...result };
  }
);

exports.scheduledPhishnetLiveSetlistPoll = onSchedule(
  {
    // Wake every 3m; in-window spacing vs Phish.net is enforced by per-date
    // `nextPollAt` (3–5m jitter after each scheduled fetch — issue #180).
    schedule: "*/3 * * * *",
    timeZone: "America/New_York",
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
  },
  async () => {
    const key = phishnetApiKey.value();
    if (!key || !String(key).trim()) {
      logger.error(
        "scheduledPhishnetLiveSetlistPoll: PHISHNET_API_KEY missing; skip poll."
      );
      return null;
    }
    const now = new Date();
    if (!isWithinLiveSetlistPollWindow(now)) {
      logger.info("scheduledPhishnetLiveSetlistPoll: outside 4pm–3am ET window; skip.");
      return null;
    }
    const calSnap = await db.collection("show_calendar").doc("snapshot").get();
    const calendarSet = parseShowCalendarSnapshotToDateSet(
      calSnap.exists ? calSnap.data() : null
    );
    if (!calendarSet) {
      logger.info(
        "scheduledPhishnetLiveSetlistPoll: show_calendar snapshot missing/empty; strict skip (no Phish.net)."
      );
      return null;
    }
    const dates = scheduledCandidateShowDates(now, calendarSet);
    if (!dates.length) {
      logger.info(
        "scheduledPhishnetLiveSetlistPoll: no matching show dates in calendar; skip."
      );
      return null;
    }
    const started = Date.now();
    const results = [];
    for (const showDate of dates) {
      const result = await pollSingleShowDate({
        db,
        admin,
        showDate,
        apiKey: String(key).trim(),
        logger,
        force: false,
      });
      results.push(result);
    }
    logger.info("live setlist poll cycle", {
      dates,
      results,
      durationMs: Date.now() - started,
    });
    return null;
  }
);

exports.setLiveSetlistAutomationState = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    assertAdminEmail(request);
    const showDate = assertShowDateString(request.data?.showDate);
    const enabled = request.data?.enabled;
    if (typeof enabled !== "boolean") {
      throw new HttpsError("invalid-argument", "enabled must be boolean.");
    }
    await db
      .collection("live_setlist_automation")
      .doc(showDate)
      .set(
        {
          showDate,
          enabled,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: request.auth.token?.email ?? null,
          pausedAt: enabled
            ? admin.firestore.FieldValue.delete()
            : admin.firestore.FieldValue.serverTimestamp(),
          pausedBy: enabled
            ? admin.firestore.FieldValue.delete()
            : request.auth.token?.email ?? null,
        },
        { merge: true }
      );
    return { ok: true, showDate, enabled };
  }
);

exports.pollLiveSetlistNow = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    assertAdminEmail(request);
    const key = phishnetApiKey.value();
    if (!key || !String(key).trim()) {
      throw new HttpsError(
        "failed-precondition",
        "Phish.net API key is not configured (set secret PHISHNET_API_KEY)."
      );
    }
    const explicitShowDate = request.data?.showDate;
    const dates =
      explicitShowDate == null
        ? candidateShowDates(new Date())
        : [assertShowDateString(explicitShowDate)];
    const started = Date.now();
    const results = [];
    for (const showDate of dates) {
      const result = await pollSingleShowDate({
        db,
        admin,
        showDate,
        apiKey: String(key).trim(),
        logger,
        force: true,
        requestorEmail: request.auth.token?.email ?? null,
      });
      if (result.changed) {
        const setlistSnap = await db.collection("official_setlists").doc(showDate).get();
        const setlistDoc = setlistSnap.data() || {};
        const actualSetlist = {
          ...(setlistDoc.setlist || {}),
          officialSetlist: Array.isArray(setlistDoc.officialSetlist)
            ? setlistDoc.officialSetlist
            : [],
        };
        result.updatedPicks = (
          await recomputeLiveScoresForShow(showDate, actualSetlist)
        ).updatedPicks;
      }
      results.push(result);
    }
    logger.info("manual live setlist poll", {
      dates,
      results,
      durationMs: Date.now() - started,
    });
    return { ok: true, dates, results };
  }
);

/**
 * Secure proxy for Phish.net v5 setlists/showdate (epic #42, issue #146).
 * Secret: `PHISHNET_API_KEY` via `firebase functions:secrets:set PHISHNET_API_KEY`
 */
exports.getPhishnetSetlist = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
    // Gen 2 callables run on Cloud Run; without public invoker, browsers get CORS preflight failures
    // (no Access-Control-Allow-Origin) and FirebaseError: internal. Auth is still enforced in handler.
    invoker: "public",
    // Avoid App Check blocking admin fetch from localhost before debug tokens are registered.
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      assertAdminEmail(request);

      const showDate = request.data?.showDate;
      if (
        typeof showDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(showDate.trim())
      ) {
        throw new HttpsError(
          "invalid-argument",
          "showDate must be a YYYY-MM-DD string."
        );
      }

      const key = phishnetApiKey.value();
      if (!key || !String(key).trim()) {
        throw new HttpsError(
          "failed-precondition",
          "Phish.net API key is not configured (set secret PHISHNET_API_KEY)."
        );
      }

      const url = `https://api.phish.net/v5/setlists/showdate/${encodeURIComponent(
        showDate.trim()
      )}.json?apikey=${encodeURIComponent(String(key).trim())}`;

      let res;
      try {
        res = await fetch(url, { headers: { Accept: "application/json" } });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error to Phish.net";
        // Use `unavailable` (not `internal`) so the client SDK forwards the message; `internal` is redacted.
        throw new HttpsError("unavailable", msg);
      }

      let bodyText;
      try {
        bodyText = await res.text();
      } catch (e) {
        throw new HttpsError(
          "unavailable",
          "Failed to read Phish.net response."
        );
      }

      if (!res.ok) {
        throw new HttpsError(
          "failed-precondition",
          `Phish.net HTTP ${res.status}: ${bodyText.slice(0, 240)}`
        );
      }

      let data;
      try {
        data = JSON.parse(bodyText);
      } catch {
        throw new HttpsError(
          "failed-precondition",
          "Phish.net returned non-JSON."
        );
      }

      // Phish.net: success is `error: false`, `0`, or `"0"`; numeric ≥1 (e.g. 2) = invalid key, etc.
      const apiErr = data && typeof data === "object" ? data.error : undefined;
      const phishNetOk =
        apiErr === undefined ||
        apiErr === null ||
        apiErr === false ||
        apiErr === 0 ||
        apiErr === "0";
      if (!phishNetOk) {
        const apiMsg =
          typeof data.error_message === "string"
            ? data.error_message
            : "Phish.net API error.";
        throw new HttpsError("failed-precondition", apiMsg);
      }

      return data;
    } catch (e) {
      if (e instanceof HttpsError) {
        throw e;
      }
      const msg = e instanceof Error ? e.message : String(e);
      logger.error("getPhishnetSetlist unexpected error", msg, e);
      // Map unexpected throws (e.g. secret/param) to a code whose message is not stripped client-side.
      throw new HttpsError(
        "failed-precondition",
        `getPhishnetSetlist failed: ${msg}`
      );
    }
  }
);

/**
 * Monthly sync: Phish.net v5 `shows/showyear/{year}` → Firestore `show_calendar/snapshot` (issue #160).
 * First of each month 6:00 America/New_York. Same secret as setlist proxy; key never sent to browsers.
 */
exports.scheduledPhishnetShowCalendar = onSchedule(
  {
    schedule: "0 6 1 * *",
    timeZone: "America/New_York",
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
  },
  async () => {
    const key = phishnetApiKey.value();
    if (!key || !String(key).trim()) {
      logger.error(
        "scheduledPhishnetShowCalendar: PHISHNET_API_KEY missing; skip sync."
      );
      return null;
    }
    await syncPhishnetShowCalendarToFirestore(db, String(key).trim(), {
      logger,
    });
    return null;
  }
);

/**
 * Admin-only on-demand refresh of `show_calendar/snapshot` (issue #160).
 */
exports.refreshPhishnetShowCalendar = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Sign in required.");
      }
      const email = request.auth.token?.email;
      if (email !== ADMIN_EMAIL_FOR_SETLIST_PROXY) {
        throw new HttpsError(
          "permission-denied",
          "Only the designated admin can refresh the show calendar."
        );
      }

      const key = phishnetApiKey.value();
      if (!key || !String(key).trim()) {
        throw new HttpsError(
          "failed-precondition",
          "Phish.net API key is not configured (set secret PHISHNET_API_KEY)."
        );
      }

      const result = await syncPhishnetShowCalendarToFirestore(
        db,
        String(key).trim(),
        { logger }
      );
      return {
        ok: true,
        showCount: result.showCount,
        groupCount: result.groupCount,
      };
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      logger.error("refreshPhishnetShowCalendar unexpected error", msg, e);
      throw new HttpsError(
        "failed-precondition",
        `refreshPhishnetShowCalendar failed: ${msg}`
      );
    }
  }
);

/**
 * Weekly sync: Phish.net v5 `songs.json` → Storage `song-catalog.json` (issue #158).
 * Sunday 7:00 America/New_York. Same secret as other Phish.net callables.
 */
exports.scheduledPhishnetSongCatalog = onSchedule(
  {
    schedule: "0 7 * * 0",
    timeZone: "America/New_York",
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
  },
  async () => {
    const key = phishnetApiKey.value();
    if (!key || !String(key).trim()) {
      logger.error(
        "scheduledPhishnetSongCatalog: PHISHNET_API_KEY missing; skip sync."
      );
      return null;
    }
    try {
      const result = await syncPhishnetSongCatalogToStorage(
        String(key).trim(),
        { logger }
      );
      logger.info("scheduledPhishnetSongCatalog public URL", result.publicUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error("scheduledPhishnetSongCatalog failed", msg, e);
    }
    return null;
  }
);

/**
 * Admin-only on-demand refresh of Storage `song-catalog.json` (issue #158).
 */
exports.refreshPhishnetSongCatalog = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      assertAdminEmail(request);

      const key = phishnetApiKey.value();
      if (!key || !String(key).trim()) {
        throw new HttpsError(
          "failed-precondition",
          "Phish.net API key is not configured (set secret PHISHNET_API_KEY)."
        );
      }

      const result = await syncPhishnetSongCatalogToStorage(
        String(key).trim(),
        { logger }
      );
      return {
        ok: true,
        songCount: result.songCount,
        publicUrl: result.publicUrl,
      };
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      logger.error("refreshPhishnetSongCatalog unexpected error", msg, e);
      throw new HttpsError(
        "failed-precondition",
        `refreshPhishnetSongCatalog failed: ${msg}`
      );
    }
  }
);
