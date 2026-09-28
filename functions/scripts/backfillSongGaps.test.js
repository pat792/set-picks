const test = require("node:test");
const assert = require("node:assert/strict");

const {
  hasSongGapsMap,
  selectShowDatesForSongGapBackfill,
  songGapsBackfillPatch,
} = require("./backfillSongGaps");

test("selectShowDatesForSongGapBackfill --existing keeps only docs that already have gaps", () => {
  const docs = [
    { id: "2026-07-31", data: { songGaps: { "melt the guns": 2051 }, bustouts: ["Melt the Guns"] } },
    { id: "2026-01-01", data: { bustouts: ["Wilson"] } },
    { id: "2026-04-18", data: { songGaps: {} } },
    { id: "2026-09-04", data: { songGaps: { "character zero": 0 } } },
  ];
  assert.deepEqual(selectShowDatesForSongGapBackfill(docs, "existing"), [
    "2026-07-31",
    "2026-09-04",
  ]);
  assert.deepEqual(selectShowDatesForSongGapBackfill(docs, "missing"), [
    "2026-01-01",
    "2026-04-18",
  ]);
});

test("songGapsBackfillPatch does not rewrite bustouts (#1062)", () => {
  const patch = songGapsBackfillPatch({ "melt the guns": 2052, "walk away": 29 });
  assert.deepEqual(patch, {
    songGaps: { "melt the guns": 2052, "walk away": 29 },
    updatedBy: "backfill-song-gaps",
  });
  assert.equal(Object.prototype.hasOwnProperty.call(patch, "bustouts"), false);
  assert.equal(hasSongGapsMap({ songGaps: patch.songGaps, bustouts: ["Melt the Guns"] }), true);
});
