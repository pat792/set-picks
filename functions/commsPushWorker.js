/**
 * Push channel worker — fans a rendered push payload out to a user's registered
 * FCM tokens (cap 5) via the shared {@link sendWebPushToToken} primitive, which
 * handles invalid-token cleanup. Idempotency is owned by the orchestrator's dedup
 * doc, not here.
 */

"use strict";

const { sendWebPushToToken } = require("./fcmMessagingCore");

const MAX_TOKENS_PER_USER = 5;

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   uid: string,
 *   triggerId: string,
 *   rendered: { push: { title: string, body: string } },
 *   dryRun?: boolean,
 *   logger?: { info?: Function, warn?: Function },
 * }} ctx
 * @returns {Promise<{ ok: boolean, skipReason?: string, sent?: number }>}
 */
async function deliverCommsPush(ctx) {
  const { db, admin, uid, triggerId, rendered, dryRun, logger } = ctx;
  if (!uid || !rendered?.push?.title) {
    return { ok: false, skipReason: "invalid_recipient" };
  }

  const tokenSnap = await db
    .collection("users")
    .doc(uid)
    .collection("private_fcmTokens")
    .limit(MAX_TOKENS_PER_USER)
    .get();

  const tokens = tokenSnap.docs
    .map((d) => d.data()?.token)
    .filter((t) => typeof t === "string" && t.trim());

  if (tokens.length === 0) {
    return { ok: false, skipReason: "no_tokens" };
  }
  if (dryRun) {
    return { ok: true, skipReason: "dry_run", sent: 0 };
  }

  let sent = 0;
  for (const token of tokens) {
    const res = await sendWebPushToToken({
      admin,
      db,
      token: token.trim(),
      userId: uid,
      title: rendered.push.title,
      body: rendered.push.body,
      data: { kind: triggerId || "comms" },
      logger,
    });
    if (res.ok) sent += 1;
  }

  if (sent === 0) {
    return { ok: false, skipReason: "all_sends_failed" };
  }
  return { ok: true, sent };
}

module.exports = { deliverCommsPush, MAX_TOKENS_PER_USER };
