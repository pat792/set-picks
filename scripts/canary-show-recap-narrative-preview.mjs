#!/usr/bin/env node
/**
 * Send local-rendered show-recap narrative branch emails (morning
 * tour_rankings_daily “your night” + tour block) via Resend.
 *
 * Covers cold / mixed / hot_night / bustout_hero plus single + multi Bustout labels (#780).
 *
 * Usage:
 *   node scripts/canary-show-recap-narrative-preview.mjs
 *   node scripts/canary-show-recap-narrative-preview.mjs --send other@example.com
 */

import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const envPath = resolve(root, ".env");
/** @type {Record<string, string>} */
const fileEnv = {};
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    fileEnv[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
} catch {
  // optional
}

function shouldApplyEnvFile(key, fileValue) {
  const existing = process.env[key];
  if (existing == null || existing === "") return true;
  if (key === "RESEND_API_KEY") {
    const ok = typeof fileValue === "string" && fileValue.startsWith("re_");
    const shellOk = typeof existing === "string" && existing.startsWith("re_");
    return ok && !shellOk;
  }
  return false;
}

for (const [key, value] of Object.entries(fileEnv)) {
  if (shouldApplyEnvFile(key, value)) process.env[key] = value;
}

const args = process.argv.slice(2);
const sendTo =
  (args.includes("--send") ? args[args.indexOf("--send") + 1] : null) ||
  "pat@road2media.com";

const siteUrl = "https://www.setlistpickem.com";
const settingsUrl = `${siteUrl}/dashboard/profile/notifications`;

const { buildProductionBrandedEmailShell } = require(
  resolve(root, "functions/commsEmailWorker.js"),
);
const { buildEmailTrackedCtaUrl } = require(resolve(root, "comms/emailLinks.cjs"));
const { renderCommsTemplate } = require(resolve(root, "functions/commsTemplates.js"));

const baseTour = {
  tour_rank: 6,
  total_tour_pickers: 11,
  tour_points: 45,
  rank_change: "held",
  shows_played: 8,
  next_show_date: "2026-08-01",
  next_show_venue: "Fenway Park",
};

/** @type {{ name: string, payload: Record<string, unknown> }[]} */
const BRANCHES = [
  {
    name: "Cold + Bustout (Fenway Melt the Guns)",
    payload: {
      handle: "ChowdahBoyz4Lyfe",
      show_date: "2026-07-31",
      venue_name: "Fenway Park",
      venue_city: "Boston, MA",
      show_score: 10,
      global_rank: 6,
      global_total_pickers: 11,
      correct_picks_count: 1,
      total_picks_count: 6,
      narrative_branch: "cold",
      setlist_highlight: "Bustout: Melt the Guns - a 2051 show gap.",
      narrative_line:
        "Set 1 opened with Carini (10 songs); Set 2 added 8; encore closed on A Life Beyond The Dream. Tough board — you hit the opener (1 of 6); still a night to remember: Bustout: Melt the Guns - a 2051 show gap. You sit #6 of 11 globally.",
      ...baseTour,
    },
  },
  {
    name: "Bustout hero (you caught it)",
    payload: {
      handle: "Pat",
      show_date: "2026-07-31",
      venue_name: "Fenway Park",
      venue_city: "Boston, MA",
      show_score: 30,
      global_rank: 2,
      global_total_pickers: 11,
      correct_picks_count: 2,
      total_picks_count: 6,
      bustout_bonus: 20,
      narrative_branch: "bustout_hero",
      setlist_highlight: "Bustout: Melt the Guns - a 2051 show gap.",
      narrative_line:
        "Set 1 opened with Carini (10 songs); Set 2 added 8; encore closed on A Life Beyond The Dream. You caught a bustout — Melt the Guns - a 2051 show gap on your wildcard (2 of 6). That puts you #2 of 11 globally.",
      ...baseTour,
      tour_rank: 2,
      tour_points: 80,
      rank_change: "up 3",
    },
  },
  {
    name: "Hot night + single Bustout",
    payload: {
      handle: "RiverTranced",
      show_date: "2026-07-18",
      venue_name: "MSG",
      venue_city: "New York, NY",
      show_score: 70,
      global_rank: 4,
      global_total_pickers: 200,
      correct_picks_count: 5,
      total_picks_count: 6,
      narrative_branch: "hot_night",
      setlist_highlight: "Bustout: Wolfman's Brother - an 87 show gap.",
      narrative_line:
        "Set 1 opened with YEM (8 songs); Set 2 added 7; encore closed on Slave. Strong night — you hit all six; Bustout: Wolfman's Brother - an 87 show gap stayed off your board. That puts you #4 of 200 globally.",
      ...baseTour,
      tour_rank: 4,
      total_tour_pickers: 312,
      tour_points: 455,
      rank_change: "up 2",
      shows_played: 5,
      next_show_date: "2026-07-20",
      next_show_venue: "MSG",
    },
  },
  {
    name: "Mixed + Bustouts (multi)",
    payload: {
      handle: "CouchTourPat",
      show_date: "2026-07-15",
      venue_name: "Enmarket Arena",
      venue_city: "Savannah, GA",
      show_score: 25,
      global_rank: 18,
      global_total_pickers: 80,
      correct_picks_count: 2,
      total_picks_count: 6,
      narrative_branch: "mixed",
      setlist_highlight:
        "Bustouts: Curtain With - a 142 show gap; Fluffhead - an 87 show gap.",
      narrative_line:
        "Set 1 opened with YEM (6 songs); encore closed on Slave. You hit the opener and closer (2 of 6); Bustouts: Curtain With - a 142 show gap; Fluffhead - an 87 show gap stayed off your board. You sit #18 of 80 globally.",
      ...baseTour,
      tour_rank: 22,
      total_tour_pickers: 90,
      tour_points: 120,
      rank_change: "down 1",
      shows_played: 4,
      next_show_date: "2026-07-17",
      next_show_venue: "Walnut Creek",
    },
  },
  {
    name: "Cold + no bustout (fallback)",
    payload: {
      handle: "Pat",
      show_date: "2026-07-22",
      venue_name: "Madison Square Garden",
      venue_city: "New York, NY",
      show_score: 5,
      global_rank: 40,
      global_total_pickers: 200,
      correct_picks_count: 0,
      total_picks_count: 6,
      narrative_branch: "cold",
      setlist_highlight: "Carini opened; Slave closed the night.",
      narrative_line:
        "Carini opened; Slave closed the night. Tough board — none of your six landed. That lands you #40 of 200 globally.",
      ...baseTour,
      tour_rank: 30,
      total_tour_pickers: 200,
      tour_points: 40,
      rank_change: "down 4",
      shows_played: 6,
      next_show_date: "2026-07-24",
      next_show_venue: "MSG",
    },
  },
];

const resendKey = process.env.RESEND_API_KEY;
if (!resendKey || !resendKey.startsWith("re_")) {
  console.error("✗ RESEND_API_KEY missing or invalid in .env");
  process.exit(1);
}

const { Resend } = require(resolve(root, "functions/node_modules/resend"));
const resend = new Resend(resendKey);

const outDir = resolve(root, "emails/preview");
mkdirSync(outDir, { recursive: true });

console.log(
  `→ Sending ${BRANCHES.length} show-recap narrative previews to ${sendTo}\n`,
);

let sent = 0;
for (const branch of BRANCHES) {
  // eslint-disable-next-line no-await-in-loop
  const rendered = await renderCommsTemplate(
    "tour-rankings-daily",
    branch.payload,
  );
  const shell = buildProductionBrandedEmailShell({
    siteUrl,
    bodyText: rendered.email.text,
    ctaUrl: buildEmailTrackedCtaUrl(
      rendered.email.ctaUrl || `${siteUrl}/dashboard/picks`,
      {
        triggerId: "tour_rankings_daily",
        templateId: "tour-rankings-daily",
        cta: rendered.email.ctaLabel || "Make picks for next show",
      },
    ),
    settingsUrl,
    ctaLabel: rendered.email.ctaLabel,
    signOff: rendered.email.signOff,
    inviteBlockHtml: rendered.email.inviteBlockHtml,
    header: rendered.email.header,
  });

  const subject = `[Show recap ${branch.name}] ${rendered.email.subject}`;
  const slug = branch.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  writeFileSync(resolve(outDir, `show-recap-${slug}.html`), shell.html, "utf8");

  // eslint-disable-next-line no-await-in-loop
  const result = await resend.emails.send({
    from: "Setlist Pick'em <updates@setlistpickem.com>",
    to: [sendTo],
    subject,
    html: shell.html,
    text: rendered.email.text,
  });

  if (result.error) {
    console.error(
      `✗ ${branch.name}: ${result.error.message || JSON.stringify(result.error)}`,
    );
    process.exit(1);
  }

  console.log(`✓ ${branch.name}`);
  console.log(`  subject: ${subject}`);
  console.log(`  id: ${result.data?.id || "(ok)"}\n`);
  sent += 1;
}

console.log(`Done. ${sent} emails → ${sendTo}`);
console.log('Subjects prefixed with "[Show recap …]" for scanning.');
