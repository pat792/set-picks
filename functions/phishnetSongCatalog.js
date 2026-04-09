/**
 * Phish.net v5 `songs.json` → normalized catalog for picks autocomplete (issue #158).
 *
 * Endpoint: `GET https://api.phish.net/v5/songs.json?order_by=song&direction=asc&limit=10000&apikey=…`
 *
 * Publishes `song-catalog.json` to the default Firebase Storage bucket (public read for CDN fetch).
 */

const admin = require("firebase-admin");

/** Object path in the default Storage bucket. */
const CATALOG_STORAGE_PATH = "song-catalog.json";

/**
 * @param {unknown} data
 * @returns {boolean}
 */
function isPhishNetPayloadOk(data) {
  if (!data || typeof data !== "object") return false;
  const apiErr = /** @type {Record<string, unknown>} */ (data).error;
  return (
    apiErr === undefined ||
    apiErr === null ||
    apiErr === false ||
    apiErr === 0 ||
    apiErr === "0"
  );
}

/**
 * @param {unknown} row
 * @returns {{ name: string, total: string, gap: string, last: string } | null}
 */
function normalizePhishnetSongRow(row) {
  if (!row || typeof row !== "object") return null;
  const rec = /** @type {Record<string, unknown>} */ (row);
  const name = typeof rec.song === "string" ? rec.song.trim() : "";
  if (!name) return null;

  const times = rec.times_played;
  const total =
    typeof times === "number" && Number.isFinite(times)
      ? String(times)
      : "—";

  const gapRaw = rec.gap;
  let gap = "—";
  if (typeof gapRaw === "number" && Number.isFinite(gapRaw)) {
    gap = String(gapRaw);
  } else if (typeof gapRaw === "string" && gapRaw.trim()) {
    gap = gapRaw.trim();
  }

  const lastRaw = rec.last_played;
  const last =
    typeof lastRaw === "string" && lastRaw.trim() ? lastRaw.trim() : "—";

  return { name, total, gap, last };
}

/**
 * @param {string} apiKey
 * @returns {Promise<{ name: string, total: string, gap: string, last: string }[]>}
 */
async function fetchPhishnetSongsNormalized(apiKey) {
  const key = String(apiKey ?? "").trim();
  if (!key) {
    throw new Error("Phish.net API key is empty.");
  }

  const url = `https://api.phish.net/v5/songs.json?apikey=${encodeURIComponent(
    key
  )}&order_by=song&direction=asc&limit=10000`;

  let res;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error to Phish.net";
    throw new Error(msg);
  }

  let bodyText;
  try {
    bodyText = await res.text();
  } catch {
    throw new Error("Failed to read Phish.net songs response.");
  }

  if (!res.ok) {
    throw new Error(`Phish.net HTTP ${res.status}: ${bodyText.slice(0, 240)}`);
  }

  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error("Phish.net songs returned non-JSON.");
  }

  if (!isPhishNetPayloadOk(data)) {
    const msg =
      typeof data?.error_message === "string"
        ? data.error_message
        : "Phish.net API error.";
    throw new Error(msg);
  }

  const rows = Array.isArray(data.data) ? data.data : [];
  const songs = rows
    .map((r) => normalizePhishnetSongRow(r))
    .filter(Boolean);

  if (songs.length === 0) {
    throw new Error("Phish.net returned no songs.");
  }

  return songs;
}

/**
 * @param {string} bucketName
 * @returns {string}
 */
function publicGcsUrlForCatalog(bucketName) {
  return `https://storage.googleapis.com/${bucketName}/${CATALOG_STORAGE_PATH}`;
}

/**
 * Fetch from Phish.net, write `song-catalog.json` to Storage, make object world-readable for GET/fetch().
 *
 * @param {string} apiKey
 * @param {{ logger?: { info?: Function, warn?: Function, error?: Function }, bucketName?: string }} [opts]
 * @returns {Promise<{ songCount: number, publicUrl: string, bucket: string }>}
 */
async function syncPhishnetSongCatalogToStorage(apiKey, opts = {}) {
  const { logger, bucketName } = opts;
  const songs = await fetchPhishnetSongsNormalized(apiKey);
  const updatedAt = new Date().toISOString();
  const payload = {
    songs,
    songCount: songs.length,
    source: "phish.net/v5/songs",
    updatedAt,
  };
  const json = JSON.stringify(payload);

  const bucket = bucketName
    ? admin.storage().bucket(bucketName)
    : admin.storage().bucket();
  const file = bucket.file(CATALOG_STORAGE_PATH);

  await file.save(Buffer.from(json, "utf8"), {
    metadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "public, max-age=300",
    },
  });

  try {
    await file.makePublic();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger?.warn?.(
      "song catalog: makePublic failed (object may still work if bucket IAM allows public read)",
      msg
    );
  }

  const publicUrl = publicGcsUrlForCatalog(bucket.name);
  logger?.info?.("song catalog uploaded to Storage", {
    songCount: songs.length,
    publicUrl,
    bucket: bucket.name,
    object: CATALOG_STORAGE_PATH,
  });

  return { songCount: songs.length, publicUrl, bucket: bucket.name };
}

module.exports = {
  syncPhishnetSongCatalogToStorage,
  normalizePhishnetSongRow,
  isPhishNetPayloadOk,
  CATALOG_STORAGE_PATH,
  publicGcsUrlForCatalog,
};
