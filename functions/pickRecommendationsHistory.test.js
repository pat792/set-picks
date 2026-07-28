/**
 * Unit tests for pick-recommendations Phish.net history merge (#721).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  mergePriorShowRecords,
  isoYearsBefore,
  showRecordFromPhishnetPayload,
  HISTORY_WINDOW_PATH,
} = require("./pickRecommendationsHistory");

test("HISTORY_WINDOW_PATH is private history object", () => {
  assert.equal(
    HISTORY_WINDOW_PATH,
    "pick-recommendations/history/window.json"
  );
});

test("isoYearsBefore rolls calendar year", () => {
  assert.equal(isoYearsBefore("2026-07-22", 1), "2025-07-22");
});

test("mergePriorShowRecords prefers Firestore on date ties and respects target cutoff", () => {
  const { priors, historySource } = mergePriorShowRecords({
    phishnetShows: [
      {
        showDate: "2025-01-01",
        songs: ["A"],
        slots: { s1o: "A" },
        encoreSongs: [],
      },
      {
        showDate: "2025-06-01",
        songs: ["PnOnly"],
        slots: { s1o: "PnOnly" },
        encoreSongs: [],
      },
      {
        showDate: "2026-07-22",
        songs: ["Leak"],
        slots: { s1o: "Leak" },
        encoreSongs: [],
      },
    ],
    firestoreShows: [
      {
        showDate: "2025-01-01",
        songs: ["FsWin"],
        slots: { s1o: "FsWin" },
        encoreSongs: [],
      },
    ],
    targetDate: "2026-07-22",
    limit: 50,
  });
  assert.equal(historySource, "merged");
  assert.equal(priors.length, 2);
  assert.equal(priors[0].slots.s1o, "FsWin");
  assert.equal(priors[1].slots.s1o, "PnOnly");
  assert.ok(!priors.some((r) => r.showDate === "2026-07-22"));
});

test("mergePriorShowRecords slices to limit keeping newest", () => {
  const phishnetShows = [];
  for (let i = 1; i <= 10; i += 1) {
    const d = `2025-01-${String(i).padStart(2, "0")}`;
    phishnetShows.push({
      showDate: d,
      songs: [`S${i}`],
      slots: { s1o: `S${i}` },
      encoreSongs: [],
    });
  }
  const { priors, historySource } = mergePriorShowRecords({
    phishnetShows,
    firestoreShows: [],
    targetDate: "2026-01-01",
    limit: 3,
  });
  assert.equal(historySource, "phishnet");
  assert.deepEqual(
    priors.map((r) => r.showDate),
    ["2025-01-08", "2025-01-09", "2025-01-10"]
  );
});

test("showRecordFromPhishnetPayload returns null on empty payload", () => {
  assert.equal(showRecordFromPhishnetPayload("2024-01-01", { data: [] }), null);
});
