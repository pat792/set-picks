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
      assert.ok(out.email.text.includes("Setlist Pick'em"), `${spec.templateId} email footer`);
    }
    assert.ok(hasTemplate(spec.templateId), `${spec.templateId} hasTemplate`);
  }
});

test("inApp payload passes variables through unchanged", async () => {
  const payload = { handle: "Bob", show_score: 70 };
  const out = await renderCommsTemplate("show-recap", payload);
  assert.deepEqual(out.inApp.payload, payload);
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
    tour_rank: 3,
    total_tour_pickers: 50,
    tour_points: 210,
    rank_change: "up 2",
    next_show_date: "2026-07-19",
    next_show_venue: "Sphere",
  });
  // Night-of recap content is present even though show_recap no longer emails.
  assert.match(out.email.text, /70/, "show score");
  assert.match(out.email.text, /#4/, "global rank");
  // Tour-standings content (this trigger's original purpose) still present.
  assert.match(out.email.text, /#3/, "tour rank");
  assert.match(out.email.text, /210/, "tour points");
  assert.match(out.email.text, /up 2/, "rank change");
  assert.match(out.email.text, /2026-07-19/, "next show date");
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
