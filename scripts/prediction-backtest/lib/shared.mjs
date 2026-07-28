/**
 * Shared helpers for the prediction backtest harness (#648).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const CACHE_DIR = join(ROOT, "data/prediction-backtest");
export const SETLISTS_DIR = join(CACHE_DIR, "setlists");
export const REPORTS_DIR = join(CACHE_DIR, "reports");

export const SLOT_IDS = ["s1o", "s1c", "s2o", "s2c", "enc", "wild"];
export const POSITIONAL_SLOTS = ["s1o", "s1c", "s2o", "s2c", "enc"];

const require = createRequire(import.meta.url);

/** @returns {typeof import('../../../functions/phishnetLiveSetlistAutomation.js')} */
export function loadSetlistAutomation() {
  return require(join(ROOT, "functions/phishnetLiveSetlistAutomation.js"));
}

/** @returns {typeof import('../../../functions/phishnetShowCalendar.js')} */
export function loadShowCalendar() {
  return require(join(ROOT, "functions/phishnetShowCalendar.js"));
}

/**
 * @param {string} [envPath]
 * @returns {string}
 */
export function loadPhishnetApiKey(envPath = join(ROOT, ".env")) {
  if (!existsSync(envPath)) return "";
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t.startsWith("#") || !t) continue;
    const m = /^PHISHNET_API_KEY=(.*)$/.exec(t);
    if (m) return m[1].replace(/^["']|["']$/g, "").trim();
  }
  return "";
}

/**
 * Normalize song titles for join/compare (casefold + collapse whitespace).
 * @param {unknown} title
 * @returns {string}
 */
export function normalizeTitle(title) {
  return String(title ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number} days from a → b (can be negative)
 */
export function daysBetween(a, b) {
  const ta = Date.parse(`${a}T12:00:00Z`);
  const tb = Date.parse(`${b}T12:00:00Z`);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return NaN;
  return Math.round((tb - ta) / 86_400_000);
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
