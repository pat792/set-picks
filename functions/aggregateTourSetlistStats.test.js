/**
 * Unit tests for Functions tour-stats aggregation (#665).
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  aggregateTourSetlistStats,
  toPublicTourStatsPayload,
  tourLabelToSlug,
} = require("./aggregateTourSetlistStats.cjs");

describe("tourLabelToSlug", () => {
  it("kebab-cases Sphere Run 2026", () => {
    assert.equal(tourLabelToSlug("Sphere Run 2026"), "sphere-run-2026");
  });
  it("kebab-cases Summer Tour 2026", () => {
    assert.equal(tourLabelToSlug("Summer Tour 2026"), "summer-tour-2026");
  });
});

describe("toPublicTourStatsPayload", () => {
  it("strips topSongs.showDates and keeps aggregate fields", () => {
    const stats = aggregateTourSetlistStats(
      [
        {
          showDate: "2026-04-16",
          setlist: {
            officialSetlist: ["Ghost", "Tweezer"],
            bustouts: ["Ghost"],
            songGaps: { ghost: 47, tweezer: 5 },
          },
        },
        {
          showDate: "2026-04-18",
          setlist: {
            officialSetlist: ["Ghost", "Bathtub Gin"],
            bustouts: [],
            songGaps: { ghost: 1, "bathtub gin": 12 },
          },
        },
      ],
      { tourShowCount: 2 }
    );
    const pub = toPublicTourStatsPayload(stats);
    assert.equal(pub.uniqueSongs, 3);
    assert.equal(pub.showsWithSetlist, 2);
    assert.ok(pub.topSongs.every((r) => !("showDates" in r)));
    assert.ok(pub.topSongs.some((r) => r.title === "Ghost" && r.timesPlayed === 2));
    assert.ok(Array.isArray(pub.bustouts));
    assert.ok(Array.isArray(pub.gapHighlights));
  });
});
