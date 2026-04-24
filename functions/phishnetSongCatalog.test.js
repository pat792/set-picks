const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizePhishnetSongRow,
  isPhishNetPayloadOk,
} = require("./phishnetSongCatalog.js");

test("isPhishNetPayloadOk accepts error:false", () => {
  assert.equal(isPhishNetPayloadOk({ error: false, data: [] }), true);
});

test("normalizePhishnetSongRow maps v5 row", () => {
  const row = {
    songid: 1,
    song: "Tweezer",
    times_played: 414,
    gap: 5,
    last_played: "2025-12-31",
  };
  assert.deepEqual(normalizePhishnetSongRow(row), {
    name: "Tweezer",
    total: "414",
    gap: "5",
    last: "2025-12-31",
  });
});

test("normalizePhishnetSongRow returns null for empty song", () => {
  assert.equal(normalizePhishnetSongRow({ song: "  " }), null);
});

// Regression guard for #261: the displayed `Gap` and `Last` in
// `SongAutocomplete` must always come from the same Phish.net row so they
// cannot drift relative to each other. Worst-case staleness should move both
// in lockstep (bounded by the cron window); mismatch between them in a single
// snapshot would break the user-visible "gap = shows since last_played"
// invariant the bustout UX relies on.
test(
  "normalizePhishnetSongRow reads gap and last_played from the same row",
  () => {
    const row = {
      songid: 42,
      song: "Ghost",
      times_played: 300,
      gap: 75,
      last_played: "2023-12-31",
    };
    const out = normalizePhishnetSongRow(row);
    assert.equal(out.gap, "75");
    assert.equal(out.last, "2023-12-31");

    const rowRecent = { ...row, gap: 0, last_played: "2025-07-15" };
    const outRecent = normalizePhishnetSongRow(rowRecent);
    assert.equal(outRecent.gap, "0");
    assert.equal(outRecent.last, "2025-07-15");

    // Missing either field falls back to the sentinel independently — never
    // composes a value from a different row's data.
    const rowPartial = { song: "Wilson", gap: 12 };
    const outPartial = normalizePhishnetSongRow(rowPartial);
    assert.equal(outPartial.gap, "12");
    assert.equal(outPartial.last, "—");
  }
);
