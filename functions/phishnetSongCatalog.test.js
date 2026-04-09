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
