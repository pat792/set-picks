/**
 * Shared FCM send helpers (issues #275–#277): invalid-token cleanup, caps.
 */

const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/unregistered",
]);

const DASHBOARD_NOTIFICATIONS_URL =
  "https://www.setlistpickem.com/dashboard/notifications";

/**
 * @param {string | undefined} code
 * @returns {boolean}
 */
function isInvalidOrUnregisteredToken(code) {
  return typeof code === "string" && INVALID_TOKEN_CODES.has(code);
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {string} userId
 * @param {string} token
 */
async function deleteFcmTokenDocForRawToken(db, userId, token) {
  if (!userId || !token) return;
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection("private_fcmTokens")
    .where("token", "==", token)
    .limit(5)
    .get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

/**
 * @param {{
 *   admin: typeof import("firebase-admin"),
 *   db: import("firebase-admin").firestore.Firestore,
 *   token: string,
 *   userId: string | null,
 *   title: string,
 *   body: string,
 *   data?: Record<string, string>,
 *   logger?: { warn?: Function, info?: Function },
 * }} params
 * @returns {Promise<{ ok: boolean, messageId?: string, errorCode?: string }>}
 */
async function sendWebPushToToken({
  admin,
  db,
  token,
  userId,
  title,
  body,
  data = {},
  logger = undefined,
}) {
  try {
    const messageId = await admin.messaging().send({
      token,
      notification: { title, body },
      data,
      webpush: {
        fcmOptions: { link: DASHBOARD_NOTIFICATIONS_URL },
      },
    });
    return { ok: true, messageId };
  } catch (error) {
    const code =
      typeof error?.code === "string"
        ? error.code
        : error?.errorInfo?.code || "unknown";
    logger?.warn?.("sendWebPushToToken failed", {
      code,
      userId: userId || null,
      tokenTail: token ? token.slice(-8) : "",
    });
    if (userId && isInvalidOrUnregisteredToken(code)) {
      await deleteFcmTokenDocForRawToken(db, userId, token).catch(() => {});
    }
    return { ok: false, errorCode: code };
  }
}

module.exports = {
  DASHBOARD_NOTIFICATIONS_URL,
  deleteFcmTokenDocForRawToken,
  isInvalidOrUnregisteredToken,
  sendWebPushToToken,
};

