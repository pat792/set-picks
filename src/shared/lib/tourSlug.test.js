import { describe, expect, it } from 'vitest';

import { tourLabelToSlug } from './tourSlug';

describe('tourLabelToSlug', () => {
  it('kebab-cases live calendar labels', () => {
    expect(tourLabelToSlug('2026 Sphere')).toBe('2026-sphere');
    expect(tourLabelToSlug('2026 Summer Tour')).toBe('2026-summer-tour');
  });

  it('normalizes punctuation and accents', () => {
    expect(tourLabelToSlug("Summer Tour '26")).toBe('summer-tour-26');
    expect(tourLabelToSlug('  Fall Tour 2026  ')).toBe('fall-tour-2026');
  });
});
