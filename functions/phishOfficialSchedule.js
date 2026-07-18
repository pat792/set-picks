"use strict";

/**
 * First-party Phish.com schedule enrichment for `show_calendar` (#522).
 *
 * Phish.net remains canonical for dates/tours/venues. Phish.com date pages add
 * the fields its API does not expose: "Doors Open" and advertised "Show Time".
 */

const PHISH_TOURS_URL = "https://phish.com/tours/";
const USER_AGENT = "SetlistPickEm/1.0 (+https://www.setlistpickem.com)";

/**
 * @param {string} html
 * @returns {string[]}
 */
function extractOfficialDateUrls(html) {
  if (typeof html !== "string") return [];
  const urls = new Set();
  const pattern =
    /href=["'](https:\/\/phish\.com\/tours\/dates\/[^"'?#]+\/?)["']/gi;
  for (const match of html.matchAll(pattern)) {
    urls.add(match[1].endsWith("/") ? match[1] : `${match[1]}/`);
  }
  return [...urls];
}

/**
 * @param {string} url
 * @returns {string | null}
 */
function showDateFromOfficialUrl(url) {
  const match = String(url).match(
    /\/tours\/dates\/[a-z]+-(\d{4})-(\d{1,2})-(\d{1,2})-/i
  );
  if (!match) return null;
  return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(
    match[3]
  ).padStart(2, "0")}`;
}

/**
 * @param {string} value
 * @returns {string | null} `HH:mm`
 */
function normalizeOfficialLocalTime(value) {
  const match = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*([ap])\.?m\.?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  const isPm = match[3].toLowerCase() === "p";
  if (isPm && hour !== 12) hour += 12;
  if (!isPm && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )}`;
}

/**
 * @param {string} html
 * @param {string} sourceUrl
 * @returns {{ date: string, doorsLocal?: string, scheduledStartLocal?: string, scheduleSource: 'phish.com', scheduleSourceUrl: string } | null}
 */
function parseOfficialDatePage(html, sourceUrl) {
  const date = showDateFromOfficialUrl(sourceUrl);
  if (!date || typeof html !== "string") return null;
  const doorsMatch = html.match(
    /Doors\s+Open:\s*(\d{1,2}:\d{2}\s*[ap]\.?m\.?)/i
  );
  const showMatch = html.match(
    /Show\s+Time:\s*(\d{1,2}:\d{2}\s*[ap]\.?m\.?)/i
  );
  const doorsLocal = doorsMatch
    ? normalizeOfficialLocalTime(doorsMatch[1])
    : null;
  const scheduledStartLocal = showMatch
    ? normalizeOfficialLocalTime(showMatch[1])
    : null;
  if (!doorsLocal && !scheduledStartLocal) return null;
  return {
    date,
    ...(doorsLocal ? { doorsLocal } : {}),
    ...(scheduledStartLocal ? { scheduledStartLocal } : {}),
    scheduleSource: "phish.com",
    scheduleSourceUrl: sourceUrl,
  };
}

/**
 * Fetches official upcoming date pages in small batches.
 *
 * @param {{ fetchImpl?: typeof fetch, logger?: { warn?: Function, info?: Function } }} [opts]
 * @returns {Promise<Map<string, { date: string, doorsLocal?: string, scheduledStartLocal?: string, scheduleSource: 'phish.com', scheduleSourceUrl: string }>>}
 */
async function fetchOfficialPhishSchedule({
  fetchImpl = fetch,
  logger,
} = {}) {
  const indexRes = await fetchImpl(PHISH_TOURS_URL, {
    headers: { Accept: "text/html", "User-Agent": USER_AGENT },
  });
  if (!indexRes.ok) {
    throw new Error(`Phish.com tours: HTTP ${indexRes.status}`);
  }
  const dateUrls = extractOfficialDateUrls(await indexRes.text());
  const schedule = new Map();

  for (let i = 0; i < dateUrls.length; i += 6) {
    const batch = dateUrls.slice(i, i + 6);
    const rows = await Promise.all(
      batch.map(async (url) => {
        try {
          const res = await fetchImpl(url, {
            headers: { Accept: "text/html", "User-Agent": USER_AGENT },
          });
          if (!res.ok) {
            logger?.warn?.("phish.com date page fetch failed", {
              url,
              status: res.status,
            });
            return null;
          }
          return parseOfficialDatePage(await res.text(), url);
        } catch (error) {
          logger?.warn?.("phish.com date page fetch failed", {
            url,
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        }
      })
    );
    for (const row of rows) {
      if (row) schedule.set(row.date, row);
    }
  }

  logger?.info?.("phish.com schedule fetch ok", {
    datePages: dateUrls.length,
    timedShows: schedule.size,
  });
  return schedule;
}

module.exports = {
  PHISH_TOURS_URL,
  extractOfficialDateUrls,
  fetchOfficialPhishSchedule,
  normalizeOfficialLocalTime,
  parseOfficialDatePage,
  showDateFromOfficialUrl,
};
