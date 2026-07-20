import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PUBLIC_TOUR_LABEL_CANDIDATES,
  DEFAULT_PUBLIC_TOUR_SLUG,
  tourLabelToSlug,
} from './tourSlug';

describe('tourLabelToSlug', () => {
  it('kebab-cases live Sphere calendar label to the default public slug', () => {
    expect(tourLabelToSlug('2026 Sphere')).toBe(DEFAULT_PUBLIC_TOUR_SLUG);
    expect(DEFAULT_PUBLIC_TOUR_SLUG).toBe('2026-sphere');
  });

  it('normalizes punctuation and accents', () => {
    expect(tourLabelToSlug("Summer Tour '26")).toBe('summer-tour-26');
    expect(tourLabelToSlug('  Fall Tour 2026  ')).toBe('fall-tour-2026');
  });

  it('maps preferred Sphere label candidates to a sphere* slug', () => {
    for (const label of DEFAULT_PUBLIC_TOUR_LABEL_CANDIDATES) {
      expect(tourLabelToSlug(label)).toMatch(/sphere/);
    }
    expect(tourLabelToSlug('2026 Sphere')).toBe('2026-sphere');
  });
});
