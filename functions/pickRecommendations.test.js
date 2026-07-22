/**
 * Unit tests for pick-recommendations artifact builder (#650).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildPickRecommendationsArtifact,
  showRecordFromOfficialDoc,
  recommendationsArchiveObjectPath,
  REC_STORAGE_PATH,
} = require("./pickRecommendations");
const { MODEL_VERSION } = require("./pickRecommendationsModel");

test("REC_STORAGE_PATH is pick-recommendations.json", () => {
  assert.equal(REC_STORAGE_PATH, "pick-recommendations.json");
});

test("recommendationsArchiveObjectPath uses colon-safe stamp", () => {
  assert.equal(
    recommendationsArchiveObjectPath("2026-07-22T12:30:00.000Z"),
    "pick-recommendations/archive/2026-07-22T12-30-00Z.json"
  );
});

test("showRecordFromOfficialDoc maps official_setlists shape", () => {
  const rec = showRecordFromOfficialDoc(
    {
      officialSetlist: ["Alpha", "Beta", "Gamma"],
      setlist: { s1o: "Alpha", s1c: "Beta", s2o: "Gamma", s2c: "Beta", enc: "Alpha" },
      encoreSongs: ["Alpha"],
    },
    "2024-07-19"
  );
  assert.equal(rec.showDate, "2024-07-19");
  assert.equal(rec.slots.s1o, "Alpha");
  assert.deepEqual(rec.songs, ["Alpha", "Beta", "Gamma"]);
});

test("buildPickRecommendationsArtifact skips invalid target", () => {
  const out = buildPickRecommendationsArtifact({
    targetShow: { date: "" },
    priors: [],
  });
  assert.equal(out.skipped, true);
  assert.equal(out.reason, "invalid-target-date");
});

test("buildPickRecommendationsArtifact skips empty history", () => {
  const out = buildPickRecommendationsArtifact({
    targetShow: { date: "2024-08-01", venue: "MSG" },
    priors: [],
  });
  assert.equal(out.skipped, true);
  assert.equal(out.reason, "insufficient-history");
});

test("buildPickRecommendationsArtifact emits versioned slots", () => {
  const priors = [
    {
      showDate: "2024-07-01",
      songs: ["Alpha", "Beta", "Gamma"],
      slots: { s1o: "Alpha", s1c: "Beta", s2o: "Gamma", s2c: "Alpha", enc: "Beta" },
      encoreSongs: ["Beta"],
    },
    {
      showDate: "2024-07-05",
      songs: ["Beta", "Delta", "Alpha"],
      slots: { s1o: "Beta", s1c: "Delta", s2o: "Alpha", s2c: "Beta", enc: "Delta" },
      encoreSongs: ["Delta"],
    },
  ];
  const out = buildPickRecommendationsArtifact({
    targetShow: {
      date: "2024-07-10",
      venue: "Test Venue",
      city: "Test City",
      tour: "Summer 2024",
    },
    priors,
    topK: 5,
    now: new Date("2024-07-09T12:00:00.000Z"),
  });
  assert.equal(out.skipped, false);
  assert.equal(out.artifact.modelVersion, MODEL_VERSION);
  assert.equal(out.artifact.targetShow.date, "2024-07-10");
  assert.equal(out.artifact.historyShowCount, 2);
  assert.equal(out.artifact.historySource, "firestore");
  assert.ok(Array.isArray(out.artifact.slots.s1o));
  assert.ok(out.artifact.slots.s1o.length >= 1);
  assert.equal(out.artifact.slots.s1o[0].rank, 1);
  assert.ok(out.artifact.slots.s1o[0].normalizedName);
  assert.ok(out.artifact.slots.s1o[0].riskBand);
  assert.ok(Array.isArray(out.artifact.slots.wild));
});
