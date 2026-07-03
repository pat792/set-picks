"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MP_COLLECT_URL,
  isGa4MpEnabled,
  buildCommsDeliveredMpPayload,
  sendCommsDeliveredEvent,
} = require("./commsGa4Measurement");

test("isGa4MpEnabled: false when secrets missing", () => {
  assert.equal(
    isGa4MpEnabled({
      GCLOUD_PROJECT: "set-picks",
      GA4_MEASUREMENT_ID: "",
      GA4_MP_API_SECRET: "",
    }),
    false
  );
  assert.equal(
    isGa4MpEnabled({
      GCLOUD_PROJECT: "set-picks",
      GA4_MEASUREMENT_ID: "G-TEST",
      GA4_MP_API_SECRET: "",
    }),
    false
  );
});

test("isGa4MpEnabled: false on emulator even with secrets", () => {
  assert.equal(
    isGa4MpEnabled({
      FUNCTIONS_EMULATOR: "true",
      GCLOUD_PROJECT: "set-picks",
      GA4_MEASUREMENT_ID: "G-TEST",
      GA4_MP_API_SECRET: "secret",
    }),
    false
  );
});

test("isGa4MpEnabled: false on non-prod project", () => {
  assert.equal(
    isGa4MpEnabled({
      GCLOUD_PROJECT: "set-picks-dev",
      GA4_MEASUREMENT_ID: "G-TEST",
      GA4_MP_API_SECRET: "secret",
    }),
    false
  );
});

test("isGa4MpEnabled: true for prod project with both credentials", () => {
  assert.equal(
    isGa4MpEnabled({
      GCLOUD_PROJECT: "set-picks",
      GA4_MEASUREMENT_ID: "G-TEST",
      GA4_MP_API_SECRET: "secret",
    }),
    true
  );
});

test("buildCommsDeliveredMpPayload: mirrors client/log param names", () => {
  const body = buildCommsDeliveredMpPayload({
    uid: "user-1",
    triggerId: "account_welcome",
    templateId: "account-welcome",
    channel: "email",
    variant: "control",
  });

  assert.equal(body.client_id, "server.user-1");
  assert.equal(body.user_id, "user-1");
  assert.equal(body.events.length, 1);
  assert.equal(body.events[0].name, "comms_delivered");
  assert.deepEqual(body.events[0].params, {
    comms_trigger_id: "account_welcome",
    comms_template_id: "account-welcome",
    comms_channel: "email",
    comms_variant: "control",
  });
});

test("buildCommsDeliveredMpPayload: defaults variant to control", () => {
  const body = buildCommsDeliveredMpPayload({
    uid: "u",
    triggerId: "t",
    templateId: "tmpl",
    channel: "inApp",
  });
  assert.equal(body.events[0].params.comms_variant, "control");
});

test("sendCommsDeliveredEvent: no network when gate off", async () => {
  let called = 0;
  const result = await sendCommsDeliveredEvent(
    {
      uid: "u1",
      triggerId: "account_welcome",
      templateId: "account-welcome",
      channel: "inApp",
    },
    {
      env: { GCLOUD_PROJECT: "set-picks" },
      fetchImpl: async () => {
        called += 1;
        return { ok: true, status: 204 };
      },
    }
  );
  assert.equal(result.sent, false);
  assert.equal(result.reason, "gate_off");
  assert.equal(called, 0);
});

test("sendCommsDeliveredEvent: posts MP payload shape (no real network)", async () => {
  /** @type {{ url?: string, init?: RequestInit }} */
  const seen = {};
  const result = await sendCommsDeliveredEvent(
    {
      uid: "u1",
      triggerId: "picks_confirmed",
      templateId: "picks-confirmed",
      channel: "push",
      variant: "control",
    },
    {
      env: {
        GCLOUD_PROJECT: "set-picks",
        GA4_MEASUREMENT_ID: "G-TESTID",
        GA4_MP_API_SECRET: "test-secret",
      },
      fetchImpl: async (url, init) => {
        seen.url = url;
        seen.init = init;
        return { ok: true, status: 204 };
      },
    }
  );

  assert.equal(result.sent, true);
  assert.equal(result.status, 204);
  assert.ok(String(seen.url).startsWith(MP_COLLECT_URL));
  assert.ok(String(seen.url).includes("measurement_id=G-TESTID"));
  assert.ok(String(seen.url).includes("api_secret=test-secret"));
  assert.equal(seen.init?.method, "POST");

  const body = JSON.parse(String(seen.init?.body || "{}"));
  assert.equal(body.events[0].name, "comms_delivered");
  assert.equal(body.events[0].params.comms_trigger_id, "picks_confirmed");
  assert.equal(body.events[0].params.comms_channel, "push");
  assert.equal(body.user_id, "u1");
});

test("sendCommsDeliveredEvent: swallows network errors", async () => {
  const result = await sendCommsDeliveredEvent(
    {
      uid: "u1",
      triggerId: "t",
      templateId: "tmpl",
      channel: "email",
    },
    {
      env: {
        GCLOUD_PROJECT: "set-picks",
        GA4_MEASUREMENT_ID: "G-TESTID",
        GA4_MP_API_SECRET: "test-secret",
      },
      fetchImpl: async () => {
        throw new Error("offline");
      },
      logger: { warn: () => {} },
    }
  );
  assert.equal(result.sent, false);
  assert.equal(result.reason, "network_error");
});
