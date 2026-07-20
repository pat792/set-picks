import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PUBLIC_TOUR_LABEL_CANDIDATES,
  DEFAULT_PUBLIC_TOUR_SLUG,
  tourLabelToSlug,
} from './tourSlug';

describe('tourLabelToSlug', () => {
  it('kebab-cases Sphere Run 2026 to the default public slug', () => {
    expect(tourLabelToSlug('Sphere Run 2026')).toBe(DEFAULT_PUBLIC_TOUR_SLUG);
    expect(DEFAULT_PUBLIC_TOUR_SLUG).toBe('sphere-run-2026');
  });

  it('normalizes punctuation and accents', () => {
    expect(tourLabelToSlug("Summer Tour '26")).toBe('summer-tour-26');
    expect(tourLabelToSlug('  Fall Tour 2026  ')).toBe('fall-tour-2026');
  });

  it('maps preferred Sphere label candidates to the same slug family', () => {
    for (const label of DEFAULT_PUBLIC_TOUR_LABEL_CANDIDATES) {
      expect(tourLabelToSlug(label).startsWith('sphere')).toBe(true);
    }
    expect(tourLabelToSlug('Sphere Run 2026')).toBe('sphere-run-2026');
  });
});
