/**
 * Thin event adapters for v1 comms triggers (#440 / epic #441).
 *
 * Each handler resolves audience + payload vars and calls the shared
 * orchestrator via `createCommsAdapterRuntime`. Handlers are gated by
 * `COMMS_EVENT_ADAPTERS_ENABLED=true` at the call site in `index.js`.
 */

"use strict";

const {
  parseShowCalendarSnapshotToShows,
  parseShowCalendarSnapshotToShowsByTour,
  ymdInTimeZone,
} = require("./phishnetLiveSetlistAutomation");
const { hasNonEmptyPicksObject, resolveTourKeyForDate } = require("./rollupSeasonAggregates");
const {
  createCommsAdapterRuntime,
  isCommsEventAdaptersEnabled,
} = require("./commsAdapterRuntime");
const {
  aggregateTourStandings,
  assignDisplayRanks,
  tourDatesForKey,
  tourDatesThrough,
  priorTourShowDate,
  nextTourShowDate,
  buildTourRankingsDailyPayloadFields,
} = require("./tourRankingsDailyCore");

const DEFAULT_SHOW_TIME_ZONE = "America/Los_Angeles";
const COUNTDOWN_DAYS = [10, 5, 3, 1];
/** Firestore `in` queries allow at most 30 equality values. */
const FIRESTORE_IN_QUERY_LIMIT = 30;

/**
 * @param {unknown} data
 * @returns {string}
 */
function handleFromUser(data) {
  const h = data && typeof data.handle === "string" ? data.handle.trim() : "";
  return h;
}

/**
 * Build showDate → Set(uid) for users with non-empty picks (#509).
 *
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {string[]} showDates
 * @returns {Promise<Map<string, Set<string>>>}
 */
async function loadUserIdsWithPicksForShowDates(db, showDates) {
  const unique = [...new Set(showDates.filter((d) => typeof d === "string" && d.trim()))];
  /** @type {Map<string, Set<string>>} */
  const byDate = new Map();
  for (const d of unique) byDate.set(d, new Set());
  if (unique.length === 0) return byDate;

  for (let i = 0; i < unique.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunk = unique.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
    // eslint-disable-next-line no-await-in-loop
    const snap = await db.collection("picks").where("showDate", "in", chunk).get();
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      const sd = typeof data.showDate === "string" ? data.showDate.trim() : "";
      const uid = typeof data.userId === "string" ? data.userId.trim() : "";
      if (!uid || !byDate.has(sd)) continue;
      if (hasNonEmptyPicksObject(data.picks)) byDate.get(sd).add(uid);
    }
  }
  return byDate;
}

/**
 * Fire when a user doc gains a non-empty handle (profile setup complete).
 *
 * @param {object | null | undefined} before
 * @param {object | null | undefined} after
 */
function shouldDeliverAccountWelcome(before, after) {
  const afterHandle = handleFromUser(after);
  if (!afterHandle) return false;
  const beforeHandle = handleFromUser(before);
  return !beforeHandle;
}

/**
 * Fire on the first persisted pick doc for a show (initial lock-in).
 *
 * @param {boolean} beforeExists
 * @param {object | null | undefined} before
 * @param {object | null | undefined} after
 */
function shouldDeliverPicksConfirmed(beforeExists, before, after) {
  if (beforeExists) return false;
  if (!after || typeof after !== "object") return false;
  return hasNonEmptyPicksObject(after.picks);
}

/**
 * @param {Array<{ date: string, venue?: string, city?: string, timeZone?: string }>} shows
 * @param {string} showDate
 */
function findShowMeta(shows, showDate) {
  if (!Array.isArray(shows)) return null;
  for (const s of shows) {
    if (s && s.date === showDate) return s;
  }
  return null;
}

/**
 * @param {Iterable<{ id?: string, data?: () => object }>} pickDocs
 * @param {Map<string, number>} scoresByPickId
 * @returns {Map<string, { rank: number, score: number, total: number }>}
 */
function computeGlobalRankByUid(pickDocs, scoresByPickId) {
  /** @type {{ uid: string, score: number }[]} */
  const rows = [];
  for (const doc of pickDocs) {
    const d = doc.data?.() || doc.data || {};
    const uid = typeof d.userId === "string" ? d.userId.trim() : "";
    if (!uid || !hasNonEmptyPicksObject(d.picks)) continue;
    const score = scoresByPickId.get(doc.id) ?? (typeof d.score === "number" ? d.score : 0);
    rows.push({ uid, score });
  }
  rows.sort((a, b) => b.score - a.score);
  /** @type {Map<string, { rank: number, score: number, total: number }>} */
  const out = new Map();
  const total = rows.length;
  let rank = 0;
  let prevScore = null;
  for (let i = 0; i < rows.length; i++) {
    const { uid, score } = rows[i];
    if (prevScore === null || score < prevScore) {
      rank = i + 1;
      prevScore = score;
    }
    out.set(uid, { rank, score, total });
  }
  return out;
}

/**
 * @param {Array<{ date: string, timeZone?: string }>} calendarShows
 * @param {Date} now
 * @param {number[]} countdownDays
 */
function findTourCountdownTargets(calendarShows, now, countdownDays = COUNTDOWN_DAYS) {
  if (!Array.isArray(calendarShows) || calendarShows.length === 0) return [];
  const byTour = new Map();
  for (const show of calendarShows) {
    if (!show?.date) continue;
    const tz =
      typeof show.timeZone === "string" && show.timeZone.trim()
        ? show.timeZone.trim()
        : DEFAULT_SHOW_TIME_ZONE;
    const tourKey = show.tour || show.tour_name || "tour";
    const key = `${tourKey}::${show.date}`;
    if (!byTour.has(tourKey) || show.date < byTour.get(tourKey).firstShowDate) {
      byTour.set(tourKey, {
        tourId: tourKey,
        tour_name: tourKey,
        firstShowDate: show.date,
        first_show_date: show.date,
        first_show_venue: show.venue || "",
        first_show_city: show.city || "",
        timeZone: tz,
        lock_time_local: "7:55 PM",
      });
    }
  }

  /** @type {typeof byTour extends Map<string, infer V> ? V[] : never} */
  const hits = [];
  for (const meta of byTour.values()) {
    const todayYmd = ymdInTimeZone(now, meta.timeZone);
    const first = meta.firstShowDate;
    if (!first || todayYmd >= first) continue;
    const msPerDay = 86400000;
    const today = Date.parse(`${todayYmd}T12:00:00Z`);
    const firstMs = Date.parse(`${first}T12:00:00Z`);
    const daysRemaining = Math.round((firstMs - today) / msPerDay);
    if (!countdownDays.includes(daysRemaining)) continue;
    hits.push({ ...meta, days_remaining: daysRemaining });
  }
  return hits;
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   uid: string,
 *   beforeData: object | null | undefined,
 *   afterData: object | null | undefined,
 *   resendApiKey?: string,
 *   logger?: object,
 * }} params
 */
async function handleAccountWelcome({
  db,
  admin,
  uid,
  beforeData,
  afterData,
  resendApiKey,
  logger,
}) {
  if (!isCommsEventAdaptersEnabled()) return null;
  if (!shouldDeliverAccountWelcome(beforeData, afterData)) return null;

  const runtime = createCommsAdapterRuntime({ db, admin, resendApiKey, logger });
  const calSnap = await db.collection("show_calendar").doc("snapshot").get();
  const shows = parseShowCalendarSnapshotToShows(calSnap.exists ? calSnap.data() : null);
  const upcoming = shows.find((s) => s?.date && s.date >= ymdInTimeZone(new Date(), DEFAULT_SHOW_TIME_ZONE));

  const payload = {
    handle: handleFromUser(afterData),
    tour_name: upcoming?.tour || upcoming?.tour_name || null,
    next_show_date: upcoming?.date || null,
    next_show_venue: upcoming?.venue || null,
  };

  return runtime.deliver("account_welcome", [
    {
      uid,
      userData: afterData || {},
      payload,
      vars: { uid },
    },
  ]);
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   pickId: string,
 *   beforeExists: boolean,
 *   beforeData: object | null | undefined,
 *   afterData: object | null | undefined,
 *   resendApiKey?: string,
 *   logger?: object,
 * }} params
 */
async function handlePicksConfirmed({
  db,
  admin,
  pickId,
  beforeExists,
  beforeData,
  afterData,
  resendApiKey,
  logger,
}) {
  if (!isCommsEventAdaptersEnabled()) return null;
  if (!shouldDeliverPicksConfirmed(beforeExists, beforeData, afterData)) return null;

  const uid = typeof afterData?.userId === "string" ? afterData.userId.trim() : "";
  const showDate = typeof afterData?.showDate === "string" ? afterData.showDate.trim() : "";
  if (!uid || !showDate) return null;

  const calSnap = await db.collection("show_calendar").doc("snapshot").get();
  const shows = parseShowCalendarSnapshotToShows(calSnap.exists ? calSnap.data() : null);
  const meta = findShowMeta(shows, showDate);

  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.exists ? userSnap.data() || {} : {};

  const payload = {
    handle: handleFromUser(afterData) || handleFromUser(userData),
    show_date: showDate,
    venue_name: meta?.venue || "",
    venue_city: meta?.city || "",
    opener_pick: afterData?.picks?.opener || null,
    closer_pick: afterData?.picks?.closer || null,
    encore_pick: afterData?.picks?.encore || null,
  };

  const runtime = createCommsAdapterRuntime({ db, admin, resendApiKey, logger });
  return runtime.deliver("picks_confirmed", [
    {
      uid,
      userData,
      payload,
      vars: { uid, showDate },
    },
  ]);
}

/**
 * Post-grade fan-out for show_recap + tour_engagement_reminder (#440).
 *
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   showDate: string,
 *   picksSnap: import("firebase-admin").firestore.QuerySnapshot,
 *   newScoresById: Map<string, number>,
 *   tourKey: string | null,
 *   showDatesByTour: unknown,
 *   resendApiKey?: string,
 *   logger?: object,
 * }} params
 */
async function deliverPostRollupComms({
  db,
  admin,
  showDate,
  picksSnap,
  newScoresById,
  tourKey,
  showDatesByTour,
  resendApiKey,
  logger,
}) {
  if (!isCommsEventAdaptersEnabled()) return null;
  if (!picksSnap || picksSnap.empty) return null;

  const calSnap = await db.collection("show_calendar").doc("snapshot").get();
  const calData = calSnap.exists ? calSnap.data() : null;
  const shows = parseShowCalendarSnapshotToShows(calData);
  const meta = findShowMeta(shows, showDate) || {};
  const ranks = computeGlobalRankByUid(picksSnap.docs, newScoresById);
  const runtime = createCommsAdapterRuntime({ db, admin, resendApiKey, logger });

  const tourDates = tourKey ? tourDatesForKey(showDatesByTour, tourKey) : [];
  const nextDate = nextTourShowDate(tourDates, showDate);
  const nextMeta = nextDate ? findShowMeta(shows, nextDate) || {} : {};
  const showsRemaining =
    tourDates.length > 0 ? tourDates.filter((d) => d > showDate).length : null;
  const securedByNextShow = nextDate
    ? await loadUserIdsWithPicksForShowDates(db, [nextDate])
    : new Map();
  const nextShowSecuredUids = nextDate ? securedByNextShow.get(nextDate) || new Set() : new Set();

  /** @type {Array<{ uid: string, userData?: object, payload: object, vars: object }>} */
  const recapRecipients = [];
  /** @type {Array<{ uid: string, userData?: object, payload: object, vars: object }>} */
  const engagementRecipients = [];

  for (const pickDoc of picksSnap.docs) {
    const pickData = pickDoc.data() || {};
    const uid = typeof pickData.userId === "string" ? pickData.userId.trim() : "";
    if (!uid || !hasNonEmptyPicksObject(pickData.picks)) continue;

    const score = newScoresById.get(pickDoc.id) ?? 0;
    const rankInfo = ranks.get(uid) || { rank: null, score, total: ranks.size };
    const wasGraded = pickData.isGraded === true;

    // eslint-disable-next-line no-await-in-loop
    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};

    recapRecipients.push({
      uid,
      userData,
      payload: {
        handle: handleFromUser(pickData) || handleFromUser(userData),
        show_date: showDate,
        venue_name: meta.venue || "",
        venue_city: meta.city || "",
        show_score: score,
        global_rank: rankInfo.rank,
        global_total_pickers: rankInfo.total,
      },
      vars: { uid, showDate },
    });

    if (!wasGraded && tourKey) {
      const season = userData.seasonStats?.[tourKey];
      const showsBefore = typeof season?.shows === "number" ? season.shows : 0;
      if (showsBefore === 0) {
        engagementRecipients.push({
          uid,
          userData,
          payload: {
            handle: handleFromUser(userData),
            show_score: score,
            global_rank: rankInfo.rank,
            global_total_pickers: rankInfo.total,
            tour_name: tourKey,
            tourId: tourKey,
            shows_remaining: showsRemaining,
            next_show_date: nextDate || "",
            next_show_venue: nextMeta.venue || "",
            // #509: next-show picks (not the graded show just rolled up)
            picks_secured: nextDate ? nextShowSecuredUids.has(uid) : false,
          },
          vars: { uid, tourId: tourKey },
        });
      }
    }
  }

  const recapSummary = await runtime.deliver("show_recap", recapRecipients);
  const engagementSummary =
    engagementRecipients.length > 0
      ? await runtime.deliver("tour_engagement_reminder", engagementRecipients)
      : null;

  return { recapSummary, engagementSummary };
}

/**
 * Live-scoring comms: first points + leader change detection.
 *
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   showDate: string,
 *   beforeScores: Map<string, number>,
 *   afterScores: Map<string, number>,
 *   picksSnap: import("firebase-admin").firestore.QuerySnapshot,
 *   resendApiKey?: string,
 *   logger?: object,
 * }} params
 */
async function deliverLiveScoreComms({
  db,
  admin,
  showDate,
  beforeScores,
  afterScores,
  picksSnap,
  resendApiKey,
  logger,
}) {
  if (!isCommsEventAdaptersEnabled()) return null;

  const runtime = createCommsAdapterRuntime({ db, admin, resendApiKey, logger });
  /** @type {Array<{ uid: string, userData?: object, payload: object, vars: object }>} */
  const firstPoints = [];
  /** @type {Array<{ uid: string, userData?: object, payload: object, vars: object }>} */
  const leaderChanges = [];

  const beforeLeader = leaderUidFromScores(beforeScores, picksSnap);
  const afterLeader = leaderUidFromScores(afterScores, picksSnap);

  for (const pickDoc of picksSnap.docs) {
    const pickData = pickDoc.data() || {};
    const uid = typeof pickData.userId === "string" ? pickData.userId.trim() : "";
    if (!uid) continue;
    const prev = beforeScores.get(pickDoc.id) ?? 0;
    const next = afterScores.get(pickDoc.id) ?? 0;
    if (prev <= 0 && next > 0) {
      // eslint-disable-next-line no-await-in-loop
      const userSnap = await db.collection("users").doc(uid).get();
      const userData = userSnap.exists ? userSnap.data() || {} : {};
      firstPoints.push({
        uid,
        userData,
        payload: {
          handle: handleFromUser(pickData) || handleFromUser(userData),
          show_date: showDate,
          points_earned: next - prev,
        },
        vars: { uid, showDate },
      });
    }
  }

  if (afterLeader && afterLeader !== beforeLeader) {
    const userSnap = await db.collection("users").doc(afterLeader).get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};
    const afterScore = scoreForUid(afterScores, picksSnap, afterLeader);
    const margin = leaderMargin(afterScores, picksSnap, afterLeader);
    leaderChanges.push({
      uid: afterLeader,
      userData,
      payload: {
        handle: handleFromUser(userData),
        show_date: showDate,
        leaderboard_name: "Global",
        lead_margin: margin,
        show_score: afterScore,
      },
      vars: { uid: afterLeader, showDate, leaderboard: "global" },
    });
  }

  const firstSummary =
    firstPoints.length > 0 ? await runtime.deliver("score_first_points", firstPoints) : null;
  const leaderSummary =
    leaderChanges.length > 0 ? await runtime.deliver("score_leader", leaderChanges) : null;
  return { firstSummary, leaderSummary };
}

/**
 * @param {Map<string, number>} scoresByPickId
 * @param {import("firebase-admin").firestore.QuerySnapshot} picksSnap
 */
function leaderUidFromScores(scoresByPickId, picksSnap) {
  let max = -1;
  let leader = null;
  let tie = false;
  for (const doc of picksSnap.docs) {
    const d = doc.data() || {};
    const uid = typeof d.userId === "string" ? d.userId.trim() : "";
    if (!uid || !hasNonEmptyPicksObject(d.picks)) continue;
    const score = scoresByPickId.get(doc.id) ?? 0;
    if (score > max) {
      max = score;
      leader = uid;
      tie = false;
    } else if (score === max && score > 0) {
      tie = true;
    }
  }
  if (tie || max <= 0) return null;
  return leader;
}

function scoreForUid(scoresByPickId, picksSnap, uid) {
  for (const doc of picksSnap.docs) {
    const d = doc.data() || {};
    if (d.userId === uid) return scoresByPickId.get(doc.id) ?? 0;
  }
  return 0;
}

function leaderMargin(scoresByPickId, picksSnap, leaderUid) {
  const scores = [];
  for (const doc of picksSnap.docs) {
    const d = doc.data() || {};
    if (!hasNonEmptyPicksObject(d.picks)) continue;
    scores.push(scoresByPickId.get(doc.id) ?? 0);
  }
  scores.sort((a, b) => b - a);
  const top = scores[0] ?? 0;
  const second = scores[1] ?? 0;
  if (leaderUid && top > 0) return top - second;
  return null;
}

/**
 * Daily scheduled tour countdown (#440).
 */
async function runScheduledTourCountdown({ db, admin, resendApiKey, logger, now = new Date() }) {
  if (!isCommsEventAdaptersEnabled()) return null;

  const calSnap = await db.collection("show_calendar").doc("snapshot").get();
  // #514: per-tour first show from showDatesByTour — flat showDates collapses
  // every tour into one pseudo-tour keyed "tour" (earliest legacy opener wins).
  const shows = parseShowCalendarSnapshotToShowsByTour(
    calSnap.exists ? calSnap.data() : null
  );
  const targets = findTourCountdownTargets(shows, now);
  if (targets.length === 0) return { processed: 0, delivered: 0 };

  const usersSnap = await db.collection("users").where("handle", ">", "").limit(500).get();
  const runtime = createCommsAdapterRuntime({ db, admin, resendApiKey, logger });
  /** @type {import("./commsDelivery").deliverCommsTrigger extends (...args: infer A) => any ? A[0]["recipients"] : never} */
  const recipients = [];

  // #509: batch picks lookup per first-show date so CTA can say View / Edit
  const securedByShow = await loadUserIdsWithPicksForShowDates(
    db,
    targets.map((t) => t.first_show_date || t.firstShowDate)
  );

  for (const target of targets) {
    const firstShow = target.first_show_date || target.firstShowDate || "";
    const securedUids = securedByShow.get(firstShow) || new Set();
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data() || {};
      if (!handleFromUser(userData)) continue;
      recipients.push({
        uid: userDoc.id,
        userData,
        payload: {
          handle: handleFromUser(userData),
          tour_name: target.tour_name,
          days_remaining: target.days_remaining,
          first_show_date: target.first_show_date,
          first_show_venue: target.first_show_venue,
          first_show_city: target.first_show_city,
          lock_time_local: target.lock_time_local,
          picks_secured: firstShow ? securedUids.has(userDoc.id) : false,
        },
        vars: {
          uid: userDoc.id,
          tourId: target.tourId,
          days_remaining: target.days_remaining,
        },
      });
    }
  }

  return runtime.deliver("tour_countdown", recipients);
}

/**
 * Load graded picks for many show dates (chunked `in` queries).
 *
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {string[]} dates
 * @returns {Promise<Array<{ date: string, picks: Record<string, unknown>[] }>>}
 */
async function loadPicksByDates(db, dates) {
  /** @type {Map<string, Record<string, unknown>[]>} */
  const byDate = new Map();
  for (const d of dates) byDate.set(d, []);
  if (dates.length === 0) return [];

  for (let i = 0; i < dates.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunk = dates.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
    // eslint-disable-next-line no-await-in-loop
    const snap = await db.collection("picks").where("showDate", "in", chunk).get();
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      const sd = typeof data.showDate === "string" ? data.showDate.trim() : "";
      if (!byDate.has(sd)) continue;
      byDate.get(sd).push({ id: doc.id, ...data });
    }
  }

  return dates.map((date) => ({ date, picks: byDate.get(date) || [] }));
}

/**
 * Morning-after tour rankings (#440 / #544) — overall tour leaderboard + rank_change.
 *
 * Audience: users with graded picks for last night. Tour rank is among the full
 * cumulative tour board (all graded pickers through last night), not last-night-only.
 * Regrades are reflected automatically because we recompute from current picks.
 */
async function runScheduledTourRankingsDaily({
  db,
  admin,
  resendApiKey,
  logger,
  now = new Date(),
}) {
  if (!isCommsEventAdaptersEnabled()) return null;

  const calSnap = await db.collection("show_calendar").doc("snapshot").get();
  const calData = calSnap.exists ? calSnap.data() : null;
  const shows = parseShowCalendarSnapshotToShows(calData);
  const showDatesByTour = calData?.showDatesByTour ?? null;
  /** @type {Map<string, { venue?: string, city?: string }>} */
  const showMetaByDate = new Map();
  for (const s of shows) {
    if (s?.date) showMetaByDate.set(s.date, s);
  }

  const yesterdayCandidates = shows.filter((s) => {
    if (!s?.date) return false;
    const tz =
      typeof s.timeZone === "string" && s.timeZone.trim()
        ? s.timeZone.trim()
        : DEFAULT_SHOW_TIME_ZONE;
    const today = ymdInTimeZone(now, tz);
    const yesterday = ymdInTimeZone(new Date(now.getTime() - 86400000), tz);
    return s.date === yesterday && today > s.date;
  });

  if (yesterdayCandidates.length === 0) return { processed: 0, delivered: 0 };

  const runtime = createCommsAdapterRuntime({ db, admin, resendApiKey, logger });
  /** @type {Array<{ uid: string, userData?: object, payload: object, vars: object }>} */
  const recipients = [];

  for (const show of yesterdayCandidates) {
    const showDate = show.date;
    // eslint-disable-next-line no-await-in-loop
    const picksSnap = await db.collection("picks").where("showDate", "==", showDate).get();
    if (picksSnap.empty) continue;
    const tourKey = resolveTourKeyForDate(showDate, showDatesByTour);
    const tourDates = tourDatesForKey(showDatesByTour, tourKey);
    const datesThrough = tourDates.length > 0 ? tourDatesThrough(tourDates, showDate) : [showDate];
    const priorDate = priorTourShowDate(tourDates, showDate);
    const nextDate = nextTourShowDate(tourDates, showDate);
    const nextMeta = nextDate ? showMetaByDate.get(nextDate) : null;
    const isTourNightOne = !priorDate;

    // #451: night-of show rank for the folded-in "your night" section.
    const globalRanks = computeGlobalRankByUid(picksSnap.docs, new Map());

    // #544: full tour board through last night (+ prior night for rank_change).
    // eslint-disable-next-line no-await-in-loop
    const picksByDate = await loadPicksByDates(db, datesThrough);
    const currentBoard = assignDisplayRanks(aggregateTourStandings(picksByDate));
    let priorBoard = null;
    if (priorDate) {
      const priorPicksByDate = picksByDate.filter((e) => e.date <= priorDate);
      priorBoard = assignDisplayRanks(aggregateTourStandings(priorPicksByDate));
    }

    /** @type {Set<string>} */
    const lastNightUids = new Set();
    for (const pickDoc of picksSnap.docs) {
      const pickData = pickDoc.data() || {};
      const uid = typeof pickData.userId === "string" ? pickData.userId.trim() : "";
      if (!uid || pickData.isGraded !== true) continue;
      lastNightUids.add(uid);
    }

    for (const uid of lastNightUids) {
      // eslint-disable-next-line no-await-in-loop
      const userSnap = await db.collection("users").doc(uid).get();
      const userData = userSnap.exists ? userSnap.data() || {} : {};
      const rankInfo = globalRanks.get(uid) || null;
      const pickHandle = (() => {
        for (const pickDoc of picksSnap.docs) {
          const d = pickDoc.data() || {};
          if (d.userId === uid) return handleFromUser(d);
        }
        return "";
      })();
      const payload = buildTourRankingsDailyPayloadFields({
        uid,
        handle: pickHandle || handleFromUser(userData),
        showDate,
        venueName: show.venue || "",
        venueCity: show.city || "",
        showScore: rankInfo?.score ?? null,
        globalRank: rankInfo?.rank ?? null,
        globalTotalPickers: rankInfo?.total ?? null,
        currentBoard,
        priorBoard,
        isTourNightOne,
        nextShowDate: nextDate,
        nextShowVenue: nextMeta?.venue || "",
      });
      recipients.push({
        uid,
        userData,
        payload,
        vars: { uid, showDate },
      });
    }
  }

  return runtime.deliver("tour_rankings_daily", recipients);
}

module.exports = {
  shouldDeliverAccountWelcome,
  shouldDeliverPicksConfirmed,
  findShowMeta,
  computeGlobalRankByUid,
  findTourCountdownTargets,
  loadUserIdsWithPicksForShowDates,
  handleAccountWelcome,
  handlePicksConfirmed,
  deliverPostRollupComms,
  deliverLiveScoreComms,
  runScheduledTourCountdown,
  runScheduledTourRankingsDaily,
  leaderUidFromScores,
};
