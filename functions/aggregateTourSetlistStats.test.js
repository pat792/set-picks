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
  it("kebab-cases 2026 Sphere", () => {
    assert.equal(tourLabelToSlug("2026 Sphere"), "2026-sphere");
  });
  it("kebab-cases Summer Tour 2026", () => {
    assert.equal(tourLabelToSlug("Summer Tour 2026"), "summer-tour-2026");
  });
});

describe("aggregateTourSetlistStats", () => {
  it("returns ALL songs and gap highlights — no top-N truncation (#709)", () => {
    const titles = Array.from({ length: 40 }, (_, i) => `Song ${String(i).padStart(2, "0")}`);
    const songGaps = Object.fromEntries(
      titles.map((t, i) => [t.toLowerCase(), 10 + (i % 15)])
    );
    const stats = aggregateTourSetlistStats(
      [
        {
          showDate: "2026-07-25",
          setlist: { officialSetlist: titles, bustouts: [], songGaps },
        },
      ],
      { tourShowCount: 1 }
    );
    assert.equal(stats.topSongs.length, 40);
    assert.equal(stats.uniqueSongs, 40);
    assert.equal(stats.gapHighlights.length, 40);
    const pub = toPublicTourStatsPayload(stats);
    assert.equal(pub.topSongs.length, 40);
    assert.equal(pub.gapHighlights.length, 40);
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
