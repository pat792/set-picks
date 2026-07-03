/**
 * Marketing email batch delivery — Summer Tour 2026 launch (#468).
 *
 * Admin-only path: resolves cohort → `deliverCommsTrigger` (email channel only).
 * Not wired to event adapters — use callable or CLI script.
 */

"use strict";

const { deliverCommsTrigger, buildDefaultWorkers } = require("./commsDelivery");
const { createCommsEmailWorker, buildResendClient } = require("./commsEmailWorker");
const { resolveSummerTour2026LaunchAudience } = require("./marketingAudience");
const { buildSummerTour2026LaunchChannels } = require("./marketingCommsTemplates");

const TRIGGER_ID = "marketing_summer_tour_2026_launch";
const CAMPAIGN_ID = "summer_tour_2026";
const SITE_URL = "https://www.setlistpickem.com";
const BASE_UTM = "utm_source=email&utm_campaign=summer_tour_2026_launch";

/**
 * @param {string} base
 * @param {string | null | undefined} inviteCode
 * @returns {string}
 */
function buildInviteShareUrl(base, inviteCode) {
  const normalized =
    typeof inviteCode === "string" ? inviteCode.trim().toUpperCase() : "";
  if (normalized) {
    return `${base}/join/${encodeURIComponent(normalized)}?${BASE_UTM}&utm_content=share_friends`;
  }
  return `${base}/?${BASE_UTM}&utm_content=share_friends`;
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {Record<string, unknown> | null | undefined} userData
 * @returns {Promise<string | null>}
 */
async function inviteCodeForUser(db, userData) {
  const poolIds = Array.isArray(userData?.pools) ? userData.pools : [];
  if (poolIds.length === 0) return null;
  const poolSnap = await db.collection("pools").doc(String(poolIds[0])).get();
  if (!poolSnap.exists) return null;
  const code = poolSnap.data()?.inviteCode;
  return typeof code === "string" && code.trim() ? code.trim().toUpperCase() : null;
}

/**
 * @param {Record<string, unknown> | undefined} userData
 * @returns {string}
 */
function handleFromUser(userData) {
  const h = userData && typeof userData.handle === "string" ? userData.handle.trim() : "";
  return h || "friend";
}

/**
 * @param {string} segment
 * @param {string} handle
 * @param {string | null} inviteCode
 * @returns {Record<string, string>}
 */
function buildEmailPayload(segment, handle, inviteCode) {
  const base = SITE_URL.replace(/\/+$/, "");
  return {
    greetingName: handle,
    audienceSegment: segment,
    openerLabel: "Tuesday, July 7",
    siteUrl: base,
    settingsUrl: `${base}/dashboard/profile/notifications`,
    shareUrl: buildInviteShareUrl(base, inviteCode),
    ...(inviteCode ? { inviteCode } : {}),
  };
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
async function deliverMarketingSummerTour2026Launch({
  db,
  admin,
  dryRun = true,
  forceResend = false,
  onlyUids,
  resendApiKey,
  resendWebhookSecret,
  logger,
}) {
  let audience = await resolveSummerTour2026LaunchAudience(db);
  const onlyUidSet =
    Array.isArray(onlyUids) && onlyUids.length > 0
      ? new Set(onlyUids.map((u) => String(u).trim()).filter(Boolean))
      : null;
  if (onlyUidSet) {
    audience = audience.filter((m) => onlyUidSet.has(m.uid));
  }

  if (audience.length === 0) {
    return {
      ok: true,
      dryRun,
      triggerId: TRIGGER_ID,
      campaignId: CAMPAIGN_ID,
      cohortSize: 0,
      processed: 0,
      delivered: 0,
      preview: [],
      message: onlyUidSet
        ? "No matching recipients for onlyUids filter (or empty cohort)."
        : "No eligible recipients in cohort.",
    };
  }

  /** @type {Array<{ uid: string, segment: string, handle: string, email: string | null, inviteCode?: string | null }>} */
  const preview = [];

  /** @type {import("./commsDelivery").deliverCommsTrigger extends (...args: infer A) => any ? A[0]["recipients"] : never} */
  const recipients = [];

  for (const member of audience) {
    // eslint-disable-next-line no-await-in-loop
    const snap = await db.collection("users").doc(member.uid).get();
    const userData = snap.exists ? snap.data() || {} : {};
    const email =
      typeof userData.email === "string" && userData.email.includes("@")
        ? userData.email.trim()
        : null;
    const handle = handleFromUser(userData);
    // eslint-disable-next-line no-await-in-loop
    const inviteCode = await inviteCodeForUser(db, userData);

    preview.push({
      uid: member.uid,
      segment: member.segment,
      handle,
      email,
      inviteCode,
    });

    if (!email) continue;

    recipients.push({
      uid: member.uid,
      userData,
      payload: buildEmailPayload(member.segment, handle, inviteCode),
      vars: {
        uid: member.uid,
        campaignId: CAMPAIGN_ID,
      },
    });
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      triggerId: TRIGGER_ID,
      campaignId: CAMPAIGN_ID,
      cohortSize: audience.length,
      sendable: recipients.length,
      skippedNoEmail: audience.length - recipients.length,
      onlyUids: onlyUidSet ? [...onlyUidSet] : undefined,
      preview,
    };
  }

  const emailWorker = createCommsEmailWorker({
    resendClient: buildResendClient(resendApiKey, logger),
    db,
    admin,
    unsubscribeSigningSecret: resendWebhookSecret,
    logger,
  });

  const delivery = await deliverCommsTrigger({
    db,
    admin,
    triggerId: TRIGGER_ID,
    recipients,
    workers: buildDefaultWorkers({ emailWorker }),
    dryRun: false,
    forceResend,
    bypassDailyCap: true,
    logger,
  });

  return {
    ok: delivery.ok !== false,
    dryRun: false,
    triggerId: TRIGGER_ID,
    campaignId: CAMPAIGN_ID,
    cohortSize: audience.length,
    sendable: recipients.length,
    preview,
    delivery,
  };
}

module.exports = {
  TRIGGER_ID,
  CAMPAIGN_ID,
  deliverMarketingSummerTour2026Launch,
  buildEmailPayload,
  buildSummerTour2026LaunchChannels,
};
