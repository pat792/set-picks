"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  extractInboundRecipients,
  isAllowlistedInbound,
  handleResendInboundEvent,
  INBOUND_FORWARD_TO,
  INBOUND_ENVELOPE_FROM,
} = require("./commsResendInboundWebhook");
const { handleResendWebhookEvent } = require("./commsResendWebhook");

function fakeResend(captured, { error = null, id = "fwd_1" } = {}) {
  return {
    emails: {
      receiving: {
        async forward(payload, options) {
          captured.push({ payload, options });
          return { data: error ? null : { id }, error };
        },
      },
    },
  };
}

test("extractInboundRecipients reads to + cc and display names", () => {
  assert.deepEqual(
    extractInboundRecipients({
      data: {
        to: ["Setlist <updates@setlistpickem.com>"],
        cc: [{ email: "Unsubscribe@setlistpickem.com" }],
      },
    }),
    ["updates@setlistpickem.com", "unsubscribe@setlistpickem.com"]
  );
});

test("allowlist is updates + unsubscribe only", () => {
  assert.equal(isAllowlistedInbound("updates@setlistpickem.com"), true);
  assert.equal(isAllowlistedInbound("unsubscribe@setlistpickem.com"), true);
  assert.equal(isAllowlistedInbound("help@setlistpickem.com"), false);
  assert.equal(isAllowlistedInbound("spam@setlistpickem.com"), false);
  assert.equal(isAllowlistedInbound("updates@example.com"), false);
});

test("email.received on the engagement webhook is ignored (does not forward)", async () => {
  const result = await handleResendWebhookEvent({
    db: {
      collection() {
        throw new Error("engagement handler must not write for email.received");
      },
    },
    admin: { firestore: { FieldValue: { serverTimestamp: () => ({}) } } },
    event: {
      type: "email.received",
      data: { email_id: "in_1", to: ["updates@setlistpickem.com"] },
    },
  });
  assert.equal(result.handled, false);
  assert.equal(result.reason, "ignored_event_type");
});

test("allowlisted inbound forwards with passthrough envelope and idempotency key", async () => {
  const captured = [];
  const logs = [];
  const result = await handleResendInboundEvent({
    event: {
      type: "email.received",
      data: { email_id: "in_ok", to: ["updates@setlistpickem.com"] },
    },
    eventId: "svix_in_1",
    resend: fakeResend(captured),
    logger: { info: (msg, payload) => logs.push({ msg, payload }) },
  });
  assert.equal(result.forwarded, true);
  assert.deepEqual(result.localParts, ["updates"]);
  assert.equal(captured.length, 1);
  assert.deepEqual(captured[0].payload, {
    emailId: "in_ok",
    to: INBOUND_FORWARD_TO,
    from: INBOUND_ENVELOPE_FROM,
  });
  assert.equal(captured[0].payload.passthrough, undefined);
  assert.deepEqual(captured[0].options, { idempotencyKey: "inbound-fwd:svix_in_1" });
  assert.equal(logs[0].msg, "comms_inbound_forwarded");
});

test("unsubscribe@ is allowlisted and help@ is not", async () => {
  const captured = [];
  const unsub = await handleResendInboundEvent({
    event: {
      type: "email.received",
      data: { email_id: "in_unsub", to: ["unsubscribe@setlistpickem.com"] },
    },
    resend: fakeResend(captured),
  });
  assert.equal(unsub.forwarded, true);

  const help = await handleResendInboundEvent({
    event: {
      type: "email.received",
      data: { email_id: "in_help", to: ["help@setlistpickem.com"] },
    },
    resend: fakeResend(captured),
  });
  assert.equal(help.forwarded, false);
  assert.equal(help.reason, "not_allowlisted");
  assert.equal(captured.length, 1);
});

test("random local-part is dropped with HTTP-safe 200 payload (no forward)", async () => {
  const captured = [];
  const result = await handleResendInboundEvent({
    event: {
      type: "email.received",
      data: { email_id: "in_spam", to: ["random-local@setlistpickem.com"] },
    },
    resend: fakeResend(captured),
  });
  assert.equal(result.ok, true);
  assert.equal(result.handled, true);
  assert.equal(result.forwarded, false);
  assert.equal(result.reason, "not_allowlisted");
  assert.equal(captured.length, 0);
});

test("non-received events and missing email_id do not call Resend", async () => {
  const captured = [];
  const ignored = await handleResendInboundEvent({
    event: { type: "email.opened", data: { email_id: "re_1" } },
    resend: fakeResend(captured),
  });
  assert.equal(ignored.reason, "ignored_event_type");

  const missing = await handleResendInboundEvent({
    event: { type: "email.received", data: { to: ["updates@setlistpickem.com"] } },
    resend: fakeResend(captured),
  });
  assert.equal(missing.reason, "missing_email_id");
  assert.equal(captured.length, 0);
});

test("Resend forward error throws so the HTTP layer can 500 / retry", async () => {
  await assert.rejects(
    () =>
      handleResendInboundEvent({
        event: {
          type: "email.received",
          data: { email_id: "in_fail", to: ["updates@setlistpickem.com"] },
        },
        resend: fakeResend([], { error: { message: "rate limited" } }),
      }),
    (err) => err.code === "inbound_forward_failed"
  );
});

test("missing receiving.forward on the client fails closed", async () => {
  await assert.rejects(
    () =>
      handleResendInboundEvent({
        event: {
          type: "email.received",
          data: { email_id: "in_old", to: ["updates@setlistpickem.com"] },
        },
        resend: { emails: { send: async () => ({}) } },
      }),
    (err) => err.code === "resend_receiving_forward_unavailable"
  );
});

test("installed resend SDK exposes emails.receiving.forward", () => {
  const { Resend } = require("resend");
  const client = new Resend("re_test");
  assert.equal(typeof client.emails?.receiving?.forward, "function");
});
