"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { buildSummerTour2026LaunchChannels } = require("./marketingCommsTemplates");

test("buildSummerTour2026LaunchChannels returns html, text, and subject", async () => {
  const out = await buildSummerTour2026LaunchChannels({
    greetingName: "Rivertranced",
    inviterHandle: "Rivertranced",
    audienceSegment: "sphere_alum",
    openerLabel: "Tuesday, July 7",
    siteUrl: "https://www.setlistpickem.com",
    settingsUrl: "https://www.setlistpickem.com/dashboard/profile/notifications",
    shareUrl:
      "https://www.setlistpickem.com/join/ABC12?from=Rivertranced&utm_source=email&utm_campaign=summer_tour_2026_launch&utm_content=share_friends",
    inviteCode: "ABC12",
    inviteKind: "pool",
    inviteHeadline: "Rivertranced invited you to join their pool",
  });

  assert.match(out.email.subject, /bring your crew/i);
  assert.match(out.email.html, /Rivertranced/);
  assert.match(out.email.html, /Want to invite friends to join the community/);
  assert.match(out.email.html, /forward this email to a friend/i);
  assert.match(out.email.html, /Open Standings to share/);
  assert.match(out.email.html, /\/dashboard\/standings/);
  assert.doesNotMatch(out.email.html, /mailto:/);
  assert.match(out.email.text, /Rivertranced/);
  assert.match(out.email.text, /Pat/);
  assert.ok(out.email.html.includes("<!DOCTYPE html") || out.email.html.includes("<html"));
});

test("post_sphere_signup segment uses welcome copy in html", async () => {
  const out = await buildSummerTour2026LaunchChannels({
    greetingName: "NewPicker",
    audienceSegment: "post_sphere_signup",
  });
  assert.match(out.email.html, /Welcome/i);
  assert.doesNotMatch(out.email.html, /Sphere weekend 1/i);
});
