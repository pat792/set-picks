const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  ALL_TIME_DOC_ID,
  GLOBAL_LEADERBOARD_MIN_SHOWS,
  GLOBAL_LEADERBOARD_SLOTS_PER_SHOW,
  GLOBAL_LEADERBOARD_TOP_N,
  buildLeaderboardPayloads,
  computePickingAverage,
  computePointsPerShow,
  rankBoard,
  tourLeaderboardDocId,
} = require("./globalStatsLeaderboards");

describe("global stats ratios (#1004)", () => {
  it("points per show is totalPoints / shows", () => {
    assert.equal(computePointsPerShow(30, 3), 10);
    assert.equal(computePointsPerShow(7, 2), 3.5);
    assert.equal(computePointsPerShow(10, 0), null);
    assert.equal(computePointsPerShow(undefined, 4), null);
  });

  it("picking average is correctSlots / (shows * 6)", () => {
    assert.equal(GLOBAL_LEADERBOARD_SLOTS_PER_SHOW, 6);
    assert.equal(computePickingAverage(9, 3), 0.5);
    assert.equal(computePickingAverage(6, 1), 1);
    assert.equal(computePickingAverage(null, 4), null);
    assert.equal(computePickingAverage(12, 0), null);
  });
});

describe("rankBoard min-shows gate + ranking", () => {
  const rows = [
    { uid: "spike", handle: "Spike", value: 20, shows: 1 },
    { uid: "steady", handle: "Steady", value: 12, shows: 4 },
    { uid: "mid", handle: "Mid", value: 11, shows: 3 },
    { uid: "low", handle: "Low", value: 10, shows: 8 },
    { uid: "tieA", handle: "Ada", value: 12, shows: 4 },
    { uid: "nogame", handle: "NoGame", value: null, shows: 5 },
  ];

  it("drops one-show spikes from ratio boards (default minShows = 3)", () => {
    assert.equal(GLOBAL_LEADERBOARD_MIN_SHOWS, 3);
    const ranked = rankBoard(rows);
    assert.equal(
      ranked.some((r) => r.uid === "spike"),
      false
    );
    assert.equal(ranked[0].uid, "tieA");
    assert.equal(ranked[1].uid, "steady");
    assert.equal(ranked[0].rank, 1);
    assert.equal(ranked[1].rank, 1);
    assert.equal(ranked[2].uid, "mid");
    assert.equal(ranked[2].rank, 3);
  });

  it("shows-count board has no ratio gate", () => {
    const showRows = [
      { uid: "a", handle: "A", value: 1, shows: 1 },
      { uid: "b", handle: "B", value: 12, shows: 12 },
      { uid: "c", handle: "C", value: 12, shows: 12 },
    ];
    const ranked = rankBoard(showRows, { minShows: 0 });
    assert.equal(ranked.length, 3);
    assert.equal(ranked[0].uid, "b");
    assert.equal(ranked[1].uid, "c");
    assert.equal(ranked[0].rank, 1);
    assert.equal(ranked[1].rank, 1);
    assert.equal(ranked[2].uid, "a");
    assert.equal(ranked[2].rank, 3);
  });

  it("caps at top 50", () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      uid: `u${i}`,
      handle: `H${String(i).padStart(2, "0")}`,
      value: 60 - i,
      shows: 5,
    }));
    const ranked = rankBoard(many);
    assert.equal(ranked.length, GLOBAL_LEADERBOARD_TOP_N);
    assert.equal(ranked[0].uid, "u0");
    assert.equal(ranked[49].uid, "u49");
  });
});

describe("buildLeaderboardPayloads", () => {
  const users = [
    {
      uid: "alice",
      handle: "Alice",
      totalPoints: 40,
      showsPlayed: 4,
      careerCorrectSlots: 12,
      seasonStats: {
        "2026 Summer Tour": { totalPoints: 20, shows: 2, correctSlots: 6 },
        "2026 Sphere": { totalPoints: 20, shows: 4, correctSlots: 8 },
      },
    },
    {
      uid: "bob",
      handle: "Bob",
      totalPoints: 90,
      showsPlayed: 6,
      careerCorrectSlots: 24,
      seasonStats: {
        "2026 Summer Tour": { totalPoints: 45, shows: 3, correctSlots: 12 },
      },
    },
    {
      uid: "oneShow",
      handle: "Spike",
      totalPoints: 40,
      showsPlayed: 1,
      careerCorrectSlots: 6,
      seasonStats: {
        "2026 Summer Tour": { totalPoints: 40, shows: 1, correctSlots: 6 },
      },
    },
  ];

  it("writes all-time plus the requested tour only", () => {
    const payloads = buildLeaderboardPayloads({
      users,
      tourKey: "2026 Summer Tour",
    });
    assert.equal(payloads.length, 2);
    assert.equal(payloads[0].docId, ALL_TIME_DOC_ID);
    assert.equal(payloads[1].docId, tourLeaderboardDocId("2026 Summer Tour"));
    assert.equal(
      payloads[0].boards.pointsPerShow.some((r) => r.uid === "oneShow"),
      false
    );
    assert.equal(payloads[0].boards.pointsPerShow[0].uid, "bob");
    assert.equal(payloads[0].boards.shows.some((r) => r.uid === "oneShow"), true);
    assert.equal(
      payloads[1].boards.pointsPerShow.some((r) => r.uid === "alice"),
      false
    );
    assert.equal(payloads[1].boards.pointsPerShow[0].uid, "bob");
    assert.equal(payloads[1].boards.shows.length, 3);
  });

  it("allTours emits every seasonStats tour plus all-time", () => {
    const payloads = buildLeaderboardPayloads({ users, allTours: true });
    const ids = payloads.map((p) => p.docId).sort();
    assert.deepEqual(ids, [
      ALL_TIME_DOC_ID,
      tourLeaderboardDocId("2026 Sphere"),
      tourLeaderboardDocId("2026 Summer Tour"),
    ]);
  });
});

describe("rebuildGlobalStatsLeaderboards writer", () => {
  it("scans users pages and writes aggregate docs", async () => {
    const { rebuildGlobalStatsLeaderboards } = require("./globalStatsLeaderboards");
    const written = [];
    const page1 = {
      empty: false,
      size: 1,
      docs: [
        {
          id: "alice",
          data: () => ({
            handle: "Alice",
            totalPoints: 30,
            showsPlayed: 3,
            careerCorrectSlots: 9,
            seasonStats: {
              "2026 Summer Tour": { totalPoints: 30, shows: 3, correctSlots: 9 },
            },
          }),
        },
      ],
    };
    const emptyPage = { empty: true, size: 0, docs: [] };
    let calls = 0;

    const db = {
      collection(name) {
        if (name === "users") {
          return {
            orderBy() {
              return this;
            },
            limit() {
              return this;
            },
            startAfter() {
              return this;
            },
            async get() {
              calls += 1;
              return calls === 1 ? page1 : emptyPage;
            },
          };
        }
        if (name === "global_stats_leaderboards") {
          return {
            doc(id) {
              return {
                async set(data) {
                  written.push({ id, data });
                },
              };
            },
          };
        }
        throw new Error(`unexpected collection ${name}`);
      },
    };

    const admin = {
      firestore: { FieldValue: { serverTimestamp: () => "TS" } },
    };

    const result = await rebuildGlobalStatsLeaderboards({
      db,
      admin,
      tourKey: "2026 Summer Tour",
      trigger: "rollup",
    });

    assert.equal(result.usersScanned, 1);
    assert.equal(result.docsWritten, 2);
    assert.equal(written[0].id, ALL_TIME_DOC_ID);
    assert.equal(written[1].id, tourLeaderboardDocId("2026 Summer Tour"));
    assert.equal(written[0].data.trigger, "rollup");
    assert.equal(written[0].data.minShows, 3);
    assert.equal(written[0].data.slotsPerShow, 6);
    assert.equal(written[0].data.boards.pointsPerShow[0].uid, "alice");
  });
});
