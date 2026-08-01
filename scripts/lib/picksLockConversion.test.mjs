import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateChannelSplit,
  computeShowConversion,
  formatConversionMarkdown,
  hasNonEmptyPicksObject,
  hoursBeforeLock,
  median,
  parseReminderLogDocId,
  pct,
  pickDocId,
  venueLocalToUtc,
} from "./picksLockConversion.mjs";

describe("picksLockConversion", () => {
  it("parses reminder_{ymd}_{uid} doc ids", () => {
    assert.deepEqual(parseReminderLogDocId("reminder_2026-07-31_abc"), {
      showYmd: "2026-07-31",
      userId: "abc",
    });
    assert.equal(parseReminderLogDocId("email_cap:u:2026-07-31"), null);
    assert.equal(parseReminderLogDocId("reminder_bad_uid"), null);
  });

  it("hasNonEmptyPicksObject mirrors Functions gate", () => {
    assert.equal(hasNonEmptyPicksObject(null), false);
    assert.equal(hasNonEmptyPicksObject({}), false);
    assert.equal(hasNonEmptyPicksObject({ s1o: "  " }), false);
    assert.equal(hasNonEmptyPicksObject({ s1o: "Bag" }), true);
  });

  it("venueLocalToUtc respects America/New_York EDT offset", () => {
    // 2026-07-31 19:20 EDT = 23:20 UTC
    const d = venueLocalToUtc("2026-07-31", 19, 20, "America/New_York");
    assert.equal(d.toISOString(), "2026-07-31T23:20:00.000Z");
  });

  it("computes before-lock conversion + channel split", () => {
    const lockAt = venueLocalToUtc("2026-07-31", 19, 20, "America/New_York");
    const lockByShow = new Map([
      [
        "2026-07-31",
        {
          showYmd: "2026-07-31",
          timeZone: "America/New_York",
          lockHour: 19,
          lockMinute: 20,
          lockAt,
        },
      ],
    ]);

    const deliveries = [
      {
        docId: "reminder_2026-07-31_u1",
        userId: "u1",
        showYmd: "2026-07-31",
        channels: ["email", "inApp"],
        decidedAt: new Date("2026-07-31T20:00:00.000Z"), // ~3.3h before lock
      },
      {
        docId: "reminder_2026-07-31_u2",
        userId: "u2",
        showYmd: "2026-07-31",
        channels: ["push"],
        decidedAt: new Date("2026-07-31T20:00:00.000Z"),
      },
      {
        docId: "reminder_2026-07-31_u3",
        userId: "u3",
        showYmd: "2026-07-31",
        channels: ["email"],
        decidedAt: new Date("2026-07-31T20:00:00.000Z"),
      },
    ];

    const pickByKey = new Map([
      [
        "2026-07-31_u1",
        {
          userId: "u1",
          showDate: "2026-07-31",
          hasPicks: true,
          updatedAt: new Date("2026-07-31T22:00:00.000Z"), // before lock
        },
      ],
      [
        "2026-07-31_u2",
        {
          userId: "u2",
          showDate: "2026-07-31",
          hasPicks: true,
          updatedAt: new Date("2026-08-01T01:00:00.000Z"), // after lock
        },
      ],
      // u3 never
    ]);

    const rows = computeShowConversion(deliveries, pickByKey, lockByShow);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].deliveredUsers, 3);
    assert.equal(rows[0].convertedBeforeLock, 1);
    assert.equal(rows[0].convertedAfterLock, 1);
    assert.equal(rows[0].neverConverted, 1);
    assert.equal(rows[0].convPct, pct(1, 3));
    assert.equal(rows[0].channels.email.delivered, 2);
    assert.equal(rows[0].channels.email.convertedBeforeLock, 1);
    assert.equal(rows[0].channels.push.convertedBeforeLock, 0);

    const split = aggregateChannelSplit(rows);
    assert.equal(split.find((c) => c.channel === "inApp").delivered, 1);

    const md = formatConversionMarkdown({
      windowLabel: "test",
      showDates: ["2026-07-31"],
      generatedAt: "2026-08-01T00:00:00.000Z",
      showRows: rows,
      channelSplit: split,
    });
    assert.match(md, /delivery-log join \(#698\)/);
    assert.match(md, /2026-07-31/);
    assert.match(md, /33\.3%/);
  });

  it("median + hoursBeforeLock helpers", () => {
    assert.equal(median([]), null);
    assert.equal(median([1, 3, 2]), 2);
    assert.equal(median([1, 2, 3, 4]), 2.5);
    const lock = new Date("2026-07-31T23:20:00.000Z");
    assert.equal(hoursBeforeLock(new Date("2026-07-31T22:20:00.000Z"), lock), 1);
    assert.equal(pickDocId("2026-07-31", "u1"), "2026-07-31_u1");
  });
});
