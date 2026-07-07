"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  EMAIL_DAILY_CAP,
  isExemptFromDailyCap,
  emailDailyCapDocId,
  reserveEmailDailyCapSlot,
} = require("./commsEmailDailyCap");

const fakeAdmin = {
  firestore: { FieldValue: { serverTimestamp: () => "ts" } },
};

/** Minimal fake Firestore with transaction support (get + set, merge-aware). */
function makeFakeDb(seed = {}) {
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
    _store: store,
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

test("EMAIL_DAILY_CAP is 1", () => {
  assert.equal(EMAIL_DAILY_CAP, 1);
});

test("isExemptFromDailyCap: account_welcome and picks_lock_reminder are exempt", () => {
  assert.equal(isExemptFromDailyCap("account_welcome"), true);
  assert.equal(isExemptFromDailyCap("picks_lock_reminder"), true);
  assert.equal(isExemptFromDailyCap("tour_rankings_daily"), false);
  assert.equal(isExemptFromDailyCap("tour_countdown"), false);
});

test("emailDailyCapDocId builds the expected doc-id shape", () => {
  assert.equal(emailDailyCapDocId("u1", "2026-07-18"), "email_cap:u1:2026-07-18");
  assert.equal(emailDailyCapDocId("", "2026-07-18"), "");
  assert.equal(emailDailyCapDocId("u1", ""), "");
});

test("account_welcome is always exempt and never touches Firestore", async () => {
  const throwingDb = {
    collection() {
      throw new Error("should not be called for an exempt trigger");
    },
  };
  const res = await reserveEmailDailyCapSlot(throwingDb, fakeAdmin, {
    uid: "u1",
    triggerId: "account_welcome",
  });
  assert.deepEqual(res, { allowed: true, exempt: true });
});

test("first attempt for a user/day reserves the slot", async () => {
  const db = makeFakeDb();
  const now = new Date("2026-07-18T20:00:00-07:00");
  const res = await reserveEmailDailyCapSlot(db, fakeAdmin, {
    uid: "u1",
    triggerId: "tour_countdown",
    now,
  });
  assert.equal(res.allowed, true);
  assert.equal(res.day, "2026-07-18");
  const stored = db._store.get("fcm_notification_log/email_cap:u1:2026-07-18");
  assert.equal(stored.count, 1);
  assert.equal(stored.lastTriggerId, "tour_countdown");
  assert.equal(stored.cap, EMAIL_DAILY_CAP);
});

test("second non-exempt trigger the same day is capped, reports the winner", async () => {
  const db = makeFakeDb();
  const now = new Date("2026-07-18T20:00:00-07:00");
  const first = await reserveEmailDailyCapSlot(db, fakeAdmin, {
    uid: "u1",
    triggerId: "tour_engagement_reminder",
    now,
  });
  assert.equal(first.allowed, true);

  const second = await reserveEmailDailyCapSlot(db, fakeAdmin, {
    uid: "u1",
    triggerId: "tour_rankings_daily",
    now: new Date("2026-07-18T23:00:00-07:00"),
  });
  assert.equal(second.allowed, false);
  assert.equal(second.winningTriggerId, "tour_engagement_reminder");
});

test("a new America/Los_Angeles day resets the cap", async () => {
  const db = makeFakeDb();
  const day1 = await reserveEmailDailyCapSlot(db, fakeAdmin, {
    uid: "u1",
    triggerId: "tour_countdown",
    now: new Date("2026-07-18T23:00:00-07:00"),
  });
  assert.equal(day1.allowed, true);

  const day2 = await reserveEmailDailyCapSlot(db, fakeAdmin, {
    uid: "u1",
    triggerId: "tour_rankings_daily",
    now: new Date("2026-07-19T08:00:00-07:00"),
  });
  assert.equal(day2.allowed, true);
  assert.equal(day2.day, "2026-07-19");
});

test("different users never contend for the same slot", async () => {
  const db = makeFakeDb();
  const now = new Date("2026-07-18T20:00:00-07:00");
  const u1 = await reserveEmailDailyCapSlot(db, fakeAdmin, { uid: "u1", triggerId: "tour_countdown", now });
  const u2 = await reserveEmailDailyCapSlot(db, fakeAdmin, { uid: "u2", triggerId: "tour_countdown", now });
  assert.equal(u1.allowed, true);
  assert.equal(u2.allowed, true);
});

test("fails open when the transaction throws", async () => {
  const events = [];
  const db = {
    collection() {
      return { doc: () => ({}) };
    },
    async runTransaction() {
      throw new Error("firestore unavailable");
    },
  };
  const res = await reserveEmailDailyCapSlot(db, fakeAdmin, {
    uid: "u1",
    triggerId: "tour_countdown",
    logger: { warn: (msg, data) => events.push({ msg, data }) },
  });
  assert.deepEqual(res, { allowed: true, failedOpen: true });
  assert.equal(events.length, 1);
  assert.equal(events[0].msg, "reserveEmailDailyCapSlot: transaction failed, failing open");
});

test("missing uid/db/admin degrades to allowed without throwing", async () => {
  assert.deepEqual(await reserveEmailDailyCapSlot(null, fakeAdmin, { uid: "u1", triggerId: "x" }), {
    allowed: true,
  });
  assert.deepEqual(await reserveEmailDailyCapSlot(makeFakeDb(), null, { uid: "u1", triggerId: "x" }), {
    allowed: true,
  });
  assert.deepEqual(await reserveEmailDailyCapSlot(makeFakeDb(), fakeAdmin, { uid: "", triggerId: "x" }), {
    allowed: true,
  });
});
