import { describe, expect, it } from 'vitest';

import { formatCatalogLastShort } from './formatCatalogLastShort';

describe('formatCatalogLastShort', () => {
  it('formats ISO dates as M/D/YY', () => {
    expect(formatCatalogLastShort('2024-07-19')).toBe('7/19/24');
    expect(formatCatalogLastShort('2026-01-05')).toBe('1/5/26');
  });

  it('maps empty / never to em dash', () => {
    expect(formatCatalogLastShort('')).toBe('—');
    expect(formatCatalogLastShort('—')).toBe('—');
    expect(formatCatalogLastShort('Never')).toBe('—');
    expect(formatCatalogLastShort(null)).toBe('—');
  });
});
