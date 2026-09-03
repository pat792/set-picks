#!/usr/bin/env node
/**
 * Weekly GSC + GA4 organic SEO snapshot (#932 / epic #926).
 *
 *   npm run seo:gsc-weekly-snapshot -- --fixture
 *   npm run seo:gsc-weekly-snapshot -- --fixture --write
 *   npm run seo:gsc-weekly-snapshot -- --post
 *
 * Live mode needs GSC Search Console credentials (see docs/SEO_GEO_PLAYBOOK.md §4).
 * Without credentials the script SKIP-exits 0 (forks / unset secrets must not go red).
 * --post comments on GitHub issue #926 only after a live pull — never posts fixtures.
 *
 * GA4 organic landings reuse the Optimize property (527619709) and the same ADC /
 * SA path as crew/scripts/ga4_snapshot.py — this is not a second analytics stack.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  SEO_EPIC,
  DEFAULT_SITE_URL,
  DEFAULT_GA4_PROPERTY,
  DEFAULT_TZ,
  GSC_QUERY_ROW_LIMIT,
  GSC_READONLY_SCOPE,
  GA4_READONLY_SCOPE,
  KEYWORD_LANDING_PATH,
  TOUR_STATS_PREFIX,
  hasLiveGscCredentials,
  last7dWindow,
  numOrNull,
  assembleSnapshot,
  buildPackMarkdown,
  buildWeeklyLogObject,
  filterOrganicLandings,
} from "../lib/seoGscSnapshot.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const DEFAULT_FIXTURE = path.join(
  __dirname,
  "fixtures/weekly-snapshot.fixture.json",
);
const DEFAULT_OUT_DIR = path.join(root, "crew/output/seo");
const TOKEN_URI = "https://oauth2.googleapis.com/token";

function parseArgs(argv) {
  const args = {
    fixture: false,
    fixturePath: DEFAULT_FIXTURE,
    post: false,
    write: false,
    outDir: DEFAULT_OUT_DIR,
    requireLive: false,
    date: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--fixture") {
      args.fixture = true;
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args.fixturePath = path.resolve(next);
        i += 1;
      }
    } else if (a === "--post") args.post = true;
    else if (a === "--write") args.write = true;
    else if (a === "--out-dir") args.outDir = path.resolve(argv[++i] || args.outDir);
    else if (a === "--require-live") args.requireLive = true;
    else if (a === "--date") args.date = argv[++i] || null;
    else if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--dry-run") {
      /* default: print only */
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(1);
    }
  }
  return args;
}

function loadRegistry() {
  const registryPath = path.join(root, "docs/seo/query-registry.json");
  return JSON.parse(fs.readFileSync(registryPath, "utf8"));
}

function logSkip(reason) {
  console.error(`SKIP: ${reason}`);
}

/**
 * @param {string} raw
 * @returns {object|null}
 */
function parseServiceAccountJson(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (parsed.type !== "service_account" || !parsed.private_key || !parsed.client_email) {
    return null;
  }
  if (typeof parsed.private_key === "string" && parsed.private_key.includes("\\n")) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

/**
 * @param {object} sa
 * @param {string[]} scopes
 * @returns {Promise<string>}
 */
async function mintServiceAccountToken(sa, scopes) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString(
    "base64url",
  );
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: scopes.join(" "),
      aud: sa.token_uri || TOKEN_URI,
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const jwt = `${unsigned}.${signer.sign(sa.private_key, "base64url")}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });
  const res = await fetch(sa.token_uri || TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(json?.error_description || json?.error || `token HTTP ${res.status}`);
  }
  return json.access_token;
}

/**
 * Resolve a bearer token. Prefers explicit tokens, then SA JSON / ADC file.
 *
 * @param {NodeJS.ProcessEnv} env
 * @param {string[]} scopes
 * @returns {Promise<string|null>}
 */
async function resolveAccessToken(env, scopes) {
  const explicit = String(env.GSC_ACCESS_TOKEN || env.GOOGLE_ACCESS_TOKEN || "").trim();
  if (explicit) return explicit;

  const inline = parseServiceAccountJson(env.GSC_SERVICE_ACCOUNT_JSON);
  if (inline) return mintServiceAccountToken(inline, scopes);

  const credPath = String(env.GOOGLE_APPLICATION_CREDENTIALS || "").trim();
  if (credPath && fs.existsSync(credPath)) {
    const fromFile = parseServiceAccountJson(fs.readFileSync(credPath, "utf8"));
    if (fromFile) return mintServiceAccountToken(fromFile, scopes);
  }

  try {
    const tok = spawnSync(
      "gcloud",
      ["auth", "print-access-token", `--scopes=${scopes.join(",")}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    if (tok.status === 0 && tok.stdout.trim()) return tok.stdout.trim();
  } catch {
    /* gcloud optional */
  }
  return null;
}

/**
 * @param {string} token
 * @param {string} siteUrl
 * @param {{ startDate: string, endDate: string }} range
 * @param {{ dimensions?: string[], rowLimit?: number }} [opts]
 */
async function gscSearchAnalytics(token, siteUrl, range, opts = {}) {
  const encoded = encodeURIComponent(siteUrl);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`;
  const body = {
    startDate: range.startDate,
    endDate: range.endDate,
    dataState: "final",
  };
  if (opts.dimensions) body.dimensions = opts.dimensions;
  if (opts.rowLimit) body.rowLimit = opts.rowLimit;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message || `GSC HTTP ${res.status}`);
  }
  return json;
}

/**
 * Organic sessions for /tour-stats* + keyword landing. Same Data API + property
 * as crew/scripts/ga4_snapshot.py (not a second GA4 integration).
 *
 * @param {string} token
 * @param {string} propertyId
 * @param {{ startDate: string, endDate: string }} range
 */
async function ga4OrganicLandings(token, propertyId, range) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const body = {
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [
      { name: "landingPage" },
      { name: "sessionDefaultChannelGroup" },
    ],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: "sessionDefaultChannelGroup",
              stringFilter: { matchType: "EXACT", value: "Organic Search" },
            },
          },
          {
            orGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: "landingPage",
                    stringFilter: {
                      matchType: "BEGINS_WITH",
                      value: TOUR_STATS_PREFIX,
                    },
                  },
                },
                {
                  filter: {
                    fieldName: "landingPage",
                    stringFilter: {
                      matchType: "EXACT",
                      value: KEYWORD_LANDING_PATH,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    limit: 50,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message || `GA4 HTTP ${res.status}`);
  }
  return (json.rows || []).map((row) => ({
    landingPage: row.dimensionValues?.[0]?.value || "",
    channel: row.dimensionValues?.[1]?.value || "",
    sessions: numOrNull(row.metricValues?.[0]?.value),
    totalUsers: numOrNull(row.metricValues?.[1]?.value),
  }));
}

function totalsFromGscResponse(json) {
  const row = json.rows?.[0];
  if (!row) {
    return { impressions: 0, clicks: 0, ctr: 0, avgPosition: null };
  }
  return {
    impressions: numOrNull(row.impressions),
    clicks: numOrNull(row.clicks),
    ctr: numOrNull(row.ctr),
    avgPosition: numOrNull(row.position),
  };
}

function queryRowsFromGscResponse(json) {
  return (json.rows || []).map((row) => ({
    query: row.keys?.[0] || "",
    impressions: numOrNull(row.impressions),
    clicks: numOrNull(row.clicks),
    ctr: numOrNull(row.ctr),
    position: numOrNull(row.position),
  }));
}

function writeOutputs(outDir, assembled, pack, loggedAt) {
  fs.mkdirSync(outDir, { recursive: true });
  const log = buildWeeklyLogObject({
    weekStarting: assembled.window.weekStarting,
    loggedAt,
    source: assembled.source,
    property: assembled.siteUrl,
    window: "last_7_days",
    site: assembled.site,
    queries: assembled.registryRows.map((r) => ({
      id: r.id,
      impressions: r.impressions,
      clicks: r.clicks,
      position: r.position,
      notes: "",
    })),
    newQueries: assembled.newQueries,
    ga4Organic: assembled.ga4,
    notes: `Pack generated ${loggedAt}`,
  });
  const jsonlPath = path.join(outDir, "weekly-log.jsonl");
  fs.appendFileSync(jsonlPath, `${JSON.stringify(log)}\n`, "utf8");
  const stamp = assembled.window.weekStarting || assembled.window.runDate;
  fs.writeFileSync(path.join(outDir, `${stamp}.json`), `${JSON.stringify(log, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, `${stamp}-pack.md`), pack);
  console.error(`Wrote ${jsonlPath} and ${stamp}.{json,pack.md} under ${outDir}`);
}

function postToEpic(body) {
  const r = spawnSync(
    "gh",
    ["issue", "comment", String(SEO_EPIC), "--body-file", "-"],
    { cwd: root, input: body, encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "gh issue comment failed");
    process.exit(r.status ?? 1);
  }
  console.error(`\nPosted SEO Optimize pack on #${SEO_EPIC}`);
  if (r.stdout) console.error(r.stdout.trim());
}

async function fetchLivePayload(env, window) {
  const siteUrl = String(env.GSC_SITE_URL || DEFAULT_SITE_URL).trim() || DEFAULT_SITE_URL;
  const propertyId =
    String(env.GA4_PROPERTY_ID || DEFAULT_GA4_PROPERTY).trim() || DEFAULT_GA4_PROPERTY;
  const scopes = [GSC_READONLY_SCOPE, GA4_READONLY_SCOPE];
  const token = await resolveAccessToken(env, scopes);
  if (!token) {
    return { skip: "live credentials present but no access token could be minted" };
  }

  const range = { startDate: window.startDate, endDate: window.endDate };
  const [totalsJson, queriesJson] = await Promise.all([
    gscSearchAnalytics(token, siteUrl, range),
    gscSearchAnalytics(token, siteUrl, range, {
      dimensions: ["query"],
      rowLimit: GSC_QUERY_ROW_LIMIT,
    }),
  ]);

  let ga4 = { propertyId, status: "unknown", rows: [], note: "" };
  try {
    const rows = await ga4OrganicLandings(token, propertyId, range);
    ga4 = {
      propertyId,
      status: "ok",
      rows: filterOrganicLandings(rows),
      note: "",
    };
  } catch (err) {
    ga4 = {
      propertyId,
      status: "unavailable",
      rows: [],
      note: `GA4 optional — ${err.message || err}. Same property as Optimize (docs/GA4_MCP_SETUP.md).`,
    };
  }

  return {
    payload: {
      source: "gsc-api",
      property: siteUrl,
      site: totalsFromGscResponse(totalsJson),
      queries: queryRowsFromGscResponse(queriesJson),
      ga4,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: gsc-weekly-snapshot [--fixture [path]] [--write] [--post] [--date YYYY-MM-DD] [--require-live]

  --fixture     Build a pack from the committed fixture (no network). Never --post.
  --write       Append crew/output/seo/weekly-log.jsonl (+ dated json/md).
  --post        Comment on GitHub #926 after a live GSC pull only.
  --require-live  Exit 1 when live credentials are missing (default: SKIP 0).
`);
    process.exit(0);
  }

  const registry = loadRegistry();
  const now = args.date
    ? new Date(`${args.date}T12:00:00Z`)
    : new Date();
  const window = last7dWindow(now, DEFAULT_TZ);

  if (args.fixture) {
    if (args.post) {
      console.error("Refusing --post with --fixture (never comment fixture packs on #926).");
      process.exit(1);
    }
    const fixture = JSON.parse(fs.readFileSync(args.fixturePath, "utf8"));
    const assembled = assembleSnapshot(fixture, registry, {
      runDate: fixture.runDate || window.runDate,
      startDate: fixture.startDate || window.startDate,
      endDate: fixture.endDate || window.endDate,
      weekStarting: fixture.weekStarting || window.weekStarting,
    });
    const pack = buildPackMarkdown({
      ...assembled.window,
      source: assembled.source,
      siteUrl: assembled.siteUrl,
      site: assembled.site,
      registryRows: assembled.registryRows,
      newQueries: assembled.newQueries,
      ga4: assembled.ga4,
      credentialNote:
        "Fixture / dry-run — not a live GSC pull. Human checkbox: manual snapshot against prod GSC.",
    });
    console.log(pack);
    if (args.write) {
      writeOutputs(args.outDir, assembled, pack, new Date().toISOString());
    } else {
      console.error("\n(dry) Pass --write to append crew/output/seo/ (gitignored).");
    }
    return;
  }

  if (!hasLiveGscCredentials(process.env)) {
    const msg =
      "no live GSC credentials (GSC_SERVICE_ACCOUNT_JSON, GSC_ACCESS_TOKEN, or GOOGLE_APPLICATION_CREDENTIALS). Not posting on #926.";
    if (args.requireLive) {
      console.error(`ERROR: ${msg}`);
      process.exit(1);
    }
    logSkip(msg);
    return;
  }

  let live;
  try {
    live = await fetchLivePayload(process.env, window);
  } catch (err) {
    console.error(`ERROR: live GSC pull failed (${err.message || err}).`);
    process.exit(1);
  }

  if (live.skip) {
    logSkip(live.skip);
    return;
  }

  const assembled = assembleSnapshot(live.payload, registry, window);
  const pack = buildPackMarkdown({
    ...assembled.window,
    source: assembled.source,
    siteUrl: assembled.siteUrl,
    site: assembled.site,
    registryRows: assembled.registryRows,
    newQueries: assembled.newQueries,
    ga4: assembled.ga4,
  });
  console.log(pack);

  if (args.write) {
    writeOutputs(args.outDir, assembled, pack, new Date().toISOString());
  }

  if (!args.post) {
    console.error("\n(dry) Pass --post to comment on GitHub issue #926.");
    return;
  }

  postToEpic(pack);
}

main().catch((err) => {
  console.error(`ERROR: ${err.message || err}`);
  process.exit(1);
});
