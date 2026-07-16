"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { renderCommsTemplate, hasTemplate } = require("./commsTemplates");
const { TRIGGER_SPECS } = require("./commsCatalog");

test("every catalog template renders push + email + inApp payloads", async () => {
  for (const spec of Object.values(TRIGGER_SPECS)) {
    const payload =
      spec.templateId === "summer-tour-2026-launch"
        ? {
            greetingName: "RiverTranced",
            audienceSegment: "sphere_alum",
            siteUrl: "https://www.setlistpickem.com",
            settingsUrl: "https://www.setlistpickem.com/dashboard/profile/notifications",
          }
        : { handle: "RiverTranced" };
    const out = await renderCommsTemplate(spec.templateId, payload);
    assert.equal(out.inApp.templateId, spec.templateId, `${spec.templateId} inApp`);
    assert.ok(out.push.title, `${spec.templateId} push.title`);
    assert.ok(out.push.body, `${spec.templateId} push.body`);
    assert.ok(out.email.subject, `${spec.templateId} email.subject`);
    if (spec.templateId === "summer-tour-2026-launch") {
      assert.ok(out.email.html, `${spec.templateId} email.html`);
      assert.match(out.email.text, /RiverTranced|Rivertranced/i, `${spec.templateId} personalized text`);
    } else {
      assert.ok(out.email.text.includes("Open the app:"), `${spec.templateId} plain-text app link`);
      assert.ok(out.email.signOff, `${spec.templateId} email signOff`);
    }
    assert.ok(hasTemplate(spec.templateId), `${spec.templateId} hasTemplate`);
  }
});

test("inApp payload passes variables through unchanged", async () => {
  const payload = { handle: "Bob", show_score: 70 };
  const out = await renderCommsTemplate("show-recap", payload);
  assert.deepEqual(out.inApp.payload, payload);
});

test("picks-lock-reminder email CTA includes showDate when YYYY-MM-DD (#535)", async () => {
  const out = await renderCommsTemplate("picks-lock-reminder", {
    handle: "HotDogBilly",
    show_date: "2026-07-18",
    venue_name: "MSG",
    time_to_lock: "3 hours",
  });
  assert.match(out.email.ctaUrl, /\/dashboard\/picks\?showDate=2026-07-18/);
});

test("picks-lock-reminder email CTA omits showDate for display labels", async () => {
  const out = await renderCommsTemplate("picks-lock-reminder", {
    handle: "HotDogBilly",
    show_date: "Tonight",
    venue_name: "MSG",
  });
  assert.equal(out.email.ctaUrl, "https://www.setlistpickem.com/dashboard/picks");
});

test("unknown template falls back to a generic payload", async () => {
  const out = await renderCommsTemplate("does-not-exist", {});
  assert.ok(out.push.title);
  assert.ok(out.email.subject);
  assert.equal(hasTemplate("does-not-exist"), false);
});

test("show-recap push surfaces score + rank when present", async () => {
  const out = await renderCommsTemplate("show-recap", { show_score: 70, global_rank: 4 });
  assert.match(out.push.body, /70/);
  assert.match(out.push.body, /#4/);
});

test("tour-rankings-daily email folds in show_recap's night-of content (#451)", async () => {
  const out = await renderCommsTemplate("tour-rankings-daily", {
    handle: "RiverTranced",
    venue_name: "Sphere",
    venue_city: "Las Vegas",
    show_score: 70,
    global_rank: 4,
    global_total_pickers: 200,
    correct_picks_count: 3,
    total_picks_count: 6,
    tour_rank: 3,
    total_tour_pickers: 50,
    tour_points: 210,
    rank_change: "up 2",
    next_show_date: "2026-07-19",
    next_show_venue: "Sphere",
    invite_kind: "pool",
    invite_url:
      "https://www.setlistpickem.com/join/ABC12?from=RiverTranced&utm_source=email&utm_campaign=tour_rankings_daily&utm_content=invite_share",
    invite_headline: "RiverTranced invited you to join their pool: Denver Crew",
  });
  // Night-of recap content is present even though show_recap no longer emails.
  assert.match(out.email.text, /70/, "show score");
  assert.match(out.email.text, /#4/, "global rank");
  // Tour-standings content (this trigger's original purpose) still present.
  assert.match(out.email.text, /#3/, "tour rank");
  assert.match(out.email.text, /210/, "tour points");
  assert.match(out.email.text, /climbed 2 spots/, "rank change rendered as climbed");
  assert.match(out.email.text, /2026-07-19/, "next show date");
  assert.match(out.push.body, /up 2/, "push keeps catalog rank_change token");
  assert.match(out.email.text, /Want to invite friends to join the community/);
  assert.match(out.email.text, /forward this email to a friend/i);
  assert.match(out.email.text, /Open Standings:/);
  assert.match(out.email.text, /\/dashboard\/standings/);
  // Prose night + tour paragraphs (words around variables).
  assert.match(
    out.email.text,
    /You scored 70 points and were ranked #4 of 200 globally, with 3 of 6 picks hitting/,
  );
  assert.match(out.email.text, /Still in the top 5 — ranked #3 of 50 with 210 points/);
  assert.equal(out.email.header?.eyebrow, "Tour standings");
  assert.equal(out.email.header?.title, "Where you stand on tour");
  assert.match(out.email.header?.icon || "", /📈/);
  // Handle greets once in night para — not repeated in tour para.
  assert.match(out.email.text, /RiverTranced, here's how last night/);
  assert.doesNotMatch(
    out.email.text,
    /RiverTranced, after/,
    "tour paragraph should not re-greet with handle",
  );
  assert.ok(out.email.inviteBlockHtml, "invite HTML block");
  assert.match(out.email.inviteBlockHtml, /Want to invite friends to join the community/);
  assert.match(out.email.inviteBlockHtml, /tap &quot;invite friends&quot;/);
  assert.match(out.email.inviteBlockHtml, /forward this email to a friend/i);
  assert.match(out.email.inviteBlockHtml, /Open Standings to share/);
  assert.match(out.email.inviteBlockHtml, /#2563eb/, "secondary standings link color");
  assert.doesNotMatch(out.email.inviteBlockHtml, /mailto:/);
  // Soft text link — not a solid button to a bare invite URL.
  assert.doesNotMatch(out.email.inviteBlockHtml, />https?:\/\//);
  // Recap body (before Open the app) must not include the standings share nudge URL.
  assert.doesNotMatch(
    out.email.text.split("Open the app:")[0],
    /utm_content=share_nudge/,
  );
});

test("tour-countdown email uses picks CTA and avoids duplicate city in venue line", async () => {
  const out = await renderCommsTemplate("tour-countdown", {
    handle: "ArmenianMan",
    tour_name: "2026 Summer Tour",
    days_remaining: 1,
    first_show_date: "2026-07-07",
    first_show_venue: "Kohl Center, Madison, WI",
    first_show_city: "Madison, WI",
    lock_time_local: "7:55 PM",
  });
  assert.equal(out.email.ctaLabel, "Make Your Picks");
  assert.equal(out.email.ctaUrl, "https://www.setlistpickem.com/dashboard/picks");
  assert.equal(out.email.signOff, "See you on tour!");
  assert.match(out.email.text, /First show: 2026-07-07 — Kohl Center, Madison, WI\./);
  assert.doesNotMatch(out.email.text, /Madison, WI, Madison, WI/);
  assert.doesNotMatch(out.email.text, /Manage which updates/i);
});

test("tour-rankings-daily email degrades gracefully with only tour fields (no recap data)", async () => {
  const out = await renderCommsTemplate("tour-rankings-daily", {
    handle: "RiverTranced",
    tour_rank: 3,
    tour_points: 210,
  });
  assert.ok(out.email.subject);
  assert.match(out.email.text, /#3/);
  assert.doesNotMatch(out.email.text, /Show score/);
});
