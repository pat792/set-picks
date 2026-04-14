const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildSetlistDocFromRows,
  candidateShowDates,
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
  assert.equal(out.officialSetlist.length, 5);
});

test("buildSetlistDocFromRows preserves non-empty prior slots for partial feed", () => {
  const rows = normalizeSetlistRows({
    error: false,
    data: [{ set: "1", idx: 1, song: "AC/DC Bag" }],
  });
  const out = buildSetlistDocFromRows(rows, {
    setlist: { s1o: "AC/DC Bag", s1c: "Bathtub Gin", s2o: "Carini", s2c: "Zero", enc: "Loving Cup" },
  });
  assert.equal(out.setlist.s1o, "AC/DC Bag");
  assert.equal(out.setlist.s1c, "Bathtub Gin");
  assert.equal(out.setlist.s2o, "Carini");
  assert.equal(out.setlist.enc, "Loving Cup");
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

  let doc = { setlist: { s1o: "", s1c: "", s2o: "", s2c: "", enc: "" }, officialSetlist: [] };
  for (const payload of snapshots) {
    doc = buildSetlistDocFromRows(normalizeSetlistRows(payload), doc);
  }

  assert.equal(doc.setlist.s1o, "AC/DC Bag");
  assert.equal(doc.setlist.s1c, "Bathtub Gin");
  assert.equal(doc.setlist.s2o, "Carini");
  assert.equal(doc.setlist.enc, "Tweezer Reprise");
  assert.equal(doc.officialSetlist.length, 4);
});
