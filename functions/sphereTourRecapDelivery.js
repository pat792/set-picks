/**
 * Sphere 2026 inaugural tour recap → Firestore `commsInbox` delivery (#120).
 *
 * Aggregation mirrors `src/features/scoring/model/aggregateTourStandings.js` and
 * `src/shared/utils/showAggregation.js` — keep copies aligned when scoring rules change.
 *
 * Editorial source: `content/comms/tours/sphere-2026-inaugural.md`
 * Template ID / inbox doc id: `sphere-2026-inaugural`
 */

const SPHERE_2026_INAUGURAL_TEMPLATE_ID = "sphere-2026-inaugural";

/** Doc id under `users/{uid}/commsInbox` — fixed for idempotent admin re-runs. */
const COMMS_INBOX_DOC_ID = "sphere-2026-inaugural";

/**
 * Sphere Run dates — must stay in sync with `Sphere Run` under
 * `src/shared/data/showDates.js` (`FALLBACK_SHOW_DATES_BY_TOUR`).
 *
 * @type {readonly string[]}
 */
const SPHERE_2026_INAUGURAL_SHOW_DATES = Object.freeze([
  "2026-04-16",
  "2026-04-17",
  "2026-04-18",
  "2026-04-23",
  "2026-04-24",
  "2026-04-25",
  "2026-04-30",
  "2026-05-01",
  "2026-05-02",
]);

/**
 * @param {unknown} picks
 * @returns {boolean}
 */
function hasNonEmptyPicksObject(picks) {
  if (picks == null || typeof picks !== "object" || Array.isArray(picks)) {
    return false;
  }
  return Object.values(picks).some(
    (v) => v != null && String(v).trim() !== ""
  );
}

/**
 * @param {Record<string, unknown> | null | undefined} pickData
 * @returns {boolean}
 */
function pickCountsTowardSeason(pickData) {
  if (!pickData || pickData.isGraded !== true) return false;
  return hasNonEmptyPicksObject(pickData.picks);
}

/**
 * @param {Iterable<Record<string, unknown>>} pickList
 * @returns {{ max: number | null, winners: Record<string, unknown>[] }}
 */
function reduceShowWinners(pickList) {
  let max = null;
  /** @type {Record<string, unknown>[]} */
  const eligible = [];
  for (const row of pickList) {
    if (!pickCountsTowardSeason(row)) continue;
    eligible.push(row);
    const score = typeof row.score === "number" ? row.score : 0;
    if (max === null || score > max) max = score;
  }
  if (max === null || max <= 0) {
    return { max: null, winners: [] };
  }
  const winners = eligible.filter(
    (row) => (typeof row.score === "number" ? row.score : 0) === max
  );
  return { max, winners };
}

/**
 * @typedef {{
 *   uid: string,
 *   handle: string,
 *   totalPoints: number,
 *   wins: number,
 *   shows: number,
 * }} TourStandingsRow
 */

/**
 * @param {Array<{ date: string, picks: Array<Record<string, unknown>> }>} picksByDate
 * @returns {TourStandingsRow[]}
 */
function aggregateTourStandings(picksByDate) {
  /** @type {Map<string, TourStandingsRow>} */
  const perUser = new Map();

  for (const entry of picksByDate || []) {
    const picks = Array.isArray(entry?.picks) ? entry.picks : [];
    const { max, winners } = reduceShowWinners(picks);
    const winnerUids = new Set(
      winners.map((w) => String(w.userId || w.uid || "")).filter(Boolean)
    );

    for (const row of picks) {
      if (!pickCountsTowardSeason(row)) continue;
      const uid = String(row.userId || row.uid || "").trim();
      if (!uid) continue;

      const prev = perUser.get(uid);
      const score = typeof row.score === "number" ? row.score : 0;
      const handle =
        typeof row.handle === "string" && row.handle.trim()
          ? row.handle.trim()
          : prev?.handle || "Anonymous";

      const next = prev || {
        uid,
        handle,
        totalPoints: 0,
        wins: 0,
        shows: 0,
      };
      next.handle = handle;
      next.totalPoints += score;
      next.shows += 1;
      if (max != null && winnerUids.has(uid)) next.wins += 1;
      perUser.set(uid, next);
    }
  }

  return [...perUser.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.handle.localeCompare(b.handle);
  });
}

const MAX_FIRESTORE_BATCH = 500;

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @returns {Promise<Array<{ date: string, picks: Record<string, unknown>[] }>>}
 */
async function loadPicksByDateForSphereTour(db) {
  const snap = await db
    .collection("picks")
    .where("showDate", "in", [...SPHERE_2026_INAUGURAL_SHOW_DATES])
    .get();

  /** @type {Map<string, Record<string, unknown>[]>} */
  const byDate = new Map();
  for (const d of SPHERE_2026_INAUGURAL_SHOW_DATES) {
    byDate.set(d, []);
  }

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const sd =
      typeof data.showDate === "string" ? data.showDate.trim() : "";
    if (!byDate.has(sd)) continue;
    byDate.get(sd).push({ id: doc.id, ...data });
  }

  return SPHERE_2026_INAUGURAL_SHOW_DATES.map((date) => ({
    date,
    picks: byDate.get(date) || [],
  }));
}

/**
 * @param {{
 *   db: import('firebase-admin').firestore.Firestore,
 *   admin: typeof import('firebase-admin'),
 *   dryRun: boolean,
 *   logger?: { info?: Function, warn?: Function },
 * }} params
 */
async function deliverSphere2026TourRecapInbox({ db, admin, dryRun, logger }) {
  const picksByDate = await loadPicksByDateForSphereTour(db);
  const leaders = aggregateTourStandings(picksByDate);
  const participantCount = leaders.length;

  /** @type {{ uid: string, rank: number, handle: string, payload: Record<string, number> }[]} */
  const preview = [];

  for (let i = 0; i < leaders.length; i++) {
    const row = leaders[i];
    const rank = i + 1;
    const payload = {
      rank,
      points: row.totalPoints,
      wins: row.wins,
      showsPlayed: row.shows,
      participantCount,
    };
    preview.push({
      uid: row.uid,
      rank,
      handle: row.handle,
      payload,
    });
  }

  if (leaders.length === 0) {
    return {
      ok: true,
      dryRun,
      templateId: SPHERE_2026_INAUGURAL_TEMPLATE_ID,
      inboxDocId: COMMS_INBOX_DOC_ID,
      showDates: [...SPHERE_2026_INAUGURAL_SHOW_DATES],
      participantCount: 0,
      delivered: 0,
      preview: [],
      message:
        "No eligible players — no graded, non-empty picks on Sphere inaugural dates.",
    };
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      templateId: SPHERE_2026_INAUGURAL_TEMPLATE_ID,
      inboxDocId: COMMS_INBOX_DOC_ID,
      showDates: [...SPHERE_2026_INAUGURAL_SHOW_DATES],
      participantCount,
      delivered: 0,
      preview,
    };
  }

  let batch = db.batch();
  let opCount = 0;
  let delivered = 0;

  for (const item of preview) {
    if (opCount >= MAX_FIRESTORE_BATCH) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
    const ref = db
      .collection("users")
      .doc(item.uid)
      .collection("commsInbox")
      .doc(COMMS_INBOX_DOC_ID);
    batch.set(
      ref,
      {
        templateId: SPHERE_2026_INAUGURAL_TEMPLATE_ID,
        payload: item.payload,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    opCount += 1;
    delivered += 1;
  }

  if (opCount > 0) {
    await batch.commit();
  }

  logger?.info?.("deliverSphere2026TourRecapInbox: wrote inbox rows", {
    delivered,
    participantCount,
  });

  return {
    ok: true,
    dryRun: false,
    templateId: SPHERE_2026_INAUGURAL_TEMPLATE_ID,
    inboxDocId: COMMS_INBOX_DOC_ID,
    showDates: [...SPHERE_2026_INAUGURAL_SHOW_DATES],
    participantCount,
    delivered,
    preview: preview.slice(0, 50),
  };
}

module.exports = {
  SPHERE_2026_INAUGURAL_SHOW_DATES,
  SPHERE_2026_INAUGURAL_TEMPLATE_ID,
  COMMS_INBOX_DOC_ID,
  aggregateTourStandings,
  deliverSphere2026TourRecapInbox,
};
