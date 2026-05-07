"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeFcmSendMessageId } = require("./fcmMessagingCore");

test("normalizeFcmSendMessageId keeps final path segment", () => {
  assert.equal(
    normalizeFcmSendMessageId("projects/set-picks/messages/0:abc123"),
    "0:abc123"
  );
});

test("normalizeFcmSendMessageId passes through short strings", () => {
  assert.equal(normalizeFcmSendMessageId("0:short"), "0:short");
});

test("normalizeFcmSendMessageId reads .name from object shape", () => {
  assert.equal(
    normalizeFcmSendMessageId({
      name: "projects/p/messages/0:z",
    }),
    "0:z"
  );
});
