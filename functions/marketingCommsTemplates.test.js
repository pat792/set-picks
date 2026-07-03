"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { buildSummerTour2026LaunchChannels } = require("./marketingCommsTemplates");

test("buildSummerTour2026LaunchChannels returns html, text, and subject", async () => {
  const out = await buildSummerTour2026LaunchChannels({
    greetingName: "Rivertranced",
    audienceSegment: "sphere_alum",
    openerLabel: "Tuesday, July 7",
    siteUrl: "https://www.setlistpickem.com",
    settingsUrl: "https://www.setlistpickem.com/dashboard/profile/notifications",
    shareUrl: "https://www.setlistpickem.com/join/ABC12?utm_content=share_friends",
    inviteCode: "ABC12",
  });

  assert.match(out.email.subject, /bring your crew/i);
  assert.match(out.email.html, /Rivertranced/);
  assert.match(out.email.html, /Share with your friends/);
  assert.match(out.email.html, /Rivertranced/);
  assert.match(out.email.html, /\/join\/ABC12/);
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
