"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  sanitizeResendTagValue,
  buildResendEmailTags,
  extractResendTags,
  extractResendEmailId,
} = require("./commsEmailTags");

test("sanitizeResendTagValue replaces Resend-illegal characters", () => {
  assert.equal(sanitizeResendTagValue("marketing:summer_tour_2026"), "marketing_summer_tour_2026");
  assert.equal(sanitizeResendTagValue("  uid-1  "), "uid-1");
});

test("buildResendEmailTags omits empty fields", () => {
  assert.deepEqual(buildResendEmailTags({ uid: "u1", triggerId: "show_recap" }), [
    { name: "uid", value: "u1" },
    { name: "triggerId", value: "show_recap" },
  ]);
  assert.deepEqual(buildResendEmailTags({ uid: "u1", triggerId: "show_recap", campaignId: "summer_tour_2026" }), [
    { name: "uid", value: "u1" },
    { name: "triggerId", value: "show_recap" },
    { name: "campaignId", value: "summer_tour_2026" },
  ]);
});

test("extractResendTags accepts object or array webhook shapes", () => {
  assert.deepEqual(extractResendTags({ tags: { uid: "u1", triggerId: "show_recap" } }), {
    uid: "u1",
    triggerId: "show_recap",
  });
  assert.deepEqual(
    extractResendTags({ tags: [{ name: "uid", value: "u1" }, { name: "campaignId", value: "summer_tour_2026" }] }),
    { uid: "u1", campaignId: "summer_tour_2026" }
  );
});

test("extractResendEmailId reads email_id", () => {
  assert.equal(extractResendEmailId({ data: { email_id: " re_1 " } }), "re_1");
  assert.equal(extractResendEmailId({ data: {} }), "");
});
