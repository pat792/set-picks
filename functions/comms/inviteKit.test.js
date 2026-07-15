'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildSiteInviteUrl,
  buildPoolInviteUrl,
  resolveEmailInviteShare,
} = require('./inviteKit.cjs');

test('buildSiteInviteUrl matches SPA invite kit shape', () => {
  assert.equal(
    buildSiteInviteUrl('Mikey'),
    'https://www.setlistpickem.com/invite/Mikey'
  );
});

test('buildPoolInviteUrl includes from handle before UTMs', () => {
  assert.equal(
    buildPoolInviteUrl('YEM42', 'Mikey'),
    'https://www.setlistpickem.com/join/YEM42?from=Mikey'
  );
});

test('resolveEmailInviteShare prefers pool invite when code present', () => {
  const out = resolveEmailInviteShare({
    inviterHandle: 'RiverTranced',
    inviteCode: 'ABC12',
    poolName: 'Denver Crew',
    campaign: 'tour_rankings_daily',
  });
  assert.equal(out?.invite_kind, 'pool');
  assert.match(out?.invite_url, /\/join\/ABC12\?from=RiverTranced/);
  assert.match(out?.invite_url, /utm_source=email/);
  assert.match(out?.invite_url, /utm_campaign=tour_rankings_daily/);
  assert.match(out?.invite_url, /utm_content=invite_share/);
  assert.match(out?.invite_headline, /RiverTranced invited you to join their pool: Denver Crew/);
});

test('resolveEmailInviteShare falls back to site invite without pool code', () => {
  const out = resolveEmailInviteShare({
    inviterHandle: 'RiverTranced',
    campaign: 'tour_rankings_daily',
  });
  assert.equal(out?.invite_kind, 'site');
  assert.match(out?.invite_url, /\/invite\/RiverTranced/);
});
