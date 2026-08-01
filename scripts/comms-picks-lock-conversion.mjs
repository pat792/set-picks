#!/usr/bin/env node
/**
 * Read-only Firestore join: fcm_notification_log (picks_lock_reminder)
 * ↔ picks → conversion % before venue-local lock (#698).
 *
 * Usage:
 *   npm run comms:picks-lock-conversion
 *   npm run comms:picks-lock-conversion -- --from 2026-07-18 --to 2026-08-01
 *   npm run comms:picks-lock-conversion -- --show-dates 2026-07-31,2026-08-01 --write
 *   npm run comms:picks-lock-conversion -- --days 14 --write
 *
 * Writes (with --write) to crew/output/intel/picks_lock-conversion-<stamp>.md
 * Never sends messaging; Admin read-only.
 */

import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  TRIGGER_ID,
  aggregateChannelSplit,
  computeShowConversion,
  formatConversionMarkdown,
  hasNonEmptyPicksObject,
  parseReminderLogDocId,
  pickDocId,
  toDate,
  venueLocalToUtc,
} from "./lib/picksLockConversion.mjs";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const { resolvePicksLockHm } = require("../functions/picksLockTime.js");

const DEFAULT_TZ = "America/New_York";

function loadEnv() {
  const envPath = resolve(root, ".env");
  const envVars = {};
  try {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
    }
  } catch {
    /* optional if process env already set */
  }
  return envVars;
}

function parseArgs(argv) {
  const out = {
    from: null,
    to: null,
    showDates: null,
    days: 14,
    write: false,
    includeInbox: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--write") out.write = true;
    else if (a === "--include-inbox") out.includeInbox = true;
    else if (a === "--from") out.from = argv[++i];
    else if (a === "--to") out.to = argv[++i];
    else if (a === "--days") out.days = Number(argv[++i]);
    else if (a === "--show-dates") {
      out.showDates = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return out;
}

function ymdAddDays(ymd, delta) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

function todayYmdDenver() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function resolveShowDateList(args, calendarShows) {
  if (args.showDates?.length) return [...args.showDates].sort();
  if (args.from && args.to) {
    const set = new Set();
    let cur = args.from;
    while (cur <= args.to) {
      set.add(cur);
      cur = ymdAddDays(cur, 1);
    }
    return calendarShows
      .map((s) => s.date)
      .filter((d) => set.has(d))
      .sort();
  }
  const end = todayYmdDenver();
  const start = ymdAddDays(end, -Math.max(1, args.days || 14));
  return calendarShows
    .map((s) => s.date)
    .filter((d) => d >= start && d <= end)
    .sort();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: comms-picks-lock-conversion [--from YMD --to YMD | --show-dates a,b | --days N] [--write] [--include-inbox]`);
    process.exit(0);
  }

  const envVars = loadEnv();
  const clientEmail = process.env.GCP_CLIENT_EMAIL || envVars.GCP_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GCP_PRIVATE_KEY || envVars.GCP_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) {
    console.error("Missing GCP_CLIENT_EMAIL / GCP_PRIVATE_KEY (env or .env)");
    process.exit(1);
  }

  const admin = require("../functions/node_modules/firebase-admin/lib/index.js");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "set-picks",
        clientEmail,
        privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
      }),
      projectId: "set-picks",
    });
  }
  const db = admin.firestore();

  const calSnap = await db.collection("show_calendar").doc("snapshot").get();
  const calendarShows = Array.isArray(calSnap.data()?.shows)
    ? calSnap.data().shows.filter(
        (s) => s && typeof s.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.date)
      )
    : [];
  const showByDate = new Map(calendarShows.map((s) => [s.date, s]));

  const showDates = resolveShowDateList(args, calendarShows);
  if (showDates.length === 0) {
    console.error("No show dates in window — check calendar / args");
    process.exit(2);
  }

  console.log(`→ Querying ${TRIGGER_ID} deliveries…`);
  const logSnap = await db
    .collection("fcm_notification_log")
    .where("triggerId", "==", TRIGGER_ID)
    .get();

  const showDateSet = new Set(showDates);
  const deliveries = [];
  for (const doc of logSnap.docs) {
    const parsed = parseReminderLogDocId(doc.id);
    if (!parsed || !showDateSet.has(parsed.showYmd)) continue;
    const data = doc.data() || {};
    if (data.kind != null && data.kind !== "comms") continue;
    if (data.delivered === false) continue;
    deliveries.push({
      docId: doc.id,
      userId: typeof data.userId === "string" ? data.userId : parsed.userId,
      showYmd: parsed.showYmd,
      channels: Array.isArray(data.channels) ? data.channels.map(String) : [],
      decidedAt: toDate(data.decidedAt),
    });
  }
  console.log(`✓ ${deliveries.length} delivery rows in window (${showDates.join(", ")})`);

  const lockByShow = new Map();
  for (const ymd of showDates) {
    const show = showByDate.get(ymd) || { date: ymd };
    const tz =
      typeof show.timeZone === "string" && show.timeZone.trim()
        ? show.timeZone.trim()
        : DEFAULT_TZ;
    const lockHm = resolvePicksLockHm({ ...show, date: ymd });

    let lockAt = venueLocalToUtc(ymd, lockHm.hour, lockHm.minute, tz);
    try {
      const stateSnap = await db.collection("show_lock_state").doc(ymd).get();
      const lockedAt = toDate(stateSnap.data()?.picksLockedAt);
      if (lockedAt && lockedAt.getTime() < lockAt.getTime()) {
        lockAt = lockedAt;
      }
    } catch {
      /* optional collection */
    }

    lockByShow.set(ymd, {
      showYmd: ymd,
      timeZone: tz,
      lockHour: lockHm.hour,
      lockMinute: lockHm.minute,
      lockAt,
    });
  }

  console.log(`→ Loading picks for ${deliveries.length} delivered users…`);
  const pickByKey = new Map();
  const CHUNK = 100;
  for (let i = 0; i < deliveries.length; i += CHUNK) {
    const slice = deliveries.slice(i, i + CHUNK);
    const refs = slice.map((d) =>
      db.collection("picks").doc(pickDocId(d.showYmd, d.userId))
    );
    const snaps = await db.getAll(...refs);
    for (let j = 0; j < snaps.length; j += 1) {
      const d = slice[j];
      const snap = snaps[j];
      const data = snap.exists ? snap.data() : null;
      let inboxReadAt = null;
      if (args.includeInbox && snap.exists) {
        try {
          const inboxSnap = await db
            .collection("users")
            .doc(d.userId)
            .collection("commsInbox")
            .doc(d.docId)
            .get();
          inboxReadAt = toDate(inboxSnap.data()?.readAt);
        } catch {
          /* ignore */
        }
      }
      pickByKey.set(`${d.showYmd}_${d.userId}`, {
        userId: d.userId,
        showDate: d.showYmd,
        hasPicks: hasNonEmptyPicksObject(data?.picks),
        updatedAt: toDate(data?.updatedAt),
        inboxReadAt,
      });
    }
  }

  const showRows = computeShowConversion(deliveries, pickByKey, lockByShow);
  const channelSplit = aggregateChannelSplit(showRows);
  const generatedAt = new Date().toISOString();
  const windowLabel =
    args.showDates?.length
      ? `show-dates ${showDates.join(",")}`
      : args.from && args.to
        ? `${args.from} → ${args.to}`
        : `last ${args.days}d (calendar ∩ Denver today)`;

  const md = formatConversionMarkdown({
    windowLabel,
    showDates,
    generatedAt,
    showRows,
    channelSplit,
    caveats: args.includeInbox
      ? ["Inbox `readAt` included when `--include-inbox`."]
      : ["Inbox `readAt` omitted (pass `--include-inbox` for inApp open proxy)."],
  });

  console.log("\n" + md);

  if (args.write) {
    const stamp = generatedAt.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const outDir = resolve(root, "crew/output/intel");
    mkdirSync(outDir, { recursive: true });
    const outPath = resolve(outDir, `picks_lock-conversion-${stamp}.md`);
    writeFileSync(outPath, md, "utf8");
    console.log(`\n✓ Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
