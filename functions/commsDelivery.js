/**
 * Comms delivery orchestrator (DELIVER layer, epic #441 / #439).
 *
 * One shared fan-out for every trigger. Each trigger contributes only a resolver
 * (audience + payload + dedup vars); the orchestrator owns the uniform path:
 *
 *   prefs gate → dedup → fatigue cap → render → dispatch (inApp/push/email) → log
 *
 * Channel workers are injected and idempotent, so this module is pure and unit
 * testable with fakes (no emulator). Dedup uses one `fcm_notification_log` doc per
 * (trigger, scope) so all channels share a single idempotency record — and so it
 * needs no `firestore.rules` change (that collection is already server-only).
 */

"use strict";

const { getTriggerSpec, resolveDedupKey } = require("./commsCatalog");
const { renderCommsTemplate } = require("./commsTemplates");
const { deliverCommsInbox } = require("./commsInboxWorker");
const { deliverCommsPush } = require("./commsPushWorker");

const DEDUP_COLLECTION = "fcm_notification_log";
const DEFAULT_FATIGUE_CAP = 2; // max comms per user per delivery run (FRAMEWORK §OPTIMIZE)

/**
 * Resolve a single notification preference, mirroring the client resolver in
 * `src/features/notifications/api/notificationPrefsApi.js`:
 *  - `commercial` is default-deny (explicit `true` to opt in)
 *  - everything else is default-allow (explicit `false` to opt out)
 *
 * @param {Record<string, any> | null | undefined} userData
 * @param {string} key
 * @returns {boolean}
 */
function prefAllows(userData, key) {
  const prefs = userData?.notificationPrefs;
  const raw = prefs && typeof prefs === "object" ? prefs[key] : undefined;
  if (key === "commercial") return raw === true;
  return raw !== false;
}

/**
 * A recipient is eligible only if every `prefKey` the trigger declares allows it.
 *
 * @param {Record<string, any> | null | undefined} userData
 * @param {string[]} prefKeys
 */
function recipientAllowsTrigger(userData, prefKeys) {
  if (!Array.isArray(prefKeys) || prefKeys.length === 0) return true;
  return prefKeys.every((key) => prefAllows(userData, key));
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   triggerId: string,
 *   recipients: Array<{ uid: string, userData?: object, payload?: object, vars?: object }>,
 *   workers?: { inApp?: Function, push?: Function, email?: Function },
 *   dryRun?: boolean,
 *   forceResend?: boolean,
 *   bypassDailyCap?: boolean,
 *   fatigueCap?: number,
 *   variant?: string,
 *   logger?: { info?: Function, warn?: Function, error?: Function },
 * }} params
 */
async function deliverCommsTrigger({
  db,
  admin,
  triggerId,
  recipients,
  workers = {},
  dryRun = true,
  forceResend = false,
  bypassDailyCap = false,
  fatigueCap = DEFAULT_FATIGUE_CAP,
  variant = "control",
  logger,
}) {
  const spec = getTriggerSpec(triggerId);
  if (!spec) {
    return { ok: false, reason: "unknown_trigger", triggerId };
  }

  const summary = {
    ok: true,
    triggerId,
    templateId: spec.templateId,
    dryRun,
    processed: 0,
    delivered: 0,
    skipped: 0,
    byChannel: { inApp: 0, push: 0, email: 0 },
    skips: {},
    results: [],
  };

  const perUserCount = new Map();
  const bumpSkip = (reason) => {
    summary.skipped += 1;
    summary.skips[reason] = (summary.skips[reason] || 0) + 1;
  };

  for (const recipient of Array.isArray(recipients) ? recipients : []) {
    const uid = recipient?.uid;
    if (!uid) {
      bumpSkip("invalid_recipient");
      continue;
    }
    summary.processed += 1;
    const userData = recipient.userData || {};

    // 1) Prefs gate
    if (!recipientAllowsTrigger(userData, spec.prefKeys)) {
      bumpSkip("prefs_off");
      summary.results.push({ uid, status: "skipped", reason: "prefs_off" });
      continue;
    }

    // 2) Fatigue cap (per-user, this run)
    if ((perUserCount.get(uid) || 0) >= fatigueCap) {
      bumpSkip("fatigue_cap");
      summary.results.push({ uid, status: "skipped", reason: "fatigue_cap" });
      continue;
    }

    // 3) Dedup
    const vars = { uid, ...(recipient.vars || {}) };
    const dedupId = resolveDedupKey(triggerId, vars);
    const dedupRef = dedupId ? db.collection(DEDUP_COLLECTION).doc(dedupId) : null;

    if (dedupRef && !forceResend) {
      const existing = await dedupRef.get();
      if (existing.exists) {
        bumpSkip("deduped");
        summary.results.push({ uid, status: "skipped", reason: "deduped", dedupId });
        continue;
      }
    }

    // 4) Render
    const rendered = await renderCommsTemplate(spec.templateId, recipient.payload || {});

    // 5) Dispatch to each declared channel that has a worker
    const ctxBase = {
      db,
      admin,
      uid,
      userData,
      triggerId,
      rendered,
      dedupId,
      dryRun,
      forceResend,
      bypassDailyCap,
      logger,
    };

    const deliveredChannels = [];
    const channelResults = {};
    for (const channel of spec.channels) {
      const worker = workers[channel];
      if (typeof worker !== "function") {
        channelResults[channel] = { ok: false, skipReason: "no_worker" };
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const res = await worker(ctxBase);
      channelResults[channel] = res;
      if (res?.ok && res.skipReason !== "dry_run") {
        deliveredChannels.push(channel);
        summary.byChannel[channel] = (summary.byChannel[channel] || 0) + 1;
        // 6) Measurement — structured server log per channel.
        logger?.info?.("comms_delivered", {
          comms_trigger_id: triggerId,
          comms_template_id: spec.templateId,
          comms_channel: channel,
          comms_variant: variant,
          uid,
        });
      }
    }

    const anyDelivered = deliveredChannels.length > 0;
    const anyDryRunOk =
      dryRun && Object.values(channelResults).some((r) => r?.ok && r.skipReason === "dry_run");

    // 7) Persist dedup record (only on real delivery).
    if (anyDelivered && !dryRun && dedupRef) {
      await dedupRef.set(
        {
          kind: "comms",
          triggerId,
          templateId: spec.templateId,
          userId: uid,
          channels: deliveredChannels,
          delivered: true,
          decidedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    if (anyDelivered || anyDryRunOk) {
      summary.delivered += 1;
      perUserCount.set(uid, (perUserCount.get(uid) || 0) + 1);
      summary.results.push({
        uid,
        status: dryRun ? "would_deliver" : "delivered",
        channels: dryRun ? spec.channels.filter((c) => channelResults[c]?.ok) : deliveredChannels,
        dedupId,
      });
    } else {
      bumpSkip("no_channel_delivered");
      summary.results.push({ uid, status: "skipped", reason: "no_channel_delivered", channelResults });
    }
  }

  logger?.info?.("deliverCommsTrigger complete", {
    triggerId,
    templateId: spec.templateId,
    dryRun,
    processed: summary.processed,
    delivered: summary.delivered,
    skipped: summary.skipped,
    byChannel: summary.byChannel,
  });

  return summary;
}

/**
 * Build the default production channel workers. The email worker is created from
 * a Resend client (which may be `null` if the secret is unset → email skips
 * gracefully).
 *
 * @param {{ emailWorker?: Function }} [opts]
 */
function buildDefaultWorkers({ emailWorker } = {}) {
  return {
    inApp: deliverCommsInbox,
    push: deliverCommsPush,
    ...(emailWorker ? { email: emailWorker } : {}),
  };
}

module.exports = {
  deliverCommsTrigger,
  buildDefaultWorkers,
  prefAllows,
  recipientAllowsTrigger,
  DEDUP_COLLECTION,
  DEFAULT_FATIGUE_CAP,
};
