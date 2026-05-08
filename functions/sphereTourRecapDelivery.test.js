const test = require("node:test");
const assert = require("node:assert/strict");
const { aggregateTourStandings } = require("./sphereTourRecapDelivery");

test("aggregateTourStandings: sums points, wins, shows like tour leaderboard", () => {
  const picksByDate = [
    {
      date: "2026-04-16",
      picks: [
        {
          userId: "a",
          handle: "Alice",
          isGraded: true,
          picks: { opener: "Tweezer" },
          score: 10,
        },
        {
          userId: "b",
          handle: "Bob",
          isGraded: true,
          picks: { opener: "Reba" },
          score: 8,
        },
      ],
    },
    {
      date: "2026-04-17",
      picks: [
        {
          userId: "a",
          handle: "Alice",
          isGraded: true,
          picks: { opener: "YEM" },
          score: 5,
        },
        {
          userId: "b",
          handle: "Bob",
          isGraded: true,
          picks: { opener: "Mike's" },
          score: 12,
        },
      ],
    },
  ];

  const rows = aggregateTourStandings(picksByDate);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].uid, "b");
  assert.equal(rows[0].totalPoints, 20);
  assert.equal(rows[0].wins, 1);
  assert.equal(rows[0].shows, 2);
  assert.equal(rows[1].uid, "a");
  assert.equal(rows[1].totalPoints, 15);
  assert.equal(rows[1].wins, 1);
  assert.equal(rows[1].shows, 2);
});

test("aggregateTourStandings: skips ungraded picks", () => {
  const rows = aggregateTourStandings([
    {
      date: "2026-04-16",
      picks: [
        {
          userId: "a",
          handle: "A",
          isGraded: false,
          picks: { opener: "X" },
          score: 99,
        },
      ],
    },
  ]);
  assert.equal(rows.length, 0);
});
