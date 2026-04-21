const test = require("node:test");
const assert = require("node:assert/strict");

const {
  loadSongCatalogSongs,
  parseCatalogJson,
  isNonEmptySongArray,
  _resetSongCatalogCacheForTests,
} = require("./songCatalogSource");

const FALLBACK = [{ name: "Fallback Song", gap: "5" }];
const VALID_PAYLOAD = JSON.stringify({
  songs: [
    { name: "You Enjoy Myself", total: "623", gap: "5", last: "2025-12-31" },
    { name: "Divided Sky", total: "444", gap: "6", last: "2025-12-30" },
  ],
  songCount: 2,
  source: "phish.net/v5/songs",
  updatedAt: "2026-04-21T00:00:00.000Z",
});

function makeBucket({ exists = true, buffer = Buffer.from(VALID_PAYLOAD), downloadError = null } = {}) {
  return {
    file: () => ({
      exists: async () => [exists],
      download: async () => {
        if (downloadError) throw downloadError;
        return [buffer];
      },
    }),
  };
}

test.beforeEach(() => {
  _resetSongCatalogCacheForTests();
});

test("isNonEmptySongArray: rejects empty, non-array, and nameless entries", () => {
  assert.equal(isNonEmptySongArray(null), false);
  assert.equal(isNonEmptySongArray([]), false);
  assert.equal(isNonEmptySongArray([{ gap: "5" }]), false);
  assert.equal(isNonEmptySongArray([{ name: "" }]), false);
  assert.equal(isNonEmptySongArray([{ name: "   " }]), false);
  assert.equal(isNonEmptySongArray([{ name: "x" }]), true);
});

test("parseCatalogJson: returns songs from a valid payload", () => {
  const songs = parseCatalogJson(VALID_PAYLOAD);
  assert.ok(Array.isArray(songs));
  assert.equal(songs.length, 2);
  assert.equal(songs[0].name, "You Enjoy Myself");
});

test("parseCatalogJson: returns null for non-JSON input", () => {
  assert.equal(parseCatalogJson("not json"), null);
  assert.equal(parseCatalogJson(""), null);
  assert.equal(parseCatalogJson(null), null);
});

test("parseCatalogJson: returns null when songs is missing/empty/malformed", () => {
  assert.equal(parseCatalogJson(JSON.stringify({})), null);
  assert.equal(parseCatalogJson(JSON.stringify({ songs: [] })), null);
  assert.equal(
    parseCatalogJson(JSON.stringify({ songs: [{ gap: "5" }] })),
    null
  );
});

test("loadSongCatalogSongs: returns Storage songs when object is valid", async () => {
  const songs = await loadSongCatalogSongs({
    fallbackSongs: FALLBACK,
    getBucket: () => makeBucket({ exists: true }),
  });
  assert.equal(songs.length, 2);
  assert.equal(songs[0].name, "You Enjoy Myself");
});

test("loadSongCatalogSongs: falls back when Storage object missing (exists=false)", async () => {
  let warned = false;
  const songs = await loadSongCatalogSongs({
    fallbackSongs: FALLBACK,
    logger: { warn: () => { warned = true; } },
    getBucket: () => makeBucket({ exists: false }),
  });
  assert.equal(songs, FALLBACK);
  assert.equal(warned, true);
});

test("loadSongCatalogSongs: falls back on non-JSON payload", async () => {
  const songs = await loadSongCatalogSongs({
    fallbackSongs: FALLBACK,
    getBucket: () => makeBucket({ buffer: Buffer.from("not json") }),
  });
  assert.equal(songs, FALLBACK);
});

test("loadSongCatalogSongs: falls back when songs array is empty", async () => {
  const songs = await loadSongCatalogSongs({
    fallbackSongs: FALLBACK,
    getBucket: () =>
      makeBucket({ buffer: Buffer.from(JSON.stringify({ songs: [] })) }),
  });
  assert.equal(songs, FALLBACK);
});

test("loadSongCatalogSongs: falls back when download() throws", async () => {
  const songs = await loadSongCatalogSongs({
    fallbackSongs: FALLBACK,
    getBucket: () =>
      makeBucket({ downloadError: new Error("network") }),
  });
  assert.equal(songs, FALLBACK);
});

test("loadSongCatalogSongs: caches within TTL, re-fetches after expiry", async () => {
  let downloads = 0;
  const bucket = {
    file: () => ({
      exists: async () => [true],
      download: async () => {
        downloads += 1;
        return [Buffer.from(VALID_PAYLOAD)];
      },
    }),
  };

  let clock = 1_000_000;
  const now = () => clock;

  const opts = {
    fallbackSongs: FALLBACK,
    getBucket: () => bucket,
    now,
    cacheTtlMs: 60_000,
  };

  const a = await loadSongCatalogSongs(opts);
  assert.equal(downloads, 1);

  clock += 30_000;
  const b = await loadSongCatalogSongs(opts);
  assert.equal(downloads, 1, "within TTL should hit cache");
  assert.equal(a, b, "should return same cached array reference");

  clock += 60_000;
  await loadSongCatalogSongs(opts);
  assert.equal(downloads, 2, "past TTL should re-fetch");
});

test("loadSongCatalogSongs: requires fallbackSongs array", async () => {
  await assert.rejects(
    () => loadSongCatalogSongs({ fallbackSongs: null }),
    /fallbackSongs array is required/
  );
});
