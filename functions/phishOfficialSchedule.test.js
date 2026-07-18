"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  extractOfficialDateUrls,
  fetchOfficialPhishSchedule,
  normalizeOfficialLocalTime,
  parseOfficialDatePage,
  showDateFromOfficialUrl,
} = require("./phishOfficialSchedule");

const SYRACUSE_URL =
  "https://phish.com/tours/dates/tue-2026-7-21-empower-federal-credit-union-amphitheater-at-lakeview/";

test("extractOfficialDateUrls dedupes Phish date links", () => {
  const html = `<a href="${SYRACUSE_URL}">one</a>
    <a href="${SYRACUSE_URL}">duplicate</a>`;
  assert.deepEqual(extractOfficialDateUrls(html), [SYRACUSE_URL]);
});

test("normalizes official local times", () => {
  assert.equal(normalizeOfficialLocalTime("5:30 pm"), "17:30");
  assert.equal(normalizeOfficialLocalTime("12:05 AM"), "00:05");
  assert.equal(normalizeOfficialLocalTime("bad"), null);
});

test("parses date and official doors/show time", () => {
  assert.equal(showDateFromOfficialUrl(SYRACUSE_URL), "2026-07-21");
  assert.deepEqual(
    parseOfficialDatePage(
      `<ul><li>Show Time: 7:00 pm</li><li>Doors Open: 5:30 pm</li></ul>`,
      SYRACUSE_URL
    ),
    {
      date: "2026-07-21",
      doorsLocal: "17:30",
      scheduledStartLocal: "19:00",
      scheduleSource: "phish.com",
      scheduleSourceUrl: SYRACUSE_URL,
    }
  );
});

test("fetchOfficialPhishSchedule tolerates one failed date page", async () => {
  const failedUrl =
    "https://phish.com/tours/dates/wed-2026-7-22-madison-square-garden/";
  const responses = new Map([
    [
      "https://phish.com/tours/",
      `<a href="${SYRACUSE_URL}">Syracuse</a><a href="${failedUrl}">MSG</a>`,
    ],
    [
      SYRACUSE_URL,
      `<li>Show Time: 7:00 pm</li><li>Doors Open: 5:30 pm</li>`,
    ],
  ]);
  const fetchImpl = async (url) => ({
    ok: responses.has(url),
    status: responses.has(url) ? 200 : 503,
    text: async () => responses.get(url) || "",
  });

  const out = await fetchOfficialPhishSchedule({ fetchImpl });
  assert.equal(out.size, 1);
  assert.equal(out.get("2026-07-21").doorsLocal, "17:30");
});
