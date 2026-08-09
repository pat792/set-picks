import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildTourStatsFactsHtml,
  mergeTourStatsFactsJsonLd,
  normalizeTourStatsFacts,
} from './tourStatsSeoFacts.mjs';

describe('tourStatsSeoFacts (#928)', () => {
  const facts = normalizeTourStatsFacts({
    tourLabel: '2026 Summer Tour',
    uniqueSongs: 188,
    showsWithSetlist: 18,
    tourShowCount: 21,
    bustouts: [
      { title: 'Melt the Guns', gap: 142, showDate: '2026-07-15' },
      { title: '', gap: 10 },
    ],
    topSongs: [{ title: 'Character Zero', timesPlayed: 12 }],
  });

  it('normalizes and truncates empty titles', () => {
    assert.equal(facts.bustouts.length, 1);
    assert.equal(facts.bustouts[0].title, 'Melt the Guns');
    assert.equal(facts.uniqueSongs, 188);
  });

  it('builds aggregate-only HTML with markers', () => {
    const html = buildTourStatsFactsHtml(facts);
    assert.match(html, /bustout/i);
    assert.match(html, /Melt the Guns/);
    assert.match(html, /data-seo-tour-stats-facts="bustouts"/);
    assert.match(html, /Character Zero/);
    assert.doesNotMatch(html, /setlist archive of every song/i);
  });

  it('merges FAQPage + ItemList into JSON-LD graph', () => {
    const merged = mergeTourStatsFactsJsonLd(
      {
        '@context': 'https://schema.org',
        '@graph': [{ '@type': 'WebPage', name: 'x' }],
      },
      facts,
      'https://www.setlistpickem.com/tour-stats/2026-summer-tour',
    );
    const types = merged['@graph'].map((n) => n['@type']);
    assert.ok(types.includes('WebPage'));
    assert.ok(types.includes('ItemList'));
    assert.ok(types.includes('FAQPage'));
  });
});
