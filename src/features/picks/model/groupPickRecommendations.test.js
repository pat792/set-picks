import { describe, expect, it } from 'vitest';

import {
  groupRecommendationsByRiskBand,
  normalizePickTitle,
  selectedTitleKeys,
} from './groupPickRecommendations.js';

describe('groupPickRecommendations', () => {
  it('normalizePickTitle collapses case and spaces', () => {
    expect(normalizePickTitle('  46  Days ')).toBe('46 days');
  });

  it('selectedTitleKeys excludes other slots only', () => {
    const form = { s1o: 'Alpha', s1c: 'Beta', s2o: '' };
    expect([...selectedTitleKeys(form, 's1c')].sort()).toEqual(['alpha']);
    expect([...selectedTitleKeys(form)].sort()).toEqual(['alpha', 'beta']);
  });

  it('groupRecommendationsByRiskBand filters exclusions and orders bands', () => {
    const rows = [
      { name: 'Alpha', normalizedName: 'alpha', riskBand: 'safe', rank: 2 },
      { name: 'Beta', normalizedName: 'beta', riskBand: 'long_shot', rank: 1 },
      { name: 'Gamma', normalizedName: 'gamma', riskBand: 'slot_fit', rank: 1 },
      { name: 'Alpha Dup', normalizedName: 'alpha', riskBand: 'safe', rank: 1 },
      { name: 'Skip Me', normalizedName: 'skip me', riskBand: 'unbanded', rank: 1 },
    ];
    const groups = groupRecommendationsByRiskBand(
      rows,
      new Set(['alpha']),
    );
    expect(groups.map((g) => g.band)).toEqual([
      'safe',
      'slot_fit',
      'long_shot',
    ]);
    expect(groups[0].items).toEqual([]);
    expect(groups[0].hint).toMatch(/somewhere/i);
    expect(groups[1].items.map((i) => i.name)).toEqual(['Gamma']);
    expect(groups[1].hint).toMatch(/this slot/i);
    expect(groups[2].items.map((i) => i.name)).toEqual(['Beta']);
  });
});
