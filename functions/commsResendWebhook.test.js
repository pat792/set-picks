"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  handleResendWebhookEvent,
  extractRecipientEmails,
} = require("./commsResendWebhook");

function fakeDb() {
  const docs = new Map();
  const users = new Map();
  return {
    collection(name) {
      if (name === "users") {
        return {
          doc(id) {
            return {
              async set(data, opts) {
                const prev = users.get(id) || {};
                users.set(id, opts?.merge ? { ...prev, ...data } : data);
              },
            };
          },
          where(field, op, value) {
            return {
              limit() {
                return {
                  async get() {
                    const matches = [];
                    for (const [id, data] of users.entries()) {
                      if (data[field] === value) {
                        matches.push({ id, data: () => data });
                      }
                    }
                    return { docs: matches };
                  },
                };
              },
            };
          },
        };
      }
      return {
        doc(id) {
          const key = `${name}/${id}`;
          return {
            async get() {
              return { exists: docs.has(key), data: () => docs.get(key) };
            },
            async set(data, opts) {
              const prev = docs.get(key) || {};
              docs.set(key, opts?.merge ? { ...prev, ...data } : data);
            },
          };
        },
      };
    },
    _docs: docs,
    _users: users,
  };
}

const fakeAdmin = {
  firestore: {
    FieldValue: {
      serverTimestamp: () => ({ __ts: true }),
    },
  },
};

test("extractRecipientEmails normalizes array payload", () => {
  assert.deepEqual(
    extractRecipientEmails({ data: { to: ["A@Example.com"] } }),
    ["a@example.com"]
  );
});

test("permanent bounce suppresses email", async () => {
  const db = fakeDb();
  const result = await handleResendWebhookEvent({
    db,
    admin: fakeAdmin,
    eventId: "msg_1",
    event: {
      type: "email.bounced",
      data: {
        to: ["bad@example.com"],
        bounce: { type: "Permanent", subType: "Suppressed" },
      },
    },
  });
  assert.equal(result.handled, true);
  assert.equal(result.results[0].applied, true);
  const { isEmailSuppressed } = require("./commsEmailSuppression");
  assert.equal(await isEmailSuppressed(db, "bad@example.com"), true);
});

test("temporary bounce is ignored", async () => {
  const db = fakeDb();
  const result = await handleResendWebhookEvent({
    db,
    admin: fakeAdmin,
    eventId: "msg_2",
    event: {
      type: "email.bounced",
      data: {
        to: ["soft@example.com"],
        bounce: { type: "Temporary" },
      },
    },
  });
  assert.equal(result.handled, false);
  assert.equal(result.reason, "temporary_bounce_ignored");
});

test("spam complaint suppresses and opts user out", async () => {
  const db = fakeDb();
  db._users.set("u1", { email: "spam@example.com", notificationPrefs: { lifecycle: true } });
  const result = await handleResendWebhookEvent({
    db,
    admin: fakeAdmin,
    eventId: "msg_3",
    event: {
      type: "email.complained",
      data: { to: ["spam@example.com"] },
    },
  });
  assert.equal(result.handled, true);
  const { isEmailSuppressed } = require("./commsEmailSuppression");
  assert.equal(await isEmailSuppressed(db, "spam@example.com"), true);
  assert.equal(db._users.get("u1")["notificationPrefs.lifecycle"], false);
});
