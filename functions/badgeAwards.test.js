const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  computeUnlockedBadgeIds,
  badgeIdsToAward,
} = require("./badgeAwards");

describe("computeUnlockedBadgeIds", () => {
  it("returns empty for zero / missing counters", () => {
    assert.deepEqual(computeUnlockedBadgeIds({}), []);
    assert.deepEqual(computeUnlockedBadgeIds({ showsPlayed: 0, wins: 0 }), []);
  });

  it("unlocks shows_played thresholds", () => {
    assert.deepEqual(computeUnlockedBadgeIds({ showsPlayed: 1 }), [
      "shows_played_1",
    ]);
    assert.deepEqual(computeUnlockedBadgeIds({ showsPlayed: 5 }), [
      "shows_played_1",
      "shows_played_5",
    ]);
    assert.deepEqual(computeUnlockedBadgeIds({ showsPlayed: 10 }), [
      "shows_played_1",
      "shows_played_5",
      "shows_played_10",
    ]);
  });

  it("unlocks win_1 independently", () => {
    assert.deepEqual(computeUnlockedBadgeIds({ showsPlayed: 0, wins: 1 }), [
      "win_1",
    ]);
    assert.deepEqual(computeUnlockedBadgeIds({ showsPlayed: 3, wins: 2 }), [
      "shows_played_1",
      "win_1",
    ]);
  });
});

describe("badgeIdsToAward", () => {
  it("skips ids already present on the badges map", () => {
    assert.deepEqual(
      badgeIdsToAward(
        ["shows_played_1", "shows_played_5", "win_1"],
        {
          shows_played_1: { awardedAt: {}, scope: "career" },
        }
      ),
      ["shows_played_5", "win_1"]
    );
  });

  it("treats missing / null badges as empty", () => {
    assert.deepEqual(badgeIdsToAward(["win_1"], null), ["win_1"]);
    assert.deepEqual(badgeIdsToAward(["win_1"], undefined), ["win_1"]);
  });
});
