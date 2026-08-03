/**
 * Firestore run-lock for one-shot marketing batch schedules.
 */

"use strict";

const RUN_COLLECTION = "comms_marketing_runs";

/**
 * Atomically claim a pending (or missing) run. Returns false if cancelled/completed/already running.
 *
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {typeof import("firebase-admin")} admin
 * @param {string} runId
 * @param {{ targetDate?: string }} [opts]
 * @returns {Promise<{ claimed: boolean, reason?: string, status?: string }>}
 */
async function claimMarketingRun(db, admin, runId, opts = {}) {
  const ref = db.collection(RUN_COLLECTION).doc(runId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists) {
      tx.set(ref, {
        status: "running",
        ...(opts.targetDate ? { targetDate: opts.targetDate } : {}),
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { claimed: true, status: "running" };
    }

    const data = snap.data() || {};
    const status = typeof data.status === "string" ? data.status : "pending";

    if (opts.targetDate && data.targetDate && data.targetDate !== opts.targetDate) {
      return { claimed: false, reason: "target_date_mismatch", status };
    }

    if (status === "completed" || status === "cancelled") {
      return { claimed: false, reason: status, status };
    }
    if (status === "running") {
      return { claimed: false, reason: "already_running", status };
    }

    tx.set(
      ref,
      {
        status: "running",
        ...(opts.targetDate ? { targetDate: opts.targetDate } : {}),
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { claimed: true, status: "running" };
  });
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {typeof import("firebase-admin")} admin
 * @param {string} runId
 * @param {'completed' | 'failed' | 'cancelled'} status
 * @param {Record<string, unknown>} [extra]
 */
async function finishMarketingRun(db, admin, runId, status, extra = {}) {
  await db
    .collection(RUN_COLLECTION)
    .doc(runId)
    .set(
      {
        status,
        finishedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...extra,
      },
      { merge: true }
    );
}

module.exports = {
  RUN_COLLECTION,
  claimMarketingRun,
  finishMarketingRun,
};
