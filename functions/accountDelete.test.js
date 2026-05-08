"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { HttpsError } = require("firebase-functions/v2/https");

const {
  DELETE_ACCOUNT_CONFIRMATION_PHRASE,
  validateDeletionRequest,
} = require("./accountDelete");

test("validateDeletionRequest: requires acknowledgment flag", () => {
  assert.throws(
    () =>
      validateDeletionRequest({
        confirmationPhrase: DELETE_ACCOUNT_CONFIRMATION_PHRASE,
      }),
    (e) => e instanceof HttpsError && e.code === "invalid-argument"
  );
});

test("validateDeletionRequest: requires exact phrase", () => {
  assert.throws(
    () =>
      validateDeletionRequest({
        acknowledgedPermanentDeletion: true,
        confirmationPhrase: "delete my account",
      }),
    (e) => e instanceof HttpsError && e.code === "invalid-argument"
  );
});

test("validateDeletionRequest: accepts valid payload", () => {
  assert.doesNotThrow(() =>
    validateDeletionRequest({
      acknowledgedPermanentDeletion: true,
      confirmationPhrase: DELETE_ACCOUNT_CONFIRMATION_PHRASE,
    })
  );
});
