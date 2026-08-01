import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDaysYmd,
  isoWeekNumber,
  isShowWeek,
  parseOverrideFromOptimizeForMd,
  parseShowDatesFromSource,
  resolveOptimizeKickoff,
  SHOW_WEEK_GOALS,
} from "./commsOptimizeSchedule.mjs";

describe("commsOptimizeSchedule", () => {
  it("parses show dates from source", () => {
    const dates = parseShowDatesFromSource(`
      { date: '2026-07-31', venue: 'Fenway' },
      { date: '2026-08-01', venue: 'Fenway' },
    `);
    assert.deepEqual(dates, ["2026-07-31", "2026-08-01"]);
  });

  it("parses current_override (ignores fenced examples)", () => {
    assert.equal(parseOverrideFromOptimizeForMd("current_override:\n"), null);
    assert.equal(
      parseOverrideFromOptimizeForMd("current_override: picks_lock\n"),
      "picks_lock",
    );
    assert.equal(
      parseOverrideFromOptimizeForMd("```text\noverride: picks_lock\n```\n"),
      null,
    );
  });

  it("post_show after Fenway night", () => {
    const r = resolveOptimizeKickoff({
      mode: "auto",
      todayYmd: "2026-08-01",
      showDates: ["2026-07-31", "2026-08-01"],
    });
    assert.equal(r.action, "kickoff");
    assert.equal(r.mode, "post_show");
    assert.equal(r.optimize_for, "show_recap_uniqueness");
    assert.equal(r.showDate, "2026-07-31");
  });

  it("weekly Monday show-week rotates by ISO week", () => {
    // 2026-08-03 is a Monday; Fenway week still in ±7d window from Aug 1.
    const today = "2026-08-03";
    assert.equal(isShowWeek(today, ["2026-07-31", "2026-08-01"]), true);
    const week = isoWeekNumber(today);
    const r = resolveOptimizeKickoff({
      mode: "weekly",
      todayYmd: today,
      showDates: ["2026-07-31", "2026-08-01"],
    });
    assert.equal(r.action, "kickoff");
    assert.equal(r.optimize_for, SHOW_WEEK_GOALS[week % SHOW_WEEK_GOALS.length]);
  });

  it("auto skips mid-week with no prior show", () => {
    const r = resolveOptimizeKickoff({
      mode: "auto",
      todayYmd: "2026-08-05",
      showDates: ["2026-07-31"],
    });
    assert.equal(r.action, "skip");
  });

  it("addDaysYmd crosses months", () => {
    assert.equal(addDaysYmd("2026-07-31", 1), "2026-08-01");
  });
});
