"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  deliverCommsTrigger,
  prefAllows,
  recipientAllowsTrigger,
  recipientAllowsChannel,
} = require("./commsDelivery");
const { getTriggerSpec } = require("./commsCatalog");

const fakeAdmin = {
  firestore: { FieldValue: { serverTimestamp: () => "ts" } },
};

/** Minimal fake Firestore covering the dedup collection get/set the orchestrator uses. */
function makeFakeDb(seed = {}) {
  const dedup = new Map(Object.entries(seed));
  const writes = [];
  return {
    _dedup: dedup,
    _writes: writes,
    collection() {
      return {
        doc(id) {
          return {
            async get() {
              return { exists: dedup.has(id), data: () => dedup.get(id) };
            },
            async set(data) {
              dedup.set(id, { ...(dedup.get(id) || {}), ...data });
              writes.push({ id, data });
            },
          };
        },
      };
    },
  };
}

function recordingWorker(name, result = { ok: true }) {
  const calls = [];
  const fn = async (ctx) => {
    calls.push(ctx);
    return typeof result === "function" ? result(ctx) : result;
  };
  fn.calls = calls;
  fn.name_ = name;
  return fn;
}

function makeLogger() {
  const events = [];
  return {
    events,
    info: (msg, data) => events.push({ msg, data }),
    warn: () => {},
    error: () => {},
  };
}

test("prefAllows: default-allow vs default-deny commercial", () => {
  assert.equal(prefAllows({}, "lifecycle"), true);
  assert.equal(prefAllows({ notificationPrefs: { lifecycle: false } }, "lifecycle"), false);
  assert.equal(prefAllows({}, "commercial"), false);
  assert.equal(prefAllows({ notificationPrefs: { commercial: true } }, "commercial"), true);
});

test("recipientAllowsTrigger requires every prefKey to allow", () => {
  assert.equal(recipientAllowsTrigger({ notificationPrefs: { results: true } }, ["results"]), true);
  assert.equal(recipientAllowsTrigger({ notificationPrefs: { results: false } }, ["results"]), false);
});

test("bypassDailyCap threads through to the channel worker ctx (admin QA preview)", async () => {
  const db = makeFakeDb();
  const email = recordingWorker("email", { ok: true });

  await deliverCommsTrigger({
    db,
    admin: fakeAdmin,
    triggerId: "account_welcome",
    recipients: [{ uid: "u1", userData: { email: "u1@example.com" } }],
    workers: { email },
    dryRun: false,
    bypassDailyCap: true,
  });

  assert.equal(email.calls.length, 1);
  assert.equal(email.calls[0].bypassDailyCap, true);
});

test("bypassDailyCap defaults to false when not passed", async () => {
  const db = makeFakeDb();
  const email = recordingWorker("email", { ok: true });

  await deliverCommsTrigger({
    db,
    admin: fakeAdmin,
    triggerId: "account_welcome",
    recipients: [{ uid: "u1", userData: { email: "u1@example.com" } }],
    workers: { email },
    dryRun: false,
  });

  assert.equal(email.calls[0].bypassDailyCap, false);
});

test("forceResend threads through to the channel worker ctx (so email can vary its Resend idempotency key)", async () => {
  const db = makeFakeDb();
  const email = recordingWorker("email", { ok: true });

  await deliverCommsTrigger({
    db,
    admin: fakeAdmin,
    triggerId: "account_welcome",
    recipients: [{ uid: "u1", userData: { email: "u1@example.com" } }],
    workers: { email },
    dryRun: false,
    forceResend: true,
  });

  assert.equal(email.calls[0].forceResend, true);
});

test("dry run reports would_deliver and writes nothing", async () => {
  const db = makeFakeDb();
  const inApp = recordingWorker("inApp", { ok: true, skipReason: "dry_run" });
  const push = recordingWorker("push", { ok: true, skipReason: "dry_run" });
  const logger = makeLogger();

  const summary = await deliverCommsTrigger({
    db,
    admin: fakeAdmin,
    triggerId: "picks_confirmed",
    recipients: [{ uid: "u1", userData: {}, vars: { showDate: "2026-07-18" } }],
    workers: { inApp, push },
    dryRun: true,
    logger,
  });

  assert.equal(summary.delivered, 1);
  assert.equal(summary.results[0].status, "would_deliver");
  assert.equal(db._writes.length, 0, "no dedup write on dry run");
  assert.equal(
    logger.events.filter((e) => e.msg === "comms_delivered").length,
    0,
    "no comms_delivered on dry run"
  );
});

test("real delivery dispatches channels, writes dedup, logs comms_delivered", async () => {
  const db = makeFakeDb();
  const inApp = recordingWorker("inApp", { ok: true });
  const push = recordingWorker("push", { ok: true, sent: 1 });
  const logger = makeLogger();
  const ga4Calls = [];

  const summary = await deliverCommsTrigger({
    db,
    admin: fakeAdmin,
    triggerId: "picks_confirmed",
    recipients: [{ uid: "u1", userData: {}, vars: { showDate: "2026-07-18" } }],
    workers: { inApp, push },
    dryRun: false,
    logger,
    sendGa4Delivered: async (input) => {
      ga4Calls.push(input);
      return { sent: true };
    },
  });

  assert.equal(summary.delivered, 1);
  assert.equal(summary.byChannel.inApp, 1);
  assert.equal(summary.byChannel.push, 1);
  assert.equal(inApp.calls.length, 1);
  // Dedup doc id is the resolved dedupKey.
  assert.equal(db._writes[0].id, "picks_confirmed:u1:2026-07-18");
  const delivered = logger.events.filter((e) => e.msg === "comms_delivered");
  assert.equal(delivered.length, 2);
  assert.equal(delivered[0].data.comms_trigger_id, "picks_confirmed");
  assert.equal(delivered[0].data.comms_variant, "control");
  assert.equal(ga4Calls.length, 2);
  assert.equal(ga4Calls[0].triggerId, "picks_confirmed");
  assert.equal(ga4Calls[0].uid, "u1");
  assert.ok(["inApp", "push"].includes(ga4Calls[0].channel));
});

test("dry run does not call GA4 MP", async () => {
  const db = makeFakeDb();
  const inApp = recordingWorker("inApp", { ok: true, skipReason: "dry_run" });
  const ga4Calls = [];

  await deliverCommsTrigger({
    db,
    admin: fakeAdmin,
    triggerId: "picks_confirmed",
    recipients: [{ uid: "u1", userData: {}, vars: { showDate: "2026-07-18" } }],
    workers: { inApp },
    dryRun: true,
    sendGa4Delivered: async (input) => {
      ga4Calls.push(input);
      return { sent: true };
    },
  });

  assert.equal(ga4Calls.length, 0);
});

test("prefs_off skips channel workers for that channel", async () => {
  const db = makeFakeDb();
  const inApp = recordingWorker("inApp");
  const summary = await deliverCommsTrigger({
    db,
    admin: fakeAdmin,
    triggerId: "show_recap",
    recipients: [{ uid: "u1", userData: { notificationPrefs: { results: false } }, vars: { showDate: "d" } }],
    workers: { inApp },
    dryRun: false,
  });
  assert.equal(summary.delivered, 0);
  assert.equal(summary.skips.no_channel_delivered, 1);
  assert.equal(inApp.calls.length, 0);
});

test("transactional email bypasses reminders pref; push still gated", async () => {
  const db = makeFakeDb();
  const email = recordingWorker("email", { ok: true });
  const push = recordingWorker("push", { ok: false, skipReason: "no_tokens" });
  const userData = { email: "picker@example.com", notificationPrefs: { reminders: false } };
  const spec = getTriggerSpec("picks_lock_reminder");

  assert.equal(recipientAllowsChannel(userData, spec, "email"), true);
  assert.equal(recipientAllowsChannel(userData, spec, "push"), false);

  const summary = await deliverCommsTrigger({
    db,
    admin: fakeAdmin,
    triggerId: "picks_lock_reminder",
    recipients: [{ uid: "u1", userData, vars: { showYmd: "2026-07-07" } }],
    workers: { email, push },
    dryRun: false,
    sendGa4Delivered: async () => ({ sent: true }),
  });

  assert.equal(summary.delivered, 1);
  assert.equal(email.calls.length, 1);
  assert.equal(push.calls.length, 0);
});

test("existing dedup doc skips delivery (idempotent)", async () => {
  const db = makeFakeDb({ "show_recap:u1:d": { delivered: true } });
  const inApp = recordingWorker("inApp");
  const summary = await deliverCommsTrigger({
    db,
    admin: fakeAdmin,
    triggerId: "show_recap",
    recipients: [{ uid: "u1", userData: {}, vars: { showDate: "d" } }],
    workers: { inApp },
    dryRun: false,
  });
  assert.equal(summary.skipped, 1);
  assert.equal(summary.skips.deduped, 1);
  assert.equal(inApp.calls.length, 0);
});

test("forceResend bypasses the dedup check", async () => {
  const db = makeFakeDb({ "show_recap:u1:d": { delivered: true } });
  const inApp = recordingWorker("inApp", { ok: true });
  const summary = await deliverCommsTrigger({
    db,
    admin: fakeAdmin,
    triggerId: "show_recap",
    recipients: [{ uid: "u1", userData: {}, vars: { showDate: "d" } }],
    workers: { inApp },
    dryRun: false,
    forceResend: true,
  });
  assert.equal(summary.delivered, 1);
  assert.equal(inApp.calls.length, 1);
});

test("fatigue cap limits sends per user per run", async () => {
  const db = makeFakeDb();
  const inApp = recordingWorker("inApp", { ok: true });
  const summary = await deliverCommsTrigger({
    db,
    admin: fakeAdmin,
    triggerId: "show_recap",
    recipients: [
      { uid: "u1", userData: {}, vars: { showDate: "d1" } },
      { uid: "u1", userData: {}, vars: { showDate: "d2" } },
      { uid: "u1", userData: {}, vars: { showDate: "d3" } },
    ],
    workers: { inApp },
    dryRun: false,
    fatigueCap: 2,
  });
  assert.equal(summary.delivered, 2);
  assert.equal(summary.skips.fatigue_cap, 1);
});

test("unknown trigger returns an error summary", async () => {
  const summary = await deliverCommsTrigger({
    db: makeFakeDb(),
    admin: fakeAdmin,
    triggerId: "nope",
    recipients: [{ uid: "u1" }],
    workers: {},
  });
  assert.equal(summary.ok, false);
  assert.equal(summary.reason, "unknown_trigger");
});
