/**
 * Summer 2026 almost-end marketing batch.
 *
 * 1) Forced inApp fanout → all users (no prefs)
 * 2) Email → Summer Tour players via deliverCommsTrigger (lifecycle prefs)
 */

"use strict";

const { deliverCommsTrigger, buildDefaultWorkers } = require("./commsDelivery");
const { createCommsEmailWorker, buildResendClient } = require("./commsEmailWorker");
const {
  resolveSummer2026AlmostEndEmailAudience,
  resolveSummer2026AlmostEndInboxAudience,
} = require("./marketingAudience");
const {
  inviteContextForUser,
  buildInviteEmailFields,
} = require("./comms/inviteContext.cjs");
const {
  TRIGGER_ID,
  CAMPAIGN_ID,
  TEMPLATE_ID,
  INBOX_DOC_ID,
  SITE_URL,
  DEFAULT_SUBJECT,
  DEFAULT_PREHEADER,
  seasonStatsFromUser,
  battingAvg,
  formatBatting,
  formatAvgPoints,
  assignCompetitionRanks,
  meanFieldPickingAvg,
  resolveBranch,
  buildPersonalTape,
} = require("./marketingAlmostEndCore");

const MAX_FIRESTORE_BATCH = 500;

/**
 * @param {Record<string, unknown> | undefined} userData
 * @returns {string}
 */
function handleFromUser(userData) {
  const h = userData && typeof userData.handle === "string" ? userData.handle.trim() : "";
  return h || "friend";
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {Set<string> | null} onlyUidSet
 * @returns {Promise<{
 *   players: Array<{ uid: string, handle: string, totalPoints: number, wins: number, shows: number, correctSlots: number, userData: Record<string, unknown> }>,
 *   ranks: Map<string, { rank: number, row: object }>,
 *   top5: Array<{ rank: number, handle: string, points: number, wins: number, nights: number, battingAvg: string }>,
 *   fieldPickingAvg: number,
 *   participantCount: number,
 * }>}
 */
async function loadPlayerBoard(db, onlyUidSet) {
  const emailAudience = await resolveSummer2026AlmostEndEmailAudience(db);
  /** @type {typeof emailAudience} */
  let filtered = emailAudience;
  if (onlyUidSet) {
    // Still need full board for ranks/Top5; onlyUidSet filters delivery later.
    filtered = emailAudience;
  }

  /** @type {Array<{ uid: string, handle: string, totalPoints: number, wins: number, shows: number, correctSlots: number, userData: Record<string, unknown> }>} */
  const players = [];
  for (const member of filtered) {
    // eslint-disable-next-line no-await-in-loop
    const snap = await db.collection("users").doc(member.uid).get();
    const userData = snap.exists ? snap.data() || {} : {};
    const stats = seasonStatsFromUser(userData);
    if (!stats) continue;
    players.push({
      uid: member.uid,
      handle: handleFromUser(userData),
      totalPoints: stats.totalPoints,
      wins: stats.wins,
      shows: stats.shows,
      correctSlots: stats.correctSlots,
      userData,
    });
  }

  const ranks = assignCompetitionRanks(players);
  const fieldPickingAvg = meanFieldPickingAvg(players);
  const participantCount = players.length;

  const top5 = [...ranks.values()]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5)
    .map(({ rank, row }) => ({
      rank,
      handle: row.handle,
      points: row.totalPoints,
      wins: row.wins,
      nights: row.shows,
      battingAvg: formatBatting(battingAvg(row.correctSlots, row.shows)),
    }));

  return { players, ranks, top5, fieldPickingAvg, participantCount };
}

/**
 * @param {{
 *   uid: string,
 *   userData: Record<string, unknown>,
 *   ranks: Map<string, { rank: number, row: object }>,
 *   top5: object[],
 *   fieldPickingAvg: number,
 *   participantCount: number,
 *   inviteCode: string | null,
 *   poolName: string | null,
 * }} args
 */
function buildAlmostEndPayload({
  uid,
  userData,
  ranks,
  top5,
  fieldPickingAvg,
  participantCount,
  inviteCode,
  poolName,
}) {
  const base = SITE_URL.replace(/\/+$/, "");
  const greetingName = handleFromUser(userData);
  const inviterHandle =
    typeof userData.handle === "string" ? userData.handle.trim() : "";
  const ranked = ranks.get(uid);
  const showsPlayed = ranked ? ranked.row.shows : 0;
  const points = ranked ? ranked.row.totalPoints : 0;
  const wins = ranked ? ranked.row.wins : 0;
  const correctSlots = ranked ? ranked.row.correctSlots : 0;
  const rank = ranked ? ranked.rank : null;
  const branch = resolveBranch(rank, showsPlayed);
  const avgPoints = showsPlayed > 0 ? points / showsPlayed : 0;
  const bat = battingAvg(correctSlots, showsPlayed);
  const personalTape = buildPersonalTape({
    branch,
    rank,
    points,
    wins,
    showsPlayed,
    avgPoints,
    battingAvg: bat,
    participantCount,
    fieldPickingAvg,
  });

  const inviteFields =
    branch !== "noPlay"
      ? buildInviteEmailFields({
          baseUrl: base,
          inviterHandle,
          inviteCode,
          poolName,
          campaign: CAMPAIGN_ID,
          utmContent: "invite_friend",
        }) || {}
      : {};

  const standingsUrl = `${base}/dashboard/standings?utm_source=email&utm_campaign=${CAMPAIGN_ID}&utm_content=${
    branch === "noPlay" ? "standings" : "invite_friend"
  }`;

  return {
    greetingName,
    handle: greetingName,
    branch,
    rank,
    points,
    wins,
    showsPlayed,
    avgPoints: formatAvgPoints(avgPoints),
    battingAvg: formatBatting(bat),
    participantCount,
    fieldPickingAvg: formatBatting(fieldPickingAvg),
    fieldPlayerCount: participantCount,
    top5,
    personalTape,
    showInvite: branch !== "noPlay",
    subject: DEFAULT_SUBJECT,
    preheader: DEFAULT_PREHEADER,
    siteUrl: base,
    settingsUrl: `${base}/dashboard/profile/notifications`,
    standingsUrl,
    shareUrl: inviteFields.invite_url || standingsUrl,
    inviterHandle,
    ...(inviteCode ? { inviteCode } : {}),
    ...(poolName ? { poolName } : {}),
    ...inviteFields,
  };
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   items: Array<{ uid: string, payload: Record<string, unknown> }>,
 *   dryRun: boolean,
 *   logger?: { info?: Function, warn?: Function },
 * }} args
 */
async function writeInboxFanout({ db, admin, items, dryRun, logger }) {
  if (dryRun) {
    return { delivered: 0, wouldDeliver: items.length };
  }
  let batch = db.batch();
  let opCount = 0;
  let delivered = 0;
  for (const item of items) {
    if (opCount >= MAX_FIRESTORE_BATCH) {
      // eslint-disable-next-line no-await-in-loop
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
    const ref = db
      .collection("users")
      .doc(item.uid)
      .collection("commsInbox")
      .doc(INBOX_DOC_ID);
    batch.set(
      ref,
      {
        templateId: TEMPLATE_ID,
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
  logger?.info?.("summer2026AlmostEnd: inbox fanout", { delivered });
  return { delivered, wouldDeliver: 0 };
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   dryRun?: boolean,
 *   forceResend?: boolean,
 *   onlyUids?: string[],
 *   resendApiKey?: string,
 *   resendWebhookSecret?: string,
 *   logger?: { info?: Function, warn?: Function },
 * }} params
 */
async function deliverMarketingSummer2026AlmostEnd({
  db,
  admin,
  dryRun = true,
  forceResend = false,
  onlyUids,
  resendApiKey,
  resendWebhookSecret,
  logger,
}) {
  const onlyUidSet =
    Array.isArray(onlyUids) && onlyUids.length > 0
      ? new Set(onlyUids.map((u) => String(u).trim()).filter(Boolean))
      : null;

  const board = await loadPlayerBoard(db, onlyUidSet);
  let inboxAudience = await resolveSummer2026AlmostEndInboxAudience(db);
  if (onlyUidSet) {
    inboxAudience = inboxAudience.filter((m) => onlyUidSet.has(m.uid));
  }

  /** @type {Array<{ uid: string, branch: string, handle: string, email: string | null, channel: string }>} */
  const preview = [];
  /** @type {Array<{ uid: string, payload: Record<string, unknown> }>} */
  const inboxItems = [];
  /** @type {Array<{ uid: string, userData: object, payload: object, vars: object }>} */
  const emailRecipients = [];

  const playerByUid = new Map(board.players.map((p) => [p.uid, p]));

  for (const member of inboxAudience) {
    // eslint-disable-next-line no-await-in-loop
    const snap = await db.collection("users").doc(member.uid).get();
    const userData = snap.exists ? snap.data() || {} : {};
    const player = playerByUid.get(member.uid);
    const data = player ? player.userData : userData;
    // eslint-disable-next-line no-await-in-loop
    const { inviteCode, poolName } = await inviteContextForUser(db, data);
    const payload = buildAlmostEndPayload({
      uid: member.uid,
      userData: data,
      ranks: board.ranks,
      top5: board.top5,
      fieldPickingAvg: board.fieldPickingAvg,
      participantCount: board.participantCount,
      inviteCode,
      poolName,
    });

    inboxItems.push({ uid: member.uid, payload });
    preview.push({
      uid: member.uid,
      branch: payload.branch,
      handle: payload.greetingName,
      email:
        typeof data.email === "string" && data.email.includes("@")
          ? data.email.trim()
          : null,
      channel: "inApp",
    });
  }

  for (const player of board.players) {
    if (onlyUidSet && !onlyUidSet.has(player.uid)) continue;
    const email =
      typeof player.userData.email === "string" && player.userData.email.includes("@")
        ? player.userData.email.trim()
        : null;
    // eslint-disable-next-line no-await-in-loop
    const { inviteCode, poolName } = await inviteContextForUser(db, player.userData);
    const payload = buildAlmostEndPayload({
      uid: player.uid,
      userData: player.userData,
      ranks: board.ranks,
      top5: board.top5,
      fieldPickingAvg: board.fieldPickingAvg,
      participantCount: board.participantCount,
      inviteCode,
      poolName,
    });
    preview.push({
      uid: player.uid,
      branch: payload.branch,
      handle: payload.greetingName,
      email,
      channel: "email",
    });
    if (!email) continue;
    emailRecipients.push({
      uid: player.uid,
      userData: player.userData,
      payload,
      vars: { uid: player.uid, campaignId: CAMPAIGN_ID },
    });
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      triggerId: TRIGGER_ID,
      campaignId: CAMPAIGN_ID,
      templateId: TEMPLATE_ID,
      inboxCohortSize: inboxAudience.length,
      emailCohortSize: board.players.filter((p) => !onlyUidSet || onlyUidSet.has(p.uid))
        .length,
      emailSendable: emailRecipients.length,
      top5: board.top5,
      fieldPickingAvg: formatBatting(board.fieldPickingAvg),
      onlyUids: onlyUidSet ? [...onlyUidSet] : undefined,
      preview,
    };
  }

  const inboxResult = await writeInboxFanout({
    db,
    admin,
    items: inboxItems,
    dryRun: false,
    logger,
  });

  const emailWorker = createCommsEmailWorker({
    resendClient: buildResendClient(resendApiKey, logger),
    db,
    admin,
    unsubscribeSigningSecret: resendWebhookSecret,
    logger,
  });

  const delivery =
    emailRecipients.length > 0
      ? await deliverCommsTrigger({
          db,
          admin,
          triggerId: TRIGGER_ID,
          recipients: emailRecipients,
          workers: buildDefaultWorkers({ emailWorker }),
          dryRun: false,
          forceResend,
          bypassDailyCap: true,
          channels: ["email"],
          logger,
        })
      : { ok: true, delivered: 0, processed: 0, message: "no_email_recipients" };

  return {
    ok: delivery.ok !== false,
    dryRun: false,
    triggerId: TRIGGER_ID,
    campaignId: CAMPAIGN_ID,
    templateId: TEMPLATE_ID,
    inboxDelivered: inboxResult.delivered,
    emailCohortSize: emailRecipients.length,
    top5: board.top5,
    fieldPickingAvg: formatBatting(board.fieldPickingAvg),
    preview,
    delivery,
  };
}

module.exports = {
  TRIGGER_ID,
  CAMPAIGN_ID,
  TEMPLATE_ID,
  INBOX_DOC_ID,
  deliverMarketingSummer2026AlmostEnd,
  buildAlmostEndPayload,
  loadPlayerBoard,
};
