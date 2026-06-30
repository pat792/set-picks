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
