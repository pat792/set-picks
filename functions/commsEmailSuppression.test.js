"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeEmail,
  emailSuppressionDocId,
  isEmailSuppressed,
  suppressEmail,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
} = require("./commsEmailSuppression");

function fakeDb(seed = {}) {
  const docs = new Map(Object.entries(seed));
  return {
    collection(name) {
      return {
        doc(id) {
          const key = `${name}/${id}`;
          return {
            async get() {
              const data = docs.get(key);
              return { exists: docs.has(key), data: () => data };
            },
            async set(data, opts) {
              const prev = docs.get(key) || {};
              docs.set(key, opts?.merge ? { ...prev, ...data } : data);
            },
          };
        },
        where(field, op, value) {
          return {
            limit() {
              return {
                async get() {
                  const matches = [];
                  for (const [key, data] of docs.entries()) {
                    if (!key.startsWith(`${name}/`)) continue;
                    if (data[field] === value) {
                      matches.push({
                        id: key.split("/")[1],
                        data: () => data,
                      });
                    }
                  }
                  return { docs: matches };
                },
              };
            },
          };
        },
      };
    },
    _docs: docs,
  };
}

const fakeAdmin = {
  firestore: {
    FieldValue: {
      serverTimestamp: () => ({ __ts: true }),
    },
  },
};

test("normalizeEmail lowercases and trims", () => {
  assert.equal(normalizeEmail("  Pat@Example.COM "), "pat@example.com");
});

test("emailSuppressionDocId is stable hash", () => {
  const a = emailSuppressionDocId("a@b.com");
  const b = emailSuppressionDocId("a@b.com");
  assert.equal(a, b);
  assert.match(a, /^[a-f0-9]{64}$/);
});

test("isEmailSuppressed reads suppression doc", async () => {
  const email = "blocked@example.com";
  const docId = emailSuppressionDocId(email);
  const db = fakeDb({
    [`email_suppression/${docId}`]: { suppressed: true, email },
  });
  assert.equal(await isEmailSuppressed(db, email), true);
  assert.equal(await isEmailSuppressed(db, "other@example.com"), false);
});

test("suppressEmail is idempotent on duplicate eventId", async () => {
  const db = fakeDb();
  const first = await suppressEmail(db, fakeAdmin, {
    email: "x@y.com",
    reason: "hard_bounce",
    source: "test",
    eventId: "evt_1",
  });
  assert.equal(first.applied, true);
  const second = await suppressEmail(db, fakeAdmin, {
    email: "x@y.com",
    reason: "hard_bounce",
    source: "test",
    eventId: "evt_1",
  });
  assert.equal(second.applied, false);
  assert.equal(second.reason, "duplicate_event");
});

test("unsubscribe token verifies", () => {
  const sig = signUnsubscribeToken("uid1", "a@b.com", "secret");
  assert.equal(verifyUnsubscribeToken("uid1", "a@b.com", sig, "secret"), true);
  assert.equal(verifyUnsubscribeToken("uid1", "a@b.com", "bad", "secret"), false);
});
