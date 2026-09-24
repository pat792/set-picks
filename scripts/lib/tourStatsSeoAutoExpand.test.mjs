import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  TOUR_STATS_SEO_MIN_SHOWS_WITH_SETLIST,
  TOUR_STATS_SEO_MIN_UNIQUE_SONGS,
  appendLlmsTourStatsLinks,
  appendSitemapTourStatsUrls,
  buildAutoTourStatsPrerenderRoute,
  isTourStatsSeoAutoExpandEnabled,
  lastShowDateIsInYear,
  parseSlugCsv,
  resolveAutoExpandTourStatsRoutes,
  tourMeetsSeoExpandGate,
  tourStatsDiscoveryFromRoutes,
} from './tourStatsSeoAutoExpand.mjs';

describe('tourStatsSeoAutoExpand (#959)', () => {
  const now = new Date('2026-09-03T12:00:00Z');

  it('documents the thin-page constants in the 3–5 / unique-song band', () => {
    assert.equal(TOUR_STATS_SEO_MIN_SHOWS_WITH_SETLIST, 4);
    assert.ok(TOUR_STATS_SEO_MIN_UNIQUE_SONGS >= 15);
  });

  it('kill-switch treats 0 / false / off as disabled (default on)', () => {
    assert.equal(isTourStatsSeoAutoExpandEnabled({}), true);
    assert.equal(isTourStatsSeoAutoExpandEnabled({ TOUR_STATS_SEO_AUTO_EXPAND: '1' }), true);
    assert.equal(isTourStatsSeoAutoExpandEnabled({ TOUR_STATS_SEO_AUTO_EXPAND: '0' }), false);
    assert.equal(isTourStatsSeoAutoExpandEnabled({ TOUR_STATS_SEO_AUTO_EXPAND: 'false' }), false);
    assert.equal(isTourStatsSeoAutoExpandEnabled({ TOUR_STATS_SEO_AUTO_EXPAND: 'off' }), false);
  });

  it('rejects first empty night and other thin pages', () => {
    assert.equal(
      tourMeetsSeoExpandGate(
        { showsWithSetlist: 0, uniqueSongs: 0, lastShowDate: '2026-09-01' },
        { now },
      ).reason,
      'thin-shows',
    );
    assert.equal(
      tourMeetsSeoExpandGate(
        { showsWithSetlist: 1, uniqueSongs: 12, lastShowDate: '2026-09-01' },
        { now },
      ).reason,
      'thin-shows',
    );
    assert.equal(
      tourMeetsSeoExpandGate(
        { showsWithSetlist: 4, uniqueSongs: 8, lastShowDate: '2026-09-01' },
        { now },
      ).reason,
      'thin-songs',
    );
    assert.equal(
      tourMeetsSeoExpandGate(
        { showsWithSetlist: 8, uniqueSongs: 80, lastShowDate: '2025-12-31' },
        { now },
      ).reason,
      'not-current-year',
    );
  });

  it('passes a current-year tour that clears both floors', () => {
    const gate = tourMeetsSeoExpandGate(
      {
        showsWithSetlist: 5,
        uniqueSongs: 44,
        lastShowDate: '2026-10-15',
      },
      { now },
    );
    assert.equal(gate.ok, true);
    assert.equal(lastShowDateIsInYear('2026-10-15', 2026), true);
    assert.equal(lastShowDateIsInYear('2025-12-31', 2026), false);
  });

  it('builds title / H1 / description from tourLabel', () => {
    const route = buildAutoTourStatsPrerenderRoute({
      slug: '2026-fall-tour',
      tourLabel: '2026 Fall Tour',
    });
    assert.equal(route.path, '/tour-stats/2026-fall-tour');
    assert.equal(route.tourStatsSeoSlug, '2026-fall-tour');
    assert.match(route.title, /2026 Fall Tour/);
    assert.match(route.h1, /2026 Fall Tour/);
    assert.match(route.description, /2026 Fall Tour/);
    assert.equal(route.autoExpanded, true);
    const jsonLd = route.buildJsonLd();
    assert.equal(jsonLd['@graph'][0].url, route.canonicalUrl);
    assert.equal(jsonLd['@graph'][1].itemListElement[2].name, '2026 Fall Tour');
  });

  it('selects only gated slugs from an offline _index mock', async () => {
    const indexDoc = {
      tours: [
        {
          tourSlug: '2026-fall-tour',
          tourLabel: '2026 Fall Tour',
          lastShowDate: '2026-10-15',
        },
        {
          tourSlug: 'thin-tour',
          tourLabel: 'Thin Tour',
          lastShowDate: '2026-09-01',
        },
        {
          tourSlug: '2025-new-year-run',
          tourLabel: '2025 NYE',
          lastShowDate: '2026-01-01',
        },
        {
          tourSlug: '2026-summer-tour',
          tourLabel: '2026 Summer Tour',
          lastShowDate: '2026-07-20',
        },
      ],
    };
    const docs = {
      '2026-fall-tour': {
        tourLabel: '2026 Fall Tour',
        showsWithSetlist: 6,
        uniqueSongs: 72,
        lastShowDate: '2026-10-15',
      },
      'thin-tour': {
        tourLabel: 'Thin Tour',
        showsWithSetlist: 1,
        uniqueSongs: 9,
        lastShowDate: '2026-09-01',
      },
      '2025-new-year-run': {
        tourLabel: '2025 NYE',
        showsWithSetlist: 20,
        uniqueSongs: 90,
        lastShowDate: '2025-12-31',
      },
      '2026-summer-tour': {
        tourLabel: '2026 Summer Tour',
        showsWithSetlist: 18,
        uniqueSongs: 188,
        lastShowDate: '2026-07-20',
      },
    };

    const routes = await resolveAutoExpandTourStatsRoutes({
      indexDoc,
      loadDoc: async (slug) => docs[slug] || null,
      existingSlugs: ['2026-summer-tour', '2026-sphere'],
      now,
      env: {},
    });
    assert.deepEqual(
      routes.map((r) => r.tourStatsSeoSlug),
      ['2026-fall-tour'],
    );
  });

  it('honors kill-switch, allowlist, and denylist', async () => {
    const indexDoc = {
      tours: [
        {
          tourSlug: '2026-fall-tour',
          tourLabel: '2026 Fall Tour',
          lastShowDate: '2026-10-15',
        },
      ],
    };
    const loadDoc = async () => ({
      tourLabel: '2026 Fall Tour',
      showsWithSetlist: 6,
      uniqueSongs: 72,
      lastShowDate: '2026-10-15',
    });

    const off = await resolveAutoExpandTourStatsRoutes({
      indexDoc,
      loadDoc,
      now,
      env: { TOUR_STATS_SEO_AUTO_EXPAND: '0' },
    });
    assert.equal(off.length, 0);

    const denied = await resolveAutoExpandTourStatsRoutes({
      indexDoc,
      loadDoc,
      now,
      env: { TOUR_STATS_SEO_DENYLIST: '2026-fall-tour' },
    });
    assert.equal(denied.length, 0);

    const notOnAllow = await resolveAutoExpandTourStatsRoutes({
      indexDoc,
      loadDoc,
      now,
      env: { TOUR_STATS_SEO_ALLOWLIST: 'other-slug' },
    });
    assert.equal(notOnAllow.length, 0);

    const allowed = await resolveAutoExpandTourStatsRoutes({
      indexDoc,
      loadDoc,
      now,
      env: { TOUR_STATS_SEO_ALLOWLIST: '2026-fall-tour' },
    });
    assert.equal(allowed[0]?.tourStatsSeoSlug, '2026-fall-tour');
  });

  it('merges sitemap + llms without duplicating existing URLs', () => {
    const route = buildAutoTourStatsPrerenderRoute({
      slug: '2026-fall-tour',
      tourLabel: '2026 Fall Tour',
    });
    const { locs, llms } = tourStatsDiscoveryFromRoutes([route]);
    const sitemap = appendSitemapTourStatsUrls(
      `<?xml version="1.0"?>
<urlset>
  <url><loc>https://www.setlistpickem.com/tour-stats/2026-summer-tour</loc></url>
</urlset>
`,
      locs,
    );
    assert.match(sitemap, /2026-fall-tour/);
    assert.equal(
      [...sitemap.matchAll(/2026-fall-tour/g)].length,
      1,
    );

    const llmsTxt = appendLlmsTourStatsLinks(
      `## Links
- 2026 Summer Tour setlist statistics: https://www.setlistpickem.com/tour-stats/2026-summer-tour
- About: https://www.setlistpickem.com/about
`,
      llms,
    );
    assert.match(llmsTxt, /2026 Fall Tour setlist statistics: https:\/\/www\.setlistpickem\.com\/tour-stats\/2026-fall-tour/);
    assert.ok(
      llmsTxt.indexOf('2026-fall-tour') < llmsTxt.indexOf('About:'),
      'auto link should sit with other tour-stats links',
    );
  });

  it('parseSlugCsv ignores blanks and _index', () => {
    assert.deepEqual(
      [...parseSlugCsv(' 2026-fall-tour, _index, ,2026-sphere ')],
      ['2026-fall-tour', '2026-sphere'],
    );
  });
});
