const test = require("node:test");
const assert = require("node:assert/strict");

const {
  BUSTOUT_MIN_GAP,
  buildSetlistDocFromRows,
  candidateShowDates,
  deriveBustoutsFromRows,
  isWithinLiveSetlistPollWindow,
  normalizeSetlistRows,
  parseShowCalendarSnapshotToDateSet,
  randomScheduledPollDelayMs,
  scheduledCandidateShowDates,
  setlistPayloadEqual,
  signatureFromRows,
} = require("./phishnetLiveSetlistAutomation");

/** Fixture: `show_calendar/snapshot`-shaped doc (subset). */
const SHOW_CALENDAR_SNAPSHOT_FIXTURE = {
  schemaVersion: 2,
  showDates: [
    { date: "2026-07-03", venue: "A" },
    { date: "2026-07-04", venue: "B" },
  ],
};

test("candidateShowDates returns ET today and previous day (admin / force poll)", () => {
  const dates = candidateShowDates(new Date("2026-04-15T01:30:00.000Z"));
  assert.equal(dates.length, 2);
  assert.match(dates[0], /^\d{4}-\d{2}-\d{2}$/);
  assert.match(dates[1], /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(dates[0], dates[1]);
});

test("parseShowCalendarSnapshotToDateSet reads flat showDates", () => {
  const set = parseShowCalendarSnapshotToDateSet(SHOW_CALENDAR_SNAPSHOT_FIXTURE);
  assert.ok(set);
  assert.equal(set.has("2026-07-03"), true);
  assert.equal(set.has("2026-07-04"), true);
});

test("parseShowCalendarSnapshotToDateSet accepts string dates", () => {
  const set = parseShowCalendarSnapshotToDateSet({
    showDates: ["2026-08-01", "2026-08-02"],
  });
  assert.ok(set);
  assert.equal(set.has("2026-08-01"), true);
});

test("parseShowCalendarSnapshotToDateSet returns null when strict-invalid", () => {
  assert.equal(parseShowCalendarSnapshotToDateSet(null), null);
  assert.equal(parseShowCalendarSnapshotToDateSet({}), null);
  assert.equal(parseShowCalendarSnapshotToDateSet({ showDates: [] }), null);
  assert.equal(parseShowCalendarSnapshotToDateSet({ showDates: [{ venue: "x" }] }), null);
});

test("isWithinLiveSetlistPollWindow: 4pm–3am ET (summer EDT)", () => {
  assert.equal(
    isWithinLiveSetlistPollWindow(new Date("2026-07-04T20:00:00-04:00")),
    true
  );
  assert.equal(
    isWithinLiveSetlistPollWindow(new Date("2026-07-04T15:00:00-04:00")),
    false
  );
  assert.equal(
    isWithinLiveSetlistPollWindow(new Date("2026-07-04T02:30:00-04:00")),
    true
  );
  assert.equal(
    isWithinLiveSetlistPollWindow(new Date("2026-07-04T03:00:00-04:00")),
    false
  );
});

test("isWithinLiveSetlistPollWindow: winter EST", () => {
  assert.equal(
    isWithinLiveSetlistPollWindow(new Date("2026-01-15T21:00:00-05:00")),
    true
  );
  assert.equal(
    isWithinLiveSetlistPollWindow(new Date("2026-01-15T14:00:00-05:00")),
    false
  );
});

test("scheduledCandidateShowDates: evening uses today only when in calendar", () => {
  const cal = parseShowCalendarSnapshotToDateSet(SHOW_CALENDAR_SNAPSHOT_FIXTURE);
  const dates = scheduledCandidateShowDates(
    new Date("2026-07-04T22:00:00-04:00"),
    cal
  );
  assert.deepEqual(dates, ["2026-07-04"]);
});

test("scheduledCandidateShowDates: after midnight adds yesterday when still a show date", () => {
  const cal = parseShowCalendarSnapshotToDateSet(SHOW_CALENDAR_SNAPSHOT_FIXTURE);
  const dates = scheduledCandidateShowDates(
    new Date("2026-07-04T01:30:00-04:00"),
    cal
  );
  assert.deepEqual(dates, ["2026-07-04", "2026-07-03"]);
});

test("scheduledCandidateShowDates: post-midnight only prior night when today not on calendar", () => {
  const cal = parseShowCalendarSnapshotToDateSet({
    showDates: [{ date: "2026-07-03", venue: "x" }],
  });
  const dates = scheduledCandidateShowDates(
    new Date("2026-07-04T01:00:00-04:00"),
    cal
  );
  assert.deepEqual(dates, ["2026-07-03"]);
});

test("randomScheduledPollDelayMs is within 3–5 minutes", () => {
  for (let i = 0; i < 50; i += 1) {
    const ms = randomScheduledPollDelayMs(Math.random);
    assert.ok(ms >= 3 * 60 * 1000 && ms <= 5 * 60 * 1000);
  }
  assert.equal(randomScheduledPollDelayMs(() => 0), 3 * 60 * 1000);
  assert.equal(randomScheduledPollDelayMs(() => 0.999999), 5 * 60 * 1000);
});

test("normalizeSetlistRows parses + sorts phish.net row shape", () => {
  const rows = normalizeSetlistRows({
    error: false,
    data: [
      { set: "2", idx: 2, song: "Zero" },
      { set: "1", idx: 1, song: "AC/DC Bag" },
      { set: "2", idx: 1, song: "Down with Disease" },
      { set: "E", idx: 1, song: "Tweezer Reprise" },
      { set: "1", idx: 2, song: "Bathtub Gin" },
    ],
  });
  assert.equal(rows[0].title, "AC/DC Bag");
  assert.equal(rows[rows.length - 1].title, "Tweezer Reprise");
});

test("buildSetlistDocFromRows maps slots and ordered list", () => {
  const rows = normalizeSetlistRows({
    error: false,
    data: [
      { set: "1", idx: 1, song: "AC/DC Bag" },
      { set: "1", idx: 2, song: "Bathtub Gin" },
      { set: "2", idx: 1, song: "Down with Disease" },
      { set: "2", idx: 2, song: "Zero" },
      { set: "E", idx: 1, song: "Tweezer Reprise" },
    ],
  });
  const out = buildSetlistDocFromRows(rows, {});
  assert.equal(out.setlist.s1o, "AC/DC Bag");
  assert.equal(out.setlist.s1c, "Bathtub Gin");
  assert.equal(out.setlist.s2o, "Down with Disease");
  assert.equal(out.setlist.s2c, "Zero");
  assert.equal(out.setlist.enc, "Tweezer Reprise");
  assert.deepEqual(out.encoreSongs, ["Tweezer Reprise"]);
  assert.equal(out.officialSetlist.length, 5);
});

test("buildSetlistDocFromRows preserves non-empty prior slots for partial feed", () => {
  const rows = normalizeSetlistRows({
    error: false,
    data: [{ set: "1", idx: 1, song: "AC/DC Bag" }],
  });
  const out = buildSetlistDocFromRows(rows, {
    setlist: { s1o: "AC/DC Bag", s1c: "Bathtub Gin", s2o: "Carini", s2c: "Zero", enc: "Loving Cup" },
    encoreSongs: ["Loving Cup"],
  });
  assert.equal(out.setlist.s1o, "AC/DC Bag");
  assert.equal(out.setlist.s1c, "");
  assert.equal(out.setlist.s2o, "Carini");
  assert.equal(out.setlist.s2c, "");
  assert.equal(out.setlist.enc, "Loving Cup");
  assert.deepEqual(out.encoreSongs, ["Loving Cup"]);
});

test("buildSetlistDocFromRows records every encore song", () => {
  const rows = normalizeSetlistRows({
    error: false,
    data: [
      { set: "1", idx: 1, song: "A" },
      { set: "2", idx: 1, song: "B" },
      { set: "E", idx: 1, song: "E1" },
      { set: "E", idx: 2, song: "E2" },
    ],
  });
  const out = buildSetlistDocFromRows(rows, {});
  assert.deepEqual(out.encoreSongs, ["E1", "E2"]);
  assert.equal(out.setlist.enc, "E1");
});

test("signatureFromRows stable and changes with song edits", () => {
  const base = normalizeSetlistRows({
    error: false,
    data: [{ set: "1", idx: 1, song: "AC/DC Bag" }],
  });
  const same = normalizeSetlistRows({
    error: false,
    data: [{ set: "1", idx: 1, song: "AC/DC Bag" }],
  });
  const changed = normalizeSetlistRows({
    error: false,
    data: [{ set: "1", idx: 1, song: "Possum" }],
  });
  assert.equal(signatureFromRows(base), signatureFromRows(same));
  assert.notEqual(signatureFromRows(base), signatureFromRows(changed));
});

test("setlistPayloadEqual compares slots and official ordering", () => {
  const a = {
    setlist: { s1o: "A", s1c: "B", s2o: "", s2c: "", enc: "" },
    officialSetlist: ["A", "B"],
  };
  const b = {
    setlist: { s1o: "A", s1c: "B", s2o: "", s2c: "", enc: "" },
    officialSetlist: ["A", "B"],
  };
  const c = {
    setlist: { s1o: "A", s1c: "B", s2o: "", s2c: "", enc: "" },
    officialSetlist: ["B", "A"],
  };
  assert.equal(setlistPayloadEqual(a, b), true);
  assert.equal(setlistPayloadEqual(a, c), false);
});

test("historical progression replay keeps slots stable as show grows", () => {
  const snapshots = [
    { error: false, data: [{ set: "1", idx: 1, song: "AC/DC Bag" }] },
    {
      error: false,
      data: [
        { set: "1", idx: 1, song: "AC/DC Bag" },
        { set: "1", idx: 2, song: "Bathtub Gin" },
      ],
    },
    {
      error: false,
      data: [
        { set: "1", idx: 1, song: "AC/DC Bag" },
        { set: "1", idx: 2, song: "Bathtub Gin" },
        { set: "2", idx: 1, song: "Carini" },
        { set: "E", idx: 1, song: "Tweezer Reprise" },
      ],
    },
  ];

  let doc = {
    setlist: { s1o: "", s1c: "", s2o: "", s2c: "", enc: "" },
    officialSetlist: [],
    encoreSongs: [],
  };
  for (const payload of snapshots) {
    doc = buildSetlistDocFromRows(normalizeSetlistRows(payload), doc);
  }

  assert.equal(doc.setlist.s1o, "AC/DC Bag");
  assert.equal(doc.setlist.s1c, "Bathtub Gin");
  assert.equal(doc.setlist.s2o, "Carini");
  assert.equal(doc.setlist.s2c, "Carini");
  assert.equal(doc.setlist.enc, "Tweezer Reprise");
  assert.deepEqual(doc.encoreSongs, ["Tweezer Reprise"]);
  assert.equal(doc.officialSetlist.length, 4);
});

// ---------- per-show bustouts snapshot (#214) ----------

test("normalizeSetlistRows preserves per-row gap (number and numeric string)", () => {
  const rows = normalizeSetlistRows({
    error: false,
    data: [
      { set: "1", idx: 1, song: "A", gap: 12 },
      { set: "1", idx: 2, song: "B", gap: "40" },
      { set: "1", idx: 3, song: "C", gap: null },
      { set: "1", idx: 4, song: "D" },
    ],
  });
  const byTitle = Object.fromEntries(rows.map((r) => [r.title, r.gap]));
  assert.equal(byTitle.A, 12);
  assert.equal(byTitle.B, 40);
  assert.equal(byTitle.C, null);
  assert.equal(byTitle.D, null);
});

test("deriveBustoutsFromRows selects titles with gap >= BUSTOUT_MIN_GAP", () => {
  const rows = [
    { setKey: "1", position: 1, title: "Low Gap", gap: 5 },
    { setKey: "1", position: 2, title: "Exact Threshold", gap: BUSTOUT_MIN_GAP },
    { setKey: "1", position: 3, title: "Big Gap", gap: 137 },
    { setKey: "1", position: 4, title: "Unknown Gap", gap: null },
  ];
  const bustouts = deriveBustoutsFromRows(rows);
  assert.deepEqual(bustouts, ["Exact Threshold", "Big Gap"]);
});

test("deriveBustoutsFromRows dedupes by normalized title, keeps first casing", () => {
  const rows = [
    { setKey: "1", position: 1, title: "Colonel Forbin's Ascent", gap: 98 },
    { setKey: "E", position: 1, title: "COLONEL FORBIN'S ASCENT", gap: 98 },
  ];
  const bustouts = deriveBustoutsFromRows(rows);
  assert.deepEqual(bustouts, ["Colonel Forbin's Ascent"]);
});

test("buildSetlistDocFromRows emits bustouts from per-row gap", () => {
  const rows = normalizeSetlistRows({
    error: false,
    data: [
      { set: "1", idx: 1, song: "AC/DC Bag", gap: 8 },
      { set: "1", idx: 2, song: "Bathtub Gin", gap: 14 },
      { set: "2", idx: 1, song: "Colonel Forbin's Ascent", gap: 98 },
      { set: "2", idx: 2, song: "Down with Disease", gap: 2 },
      { set: "E", idx: 1, song: "Fluff's Travels", gap: 1884 },
    ],
  });
  const out = buildSetlistDocFromRows(rows, {});
  assert.deepEqual(out.bustouts, ["Colonel Forbin's Ascent", "Fluff's Travels"]);
});

test("buildSetlistDocFromRows merges prior bustouts as a superset (partial feed safety)", () => {
  const rows = normalizeSetlistRows({
    error: false,
    data: [
      // Set 1 already played; Phish.net might already include gap here.
      { set: "1", idx: 1, song: "AC/DC Bag", gap: 8 },
      // Set 2 not yet played in this feed; prior snapshot has a bustout from
      // an earlier partial poll. We must preserve it.
    ],
  });
  const out = buildSetlistDocFromRows(rows, {
    bustouts: ["Colonel Forbin's Ascent"],
  });
  // Prior bustout preserved even though it is not in the current rows slice.
  assert.ok(out.bustouts.includes("Colonel Forbin's Ascent"));
});

test("setlistPayloadEqual detects bustouts membership change, ignores casing/order", () => {
  const base = {
    setlist: { s1o: "A", s1c: "", s2o: "", s2c: "", enc: "" },
    officialSetlist: ["A"],
    encoreSongs: [],
    bustouts: ["Colonel Forbin's Ascent", "Fluff's Travels"],
  };
  const reordered = { ...base, bustouts: ["Fluff's Travels", "Colonel Forbin's Ascent"] };
  const recased = { ...base, bustouts: ["colonel forbin's ascent", "fluff's travels"] };
  const removed = { ...base, bustouts: ["Colonel Forbin's Ascent"] };
  const added = { ...base, bustouts: [...base.bustouts, "Minkin"] };

  assert.equal(setlistPayloadEqual(base, reordered), true);
  assert.equal(setlistPayloadEqual(base, recased), true);
  assert.equal(setlistPayloadEqual(base, removed), false);
  assert.equal(setlistPayloadEqual(base, added), false);
});

test("setlistPayloadEqual: absent bustouts on both sides still compares equal", () => {
  const a = {
    setlist: { s1o: "A", s1c: "", s2o: "", s2c: "", enc: "" },
    officialSetlist: ["A"],
    encoreSongs: [],
  };
  const b = { ...a };
  assert.equal(setlistPayloadEqual(a, b), true);
});
