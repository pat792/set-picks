/**
 * Unit tests for Functions tour-stats aggregation (#665).
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  aggregateTourSetlistStats,
  toPublicTourStatsPayload,
  buildSongEnrichmentByTitle,
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

describe("buildSongEnrichmentByTitle (#666)", () => {
  it("normalizes titles and parses total/debut from catalog rows", () => {
    const map = buildSongEnrichmentByTitle([
      { name: "Ghost", total: "623", debut: "1997-06-13" },
      { name: "Tweezer", total: "512", debut: "1990" },
      { name: "No Data", total: "—", debut: "" },
      { name: "Weird Year", total: "3", debut: "0999-01-01" },
      { name: "  ", total: "5", debut: "2000" },
    ]);
    assert.deepEqual(map.get("ghost"), { lifetimePlays: 623, debutYear: 1997 });
    assert.deepEqual(map.get("tweezer"), { lifetimePlays: 512, debutYear: 1990 });
    assert.equal(map.has("no data"), false);
    assert.deepEqual(map.get("weird year"), { lifetimePlays: 3, debutYear: null });
    assert.equal(map.has(""), false);
  });
});

describe("toPublicTourStatsPayload enrichment (#666)", () => {
  const stats = aggregateTourSetlistStats(
    [
      {
        showDate: "2026-04-16",
        setlist: {
          officialSetlist: ["Ghost", "Obscure Original"],
          bustouts: ["Ghost"],
          songGaps: { ghost: 47, "obscure original": 12 },
        },
      },
    ],
    { tourShowCount: 1 }
  );

  it("attaches lifetimePlays/debutYear per row, null for unknown songs", () => {
    const map = buildSongEnrichmentByTitle([
      { name: "GHOST", total: "623", debut: "1997-06-13" },
    ]);
    const pub = toPublicTourStatsPayload(stats, map);
    const ghost = pub.topSongs.find((r) => r.title === "Ghost");
    assert.equal(ghost.lifetimePlays, 623);
    assert.equal(ghost.debutYear, 1997);
    const obscure = pub.topSongs.find((r) => r.title === "Obscure Original");
    assert.equal(obscure.lifetimePlays, null);
    assert.equal(obscure.debutYear, null);
    assert.equal(pub.bustouts[0].lifetimePlays, 623);
    assert.equal(pub.gapHighlights[0].title, "Obscure Original");
    assert.equal(pub.gapHighlights[0].debutYear, null);
  });

  it("omits enrichment fields entirely when no map is provided", () => {
    const pub = toPublicTourStatsPayload(stats);
    assert.ok(pub.topSongs.every((r) => !("lifetimePlays" in r)));
    assert.ok(pub.bustouts.every((r) => !("debutYear" in r)));
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
