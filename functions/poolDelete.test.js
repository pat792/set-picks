const test = require("node:test");
const assert = require("node:assert/strict");

const {
  findPoolPickActivity,
  hasNonEmptyPicksObject,
  parseShowCalendarDates,
  pickDataCountsForPool,
  pickDocHasPoolActivity,
  pickDocId,
} = require("./poolDelete");

/**
 * Minimal fake Firestore that matches the `.collection(...).doc(...).get()`
 * shape used by `findPoolPickActivity`. Seeds pick docs by id.
 *
 * @param {Record<string, Record<string, unknown> | undefined>} picksById
 */
function createFakeDb(picksById) {
  const reads = [];
  return {
    reads,
    collection(name) {
      if (name !== "picks") {
        throw new Error(`unexpected collection ${name}`);
      }
      return {
        doc(id) {
          return {
            async get() {
              reads.push(id);
              const data = picksById[id];
              if (data === undefined) {
                return { exists: false, data: () => null };
              }
              return { exists: true, data: () => data };
            },
          };
        },
      };
    },
  };
}

test("hasNonEmptyPicksObject: empty / whitespace / non-object", () => {
  assert.equal(hasNonEmptyPicksObject(null), false);
  assert.equal(hasNonEmptyPicksObject(undefined), false);
  assert.equal(hasNonEmptyPicksObject([]), false);
  assert.equal(hasNonEmptyPicksObject({}), false);
  assert.equal(hasNonEmptyPicksObject({ s1o: "", s1c: "   " }), false);
  assert.equal(hasNonEmptyPicksObject({ s1o: "Bag" }), true);
});

test("pickDataCountsForPool: rejects empty inputs", () => {
  assert.equal(pickDataCountsForPool(null, "p1"), false);
  assert.equal(pickDataCountsForPool({}, ""), false);
  assert.equal(pickDataCountsForPool({}, "   "), false);
});

test("pickDataCountsForPool: legacy picks (no pools snapshot) count everywhere", () => {
  assert.equal(pickDataCountsForPool({ picks: { s1o: "Bag" } }, "p1"), true);
  assert.equal(pickDataCountsForPool({ pools: [] }, "p1"), true);
});

test("pickDataCountsForPool: embedded pools snapshot scopes to id match", () => {
  const data = { pools: [{ id: "p1", name: "A" }, { id: "p2", name: "B" }] };
  assert.equal(pickDataCountsForPool(data, "p1"), true);
  assert.equal(pickDataCountsForPool(data, "p3"), false);
});

test("pickDocHasPoolActivity: non-empty picks triggers activity", () => {
  assert.equal(
    pickDocHasPoolActivity({ picks: { s1o: "Bag" } }, "p1"),
    true
  );
});

test("pickDocHasPoolActivity: graded pick triggers activity even with empty picks", () => {
  assert.equal(
    pickDocHasPoolActivity({ picks: {}, isGraded: true }, "p1"),
    true
  );
});

test("pickDocHasPoolActivity: non-zero score triggers activity", () => {
  assert.equal(
    pickDocHasPoolActivity({ picks: {}, score: 15 }, "p1"),
    true
  );
});

test("pickDocHasPoolActivity: zero score + empty picks + ungraded is clean", () => {
  assert.equal(
    pickDocHasPoolActivity({ picks: {}, score: 0 }, "p1"),
    false
  );
  assert.equal(pickDocHasPoolActivity({}, "p1"), false);
});

test("pickDocHasPoolActivity: mismatched embedded pool scopes out", () => {
  assert.equal(
    pickDocHasPoolActivity(
      { picks: { s1o: "Bag" }, pools: [{ id: "other" }] },
      "p1"
    ),
    false
  );
});

test("parseShowCalendarDates: reads showDatesByTour shape", () => {
  const dates = parseShowCalendarDates({
    showDatesByTour: [
      {
        tour: "Sphere Run",
        shows: [
          { date: "2026-04-16", venue: "Sphere" },
          { date: "2026-04-17", venue: "Sphere" },
        ],
      },
      {
        tour: "Summer Tour",
        shows: [{ date: "2026-07-07", venue: "Kohl" }],
      },
    ],
  });
  assert.deepEqual(dates, ["2026-04-16", "2026-04-17", "2026-07-07"]);
});

test("parseShowCalendarDates: reads flat showDates object + string shapes", () => {
  const dates = parseShowCalendarDates({
    showDates: [
      { date: "2026-04-16", venue: "Sphere" },
      "2026-04-17",
      { date: " 2026-04-18 ", venue: "x" },
    ],
  });
  assert.deepEqual(dates, ["2026-04-16", "2026-04-17", "2026-04-18"]);
});

test("parseShowCalendarDates: empty / invalid inputs return []", () => {
  assert.deepEqual(parseShowCalendarDates(null), []);
  assert.deepEqual(parseShowCalendarDates({}), []);
  assert.deepEqual(parseShowCalendarDates({ showDates: [] }), []);
  assert.deepEqual(
    parseShowCalendarDates({ showDates: [{ date: "bad" }] }),
    []
  );
});

test("parseShowCalendarDates: dedupes across both shapes", () => {
  const dates = parseShowCalendarDates({
    showDatesByTour: [
      { tour: "t", shows: [{ date: "2026-04-16", venue: "x" }] },
    ],
    showDates: ["2026-04-16", "2026-04-17"],
  });
  assert.deepEqual(dates, ["2026-04-16", "2026-04-17"]);
});

test("findPoolPickActivity: returns false when no members or no dates", async () => {
  const db = createFakeDb({});
  assert.equal(
    await findPoolPickActivity({
      db,
      poolId: "p1",
      memberIds: [],
      showDates: ["2026-04-16"],
    }),
    false
  );
  assert.equal(
    await findPoolPickActivity({
      db,
      poolId: "p1",
      memberIds: ["u1"],
      showDates: [],
    }),
    false
  );
  assert.equal(db.reads.length, 0);
});

test("findPoolPickActivity: returns false when no pick docs exist", async () => {
  const db = createFakeDb({});
  const got = await findPoolPickActivity({
    db,
    poolId: "p1",
    memberIds: ["u1", "u2"],
    showDates: ["2026-04-16", "2026-04-17"],
  });
  assert.equal(got, false);
  assert.equal(db.reads.length, 4);
});

test("findPoolPickActivity: true when any member has non-empty picks", async () => {
  const db = createFakeDb({
    [pickDocId("2026-04-17", "u2")]: { picks: { s1o: "Bag" } },
  });
  const got = await findPoolPickActivity({
    db,
    poolId: "p1",
    memberIds: ["u1", "u2"],
    showDates: ["2026-04-16", "2026-04-17"],
  });
  assert.equal(got, true);
});

test("findPoolPickActivity: scopes to embedded pools array when present", async () => {
  const db = createFakeDb({
    [pickDocId("2026-04-16", "u1")]: {
      picks: { s1o: "Bag" },
      pools: [{ id: "other" }],
    },
  });
  const got = await findPoolPickActivity({
    db,
    poolId: "p1",
    memberIds: ["u1"],
    showDates: ["2026-04-16"],
  });
  assert.equal(got, false);
});

test("findPoolPickActivity: treats legacy (no pools) pick doc as in-pool activity", async () => {
  const db = createFakeDb({
    [pickDocId("2026-04-16", "u1")]: {
      picks: { s1o: "Bag" },
      // no `pools` array — legacy snapshot, should count for any pool.
    },
  });
  const got = await findPoolPickActivity({
    db,
    poolId: "p1",
    memberIds: ["u1"],
    showDates: ["2026-04-16"],
  });
  assert.equal(got, true);
});

test("findPoolPickActivity: graded + zero picks still triggers activity", async () => {
  const db = createFakeDb({
    [pickDocId("2026-04-16", "u1")]: { picks: {}, isGraded: true },
  });
  const got = await findPoolPickActivity({
    db,
    poolId: "p1",
    memberIds: ["u1"],
    showDates: ["2026-04-16"],
  });
  assert.equal(got, true);
});

test("findPoolPickActivity: chunk boundary still finds activity", async () => {
  /** @type {Record<string, Record<string, unknown>>} */
  const picksById = {};
  const members = Array.from({ length: 5 }, (_, i) => `u${i}`);
  const dates = Array.from(
    { length: 10 },
    (_, i) => `2026-04-${String(10 + i).padStart(2, "0")}`
  );
  picksById[pickDocId(dates[9], members[4])] = { picks: { s1o: "Bag" } };
  const db = createFakeDb(picksById);
  const got = await findPoolPickActivity({
    db,
    poolId: "p1",
    memberIds: members,
    showDates: dates,
    chunkSize: 7,
  });
  assert.equal(got, true);
  assert.equal(db.reads.length, 50);
});
