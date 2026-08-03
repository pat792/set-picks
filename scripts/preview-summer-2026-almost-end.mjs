#!/usr/bin/env node
/**
 * One-off draft preview for Summer 2026 almost-end recap.
 * Renders branded HTML from content/comms/tours/summer-2026-almost-end.md
 * (personalized as rank-1 sample) and optionally sends via Resend.
 *
 * Usage:
 *   node scripts/preview-summer-2026-almost-end.mjs
 *   node scripts/preview-summer-2026-almost-end.mjs --send pat@road2media.com
 */

import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const envPath = resolve(root, '.env');
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const value = m[2].trim().replace(/^"|"$/g, '');
    if (!process.env[key] || (key === 'RESEND_API_KEY' && !String(process.env[key]).startsWith('re_'))) {
      process.env[key] = value;
    }
  }
} catch {
  // optional
}

const args = process.argv.slice(2);
const sendTo =
  (args.includes('--send') ? args[args.indexOf('--send') + 1] : null) || null;

const {
  buildEmailWordmarkHeroHtml,
  EMAIL_BRAND_PRIMARY,
  EMAIL_BRAND_BG_DEEP,
} = require(resolve(root, 'comms/emailBranding.cjs'));
const { buildEmailTrackedCtaUrl } = require(resolve(root, 'comms/emailLinks.cjs'));

const siteUrl = 'https://www.setlistpickem.com';
const settingsUrl = `${siteUrl}/dashboard/profile/notifications`;
const wordmarkHeroHtml = buildEmailWordmarkHeroHtml(siteUrl);
const inviteCtaUrl = buildEmailTrackedCtaUrl(`${siteUrl}/dashboard/standings`, {
  triggerId: 'marketing_summer_2026_almost_end',
  templateId: 'summer-2026-almost-end',
  cta: 'Invite a friend from Standings',
});
const standingsCtaUrl = buildEmailTrackedCtaUrl(`${siteUrl}/dashboard/standings`, {
  triggerId: 'marketing_summer_2026_almost_end',
  templateId: 'summer-2026-almost-end',
  cta: 'Check it out on Standings',
});

const subjectBase =
  "Between the Past and Future, Where We Drift in Time: An almost Tour End Recap";
const preheader =
  "18 shows in the books · Fenway wrapped · Dick's still ahead · your (almost) tour-end tape inside";
/** Unique per send — Gmail threads identical subjects and trims “duplicate” body. */
const previewStamp = new Date().toISOString().replace(/[:.]/g, '-');
const messageNonce = `preview-${previewStamp}-${Math.random().toString(36).slice(2, 8)}`;

/** Final preview: player branch (rank 6+ / ≥12) so invite ask is included */
const previewHandle = 'YarmouthMeg';
const personal =
  "You're #6 of 28 with 230 points across 17 shows (13.5 pts/show, batting .235). Full-tour grinders get paid at Dick's — keep the card sharp.";
const ctaButton = (href, label) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:12px;background:${EMAIL_BRAND_PRIMARY};">
        <a href="${href}" style="display:inline-block;padding:16px 28px;font-size:18px;font-weight:700;color:${EMAIL_BRAND_BG_DEEP};text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;

// Body copy as <p> only — Gmail mobile often clips at <h2>/<h3> and redraws
// the rest as a nested “card” with a … expander (wonky mid-email break).
const p = (html) =>
  `<p style="margin:0 0 18px;font-size:18px;line-height:1.55;color:#1a1a2e;">${html}</p>`;
const sectionTitle = (text) =>
  `<p style="margin:28px 0 12px;font-size:20px;font-weight:800;line-height:1.3;color:#1a1a2e;">${text}</p>`;
const strong = (t) => `<strong>${t}</strong>`;

const tableRows = [
  ['1', 'I have the book', '385', '5', '18', '.296'],
  ['2', 'TheManMulcahy', '320', '4', '18', '.278'],
  ['3', 'ArmenianMan', '285', '2', '18', '.296'],
  ['4', 'Rivertranced', '270', '1', '17', '.353'],
  ['5', 'HotDog Billy', '250', '2', '18', '.269'],
]
  .map(
    ([rank, handle, pts, wins, nights, avg]) => `
      <tr>
        <td style="padding:10px 6px;border-bottom:1px solid #eee;font-size:16px;color:#1a1a2e;">${rank}</td>
        <td style="padding:10px 6px;border-bottom:1px solid #eee;font-size:16px;color:#1a1a2e;font-weight:700;">${handle}</td>
        <td style="padding:10px 6px;border-bottom:1px solid #eee;font-size:16px;color:#1a1a2e;text-align:right;">${pts}</td>
        <td style="padding:10px 6px;border-bottom:1px solid #eee;font-size:16px;color:#1a1a2e;text-align:right;">${wins}</td>
        <td style="padding:10px 6px;border-bottom:1px solid #eee;font-size:16px;color:#1a1a2e;text-align:right;">${nights}</td>
        <td style="padding:10px 6px;border-bottom:1px solid #eee;font-size:16px;color:#1a1a2e;text-align:right;">${avg}</td>
      </tr>`
  )
  .join('');

const leaderboardTable = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:12px 0 16px;">
  <thead>
    <tr>
      <th align="left" style="padding:10px 6px;border-bottom:2px solid #1a1a2e;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;">Rank</th>
      <th align="left" style="padding:10px 6px;border-bottom:2px solid #1a1a2e;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;">Handle</th>
      <th align="right" style="padding:10px 6px;border-bottom:2px solid #1a1a2e;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;">Pts</th>
      <th align="right" style="padding:10px 6px;border-bottom:2px solid #1a1a2e;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;">Wins</th>
      <th align="right" style="padding:10px 6px;border-bottom:2px solid #1a1a2e;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;">Nights</th>
      <th align="right" style="padding:10px 6px;border-bottom:2px solid #1a1a2e;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;">Avg</th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>`;

const bodyInner = [
  p(`Hey ${strong(previewHandle)},`),
  p(
    `Well, that's a wrap. Or is it? The Phab Four earned a well deserved break ahead of the official tour-closing Dick's Run. With so much time on our hands between shows (I'm not crying, you're crying), here's some stats to chew on.`
  ),
  sectionTitle('Tour tape'),
  p(
    `Eighteen nights. ${strong('188')} unique songs. ${strong('310')} total songs played from Madison through Fenway.`
  ),
  p(
    `And then there was New York. The five-night MSG run (July 22–29) wasn't just another Garden residency — it was a full-on ${strong("'90s time machine")}. The band's ${strong('92nd through 96th')} appearances at the Garden, each night a setlist drawn entirely from one year: ${strong("'92 thru '96")}. From my seat (and my scorecard), some of the best Phish of the last decade — bicycle kicks and beach balls back from the dead, deep cuts raining from the rafters, and a picking board that refused to behave.`
  ),
  p(
    `That theme explains half the chaos on the tape. MSG alone coughed up these show gaps: ${strong('Cold as Ice')} (1,468), ${strong('Big Ball Jam')} (1,170), ${strong('The Vibration of Life')} (1,027), ${strong('Suspicious Minds')} (1,021), plus the cover pile — ${strong('Highway to Hell')}, ${strong('Purple Rain')}, ${strong('Johnny B. Goode')}, ${strong('La Grange')} — and a full ${strong('Forbin → Mockingbird → Harpua')} suite. Across those five nights, the field banked ${strong('44')} <span style="color:#ea580c;font-weight:800;">Bustout Boost™</span> hits. Fenway N1 dropped ${strong('Melt the Guns')} after ${strong('2,051')} shows — the longest gap between performances in Phish history. They absolutely nailed this post-punk/new wave relic.`
  ),
  p(
    `Not every story needed a 1,000-show gap. Merriweather brought ${strong('Ass Handed')} back after 138; Savannah lit ${strong('Fire')} (132); and just under the bustout line, songs like ${strong('The Old Home Place')} (28) and ${strong('Izabella')} (25) kept the “almost” lane spicy.`
  ),
  p(
    `The rotation favorites? ${strong('Character Zero')}, ${strong('Free')}, ${strong('Ghost')}, ${strong('Hood')}, ${strong('Possum')}, ${strong('Antelope')}, and ${strong('Sand')} each showed up ${strong('four')} times through Fenway — the 1.0 stalwarts that I know and love.`
  ),
  sectionTitle("Pre Dick's Leaderboard"),
  p(
    `Field picking average across ${strong('28')} players: ${strong('.231')}. The Top 5 all clear it — Rivertranced by the widest margin. It just shows that a few well-placed bustouts can ${strong('Catapult')} a player to the top in a hurry.`
  ),
  leaderboardTable,
  p(
    `Three more nights at Dick's. The Top 5 is bunched enough that one hot run — or a couple of bustouts — can reshuffle the whole podium. And if you're sitting just outside looking in: you're closer than you think. Commerce City is where chasers become contenders.`
  ),
  sectionTitle('Your (almost) tour-end tape'),
  p(personal),
  sectionTitle('One huge favor'),
  p(
    `Before Dick's, can I ask a huge favor? ${strong('Invite at least one friend')} to join and lock picks for the three-night run. Growing the number of players is my measure of success — and you know I love stats.`
  ),
  ctaButton(inviteCtaUrl, 'Invite a friend from Standings'),
  sectionTitle('Building between now and then'),
  p(
    `Between now and Dick's, I'm staying busy building out new features. If you haven't checked these out, they are worth taking a look:`
  ),
  p(
    `${strong('Live setlist')} — Updates as songs land, with bustout badges and last-played / gap insights so you can see how rare each hit really was.`
  ),
  p(
    `${strong('Crowd pulse')} — How the field is picking that night — consensus heat, where your card sits vs the room, and which songs the crowd is riding.`
  ),
  p(
    `${strong('Stats')} — Personal and tour insights (bustouts, gaps, frequency — the same tape above, live in the app).`
  ),
  p(
    `${strong('Profile')} — Milestone badges and avatars so you can personalize how you show up on the board.`
  ),
  p(`Three nights in Commerce City still to go. Rest up, study the gaps, and don't sleep on the wildcard.`),
  p(`See you at Dick's.`),
  `<p style="margin:24px 0 8px;font-size:18px;line-height:1.55;color:#1a1a2e;">— Pat<br />from the Setlist Pick 'Em desk</p>`,
].join('\n');

// Single continuous white table — teal top rule only. No <h2> (Gmail clip trigger).
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>Setlist Pick'em</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;-webkit-text-size-adjust:100%;font-size:18px;line-height:1.55;color:#1a1a2e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-collapse:collapse;">
    <tr>
      <td align="center" style="background-color:#ffffff;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-collapse:collapse;border-top:3px solid ${EMAIL_BRAND_PRIMARY};">
          <tr>
            <td style="padding:20px 20px 8px 20px;text-align:center;background-color:#ffffff;">
              ${wordmarkHeroHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 20px 28px 20px;background-color:#ffffff;font-size:18px;line-height:1.55;color:#1a1a2e;">
              ${bodyInner}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 20px 20px;text-align:center;background-color:#ffffff;">
              <p style="margin:0 0 8px 0;font-size:14px;line-height:1.5;color:#888888;">
                You&apos;re receiving this because you have a Setlist Pick&apos;em account.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.5;color:#888888;">
                <a href="${settingsUrl}" style="color:#0f766e;text-decoration:underline;">Manage preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="${settingsUrl}" style="color:#0f766e;text-decoration:underline;">Unsubscribe</a>
              </p>
              <p style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#ffffff;mso-hide:all;">${messageNonce}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const text = [
  `Hey ${previewHandle},`,
  '',
  "Well, that's a wrap. Or is it? ...",
  '',
  personal,
  '',
  "Before Dick's, can I ask a huge favor? Invite at least one friend...",
  inviteCtaUrl,
  '',
  'Check it out on Standings:',
  standingsCtaUrl,
  '',
  "— Pat\nfrom the Setlist Pick 'Em desk",
].join('\n');

const outDir = resolve(root, 'emails/preview');
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, 'summer-2026-almost-end-preview.html');
writeFileSync(outFile, html, 'utf8');
console.log(`✓ Wrote ${outFile}`);

if (!sendTo && process.platform === 'darwin') {
  execSync(`open "${outFile}"`);
}

if (sendTo) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || !resendKey.startsWith('re_')) {
    console.error('✗ --send requires RESEND_API_KEY in .env');
    process.exit(1);
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: "Setlist Pick'em <updates@setlistpickem.com>",
      to: [sendTo],
      // Unique subject breaks Gmail conversation threading that hides body as trimmed.
      subject: `[LOCAL PREVIEW ${previewStamp}] ${subjectBase}`,
      html,
      text,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('✗ Resend error:', res.status, JSON.stringify(json, null, 2));
    process.exit(1);
  }
  console.log(`✓ Sent preview to ${sendTo} (id: ${json.id || 'unknown'})`);
}
