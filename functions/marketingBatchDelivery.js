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
const {
  inviteContextForUser,
  buildInviteEmailFields,
} = require("./comms/inviteContext.cjs");

const TRIGGER_ID = "marketing_summer_tour_2026_launch";
const CAMPAIGN_ID = "summer_tour_2026";
const SITE_URL = "https://www.setlistpickem.com";

/**
 * @param {Record<string, unknown> | undefined} userData
 * @returns {string}
 */
function handleFromUser(userData) {
  const h = userData && typeof userData.handle === "string" ? userData.handle.trim() : "";
  return h || "friend";
}

/**
 * @param {Record<string, unknown> | null | undefined} userData
 * @returns {string}
 */
function inviteHandleFromUser(userData) {
  return userData && typeof userData.handle === "string" ? userData.handle.trim() : "";
}

/**
 * @param {string} segment
 * @param {string} greetingName
 * @param {string} inviterHandle
 * @param {string | null} inviteCode
 * @param {string | null} poolName
 * @returns {Record<string, string>}
 */
function buildEmailPayload(segment, greetingName, inviterHandle, inviteCode, poolName) {
  const base = SITE_URL.replace(/\/+$/, "");
  const inviteFields =
    buildInviteEmailFields({
      baseUrl: base,
      inviterHandle,
      inviteCode,
      poolName,
      campaign: "summer_tour_2026_launch",
      utmContent: "share_friends",
    }) || {};
  return {
    greetingName,
    inviterHandle,
    audienceSegment: segment,
    openerLabel: "Tuesday, July 7",
    siteUrl: base,
    settingsUrl: `${base}/dashboard/profile/notifications`,
    shareUrl: inviteFields.invite_url || "",
    ...(inviteCode ? { inviteCode } : {}),
    ...(poolName ? { poolName } : {}),
    ...inviteFields,
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
    const greetingName = handleFromUser(userData);
    const inviterHandle = inviteHandleFromUser(userData);
    // eslint-disable-next-line no-await-in-loop
    const { inviteCode, poolName } = await inviteContextForUser(db, userData);

    preview.push({
      uid: member.uid,
      segment: member.segment,
      handle: greetingName,
      email,
      inviteCode,
      poolName,
    });

    if (!email) continue;

    recipients.push({
      uid: member.uid,
      userData,
      payload: buildEmailPayload(
        member.segment,
        greetingName,
        inviterHandle,
        inviteCode,
        poolName
      ),
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
