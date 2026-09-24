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
    settingsUrl: "https://www.setlistpickem.com/dashboard/profile/account",
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

const { buildSummer2026AlmostEndChannels } = require("./marketingCommsTemplates");

test("buildSummer2026AlmostEndChannels returns html, subject, and inApp", async () => {
  const out = await buildSummer2026AlmostEndChannels({
    greetingName: "YarmouthMeg",
    personalTape: "You're #6 of 28 with 230 points across 17 shows.",
    showInvite: true,
    fieldPickingAvg: ".231",
    fieldPlayerCount: 28,
    top5: [
      {
        rank: 1,
        handle: "I have the book",
        points: 385,
        wins: 5,
        nights: 18,
        battingAvg: ".296",
      },
    ],
    standingsUrl: "https://www.setlistpickem.com/dashboard/standings",
    siteUrl: "https://www.setlistpickem.com",
  });

  assert.match(out.email.subject, /almost Tour End Recap/i);
  assert.match(out.email.html, /YarmouthMeg/);
  assert.match(out.email.html, /Melt the Guns/);
  assert.match(out.email.html, /Bustout Boost/);
  assert.match(out.email.html, /I have the book/);
  assert.match(out.email.html, /Invite a friend from Standings/);
  assert.equal(out.inApp.templateId, "summer-2026-almost-end");
  assert.ok(out.email.html.includes("<!DOCTYPE html") || out.email.html.includes("<html"));
});
