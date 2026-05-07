"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  findReminderTonightShow,
  isPastPicksLock,
  reminderLogDocId,
} = require("./picksLockReminder");

test("reminderLogDocId", () => {
  assert.equal(reminderLogDocId("2026-07-01", "uid1"), "reminder_2026-07-01_uid1");
});

test("findReminderTonightShow returns null before 4pm local", () => {
  const shows = [{ date: "2099-06-15", timeZone: "America/Los_Angeles" }];
  const now = new Date("2099-06-15T21:05:00.000Z");
  assert.equal(findReminderTonightShow(shows, now), null);
});

test("findReminderTonightShow returns show in 4pm–lock window", () => {
  const shows = [{ date: "2099-06-15", timeZone: "America/Los_Angeles" }];
  // ~6:30pm PDT on 2099-06-15 — after 4pm local, before 7:55pm lock.
  const now = new Date("2099-06-16T01:30:00.000Z");
  const out = findReminderTonightShow(shows, now);
  assert.ok(out);
  assert.equal(out.showDate, "2099-06-15");
});

test("isPastPicksLock is true after local lock", () => {
  const afterLock = new Date("2099-06-16T04:10:00.000Z");
  assert.equal(
    isPastPicksLock("2099-06-15", "America/Los_Angeles", afterLock),
    true
  );
});
