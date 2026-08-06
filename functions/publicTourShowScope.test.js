const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  resolvePublicTourShowScope,
  GAME_LAUNCH_SHOW_DATE,
} = require("./publicTourStats");

describe("resolvePublicTourShowScope", () => {
  const summer = [
    { date: "2026-07-07" },
    { date: "2026-08-01" },
    { date: "2026-08-10" },
    { date: "2026-08-12" },
  ];

  it("counts full post-launch itinerary as tourShowCount (Y)", () => {
    const scope = resolvePublicTourShowScope(summer, "2026-08-06");
    assert.equal(scope.tourShowCount, 4);
  });

  it("limits throughToday to launch..today for aggregation (X)", () => {
    const scope = resolvePublicTourShowScope(summer, "2026-08-06");
    assert.deepEqual(
      scope.throughToday.map((s) => s.date),
      ["2026-07-07", "2026-08-01"]
    );
  });

  it("excludes pre-launch nights from Y", () => {
    const scope = resolvePublicTourShowScope(
      [{ date: "2026-04-01" }, { date: "2026-07-07" }, { date: "2026-08-10" }],
      "2026-08-06",
      GAME_LAUNCH_SHOW_DATE
    );
    assert.equal(scope.tourShowCount, 2);
    assert.deepEqual(
      scope.throughToday.map((s) => s.date),
      ["2026-07-07"]
    );
  });
});
