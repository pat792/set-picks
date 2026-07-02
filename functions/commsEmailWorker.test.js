"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createCommsEmailWorker,
  unsubscribeHeaders,
  buildResendClient,
} = require("./commsEmailWorker");

function fakeResend(captured) {
  return {
    emails: {
      async send(message, options) {
        captured.push({ message, options });
        return { data: { id: "email_123" }, error: null };
      },
    },
  };
}

const baseCtx = {
  uid: "u1",
  userData: { email: "picker@example.com" },
  triggerId: "show_recap",
  rendered: { email: { subject: "Your recap", text: "Body" } },
  dedupId: "show_recap:u1:2026-07-18",
};

test("sends via Resend with idempotency key + unsubscribe headers", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({
    resendClient: fakeResend(captured),
    unsubscribeSigningSecret: "test-secret",
  });
  const res = await worker(baseCtx);

  assert.equal(res.ok, true);
  assert.equal(res.id, "email_123");
  assert.equal(captured.length, 1);
  assert.deepEqual(captured[0].message.to, ["picker@example.com"]);
  assert.equal(captured[0].options.idempotencyKey, "show_recap/u1:show_recap:u1:2026-07-18");
  assert.match(captured[0].message.headers["List-Unsubscribe"], /commsEmailUnsubscribe/);
  assert.equal(captured[0].message.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
});

test("dry run does not send", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured) });
  const res = await worker({ ...baseCtx, dryRun: true });
  assert.equal(res.ok, true);
  assert.equal(res.skipReason, "dry_run");
  assert.equal(captured.length, 0);
});

test("skips when recipient has no email", async () => {
  const captured = [];
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured) });
  const res = await worker({ ...baseCtx, userData: {} });
  assert.equal(res.ok, false);
  assert.equal(res.skipReason, "no_email");
  assert.equal(captured.length, 0);
});

test("skips gracefully when no Resend client is configured", async () => {
  const worker = createCommsEmailWorker({ resendClient: null });
  const res = await worker(baseCtx);
  assert.equal(res.ok, false);
  assert.equal(res.skipReason, "no_email_provider");
});

test("reports send_error when Resend returns an error", async () => {
  const worker = createCommsEmailWorker({
    resendClient: {
      emails: {
        async send() {
          return { data: null, error: { message: "rate_limited" } };
        },
      },
    },
  });
  const res = await worker(baseCtx);
  assert.equal(res.ok, false);
  assert.equal(res.skipReason, "send_error");
});

test("buildResendClient returns null without an api key", () => {
  assert.equal(buildResendClient(""), null);
  assert.equal(buildResendClient(undefined), null);
});

test("skips when email is on suppression list", async () => {
  const { emailSuppressionDocId } = require("./commsEmailSuppression");
  const docId = emailSuppressionDocId("picker@example.com");
  const db = {
    collection(name) {
      return {
        doc(id) {
          return {
            async get() {
              if (name === "email_suppression" && id === docId) {
                return { exists: true, data: () => ({ suppressed: true }) };
              }
              return { exists: false, data: () => null };
            },
          };
        },
      };
    },
  };
  const captured = [];
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured), db });
  const res = await worker(baseCtx);
  assert.equal(res.ok, false);
  assert.equal(res.skipReason, "email_suppressed");
  assert.equal(captured.length, 0);
});

test("unsubscribeHeaders point at the notifications screen when unsigned", () => {
  const headers = unsubscribeHeaders("https://www.setlistpickem.com");
  assert.match(headers["List-Unsubscribe"], /\/dashboard\/notifications/);
});

const fakeAdmin = {
  firestore: { FieldValue: { serverTimestamp: () => "ts" } },
};

/** Fake Firestore with transaction support, for the daily-cap wiring tests (#453). */
function makeFakeTxDb(seed = {}) {
  const store = new Map(Object.entries(seed));
  function makeRef(name, id) {
    const key = `${name}/${id}`;
    return {
      _key: key,
      async get() {
        return { exists: store.has(key), data: () => store.get(key) };
      },
    };
  }
  return {
    collection(name) {
      return { doc: (id) => makeRef(name, id) };
    },
    async runTransaction(updateFn) {
      const tx = {
        async get(ref) {
          return ref.get();
        },
        set(ref, data, opts) {
          const prev = store.get(ref._key) || {};
          store.set(ref._key, opts?.merge ? { ...prev, ...data } : data);
        },
      };
      return updateFn(tx);
    },
  };
}

test("daily cap (#453): second same-day trigger for a user is skipped, first is not double-charged", async () => {
  const captured = [];
  const db = makeFakeTxDb();
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured), db, admin: fakeAdmin });

  const first = await worker({ ...baseCtx, triggerId: "tour_engagement_reminder", dedupId: "tour_engage:u1:t1" });
  assert.equal(first.ok, true);
  assert.equal(captured.length, 1);

  const second = await worker({ ...baseCtx, triggerId: "tour_rankings_daily", dedupId: "tour_rank:u1:2026-07-18" });
  assert.equal(second.ok, false);
  assert.equal(second.skipReason, "daily_email_cap");
  assert.equal(captured.length, 1, "capped attempt must not call Resend");
});

test("daily cap (#453): account_welcome always sends even after the day's slot is used", async () => {
  const captured = [];
  const db = makeFakeTxDb();
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured), db, admin: fakeAdmin });

  await worker({ ...baseCtx, triggerId: "tour_countdown", dedupId: "tour_countdown:t:u1:1" });
  assert.equal(captured.length, 1);

  const welcome = await worker({ ...baseCtx, triggerId: "account_welcome", dedupId: "welcome:u1" });
  assert.equal(welcome.ok, true);
  assert.equal(captured.length, 2, "account_welcome must not be blocked by an already-used slot");
});

test("daily cap (#453): skipped entirely when admin is not provided (backward compatible)", async () => {
  const captured = [];
  const db = makeFakeTxDb();
  const worker = createCommsEmailWorker({ resendClient: fakeResend(captured), db });

  const first = await worker({ ...baseCtx, triggerId: "tour_countdown" });
  const second = await worker({ ...baseCtx, triggerId: "tour_rankings_daily" });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true, "no admin instance means the cap check is skipped, not enforced");
  assert.equal(captured.length, 2);
});
