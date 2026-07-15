import { describe, expect, it } from 'vitest';

import { buildPhishNetSetlistUrl } from './buildPhishNetSetlistUrl';

describe('buildPhishNetSetlistUrl', () => {
  it('builds a dated setlists URL', () => {
    expect(buildPhishNetSetlistUrl('2025-12-31')).toBe(
      'https://phish.net/setlists/?d=2025-12-31',
    );
  });

  it('falls back to phish.net home for invalid dates', () => {
    expect(buildPhishNetSetlistUrl('')).toBe('https://phish.net');
    expect(buildPhishNetSetlistUrl('not-a-date')).toBe('https://phish.net');
    expect(buildPhishNetSetlistUrl(null)).toBe('https://phish.net');
  });
});
