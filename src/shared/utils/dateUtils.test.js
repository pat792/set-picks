import { describe, expect, it } from 'vitest';

import { formatFanShowDate } from './dateUtils';

describe('formatFanShowDate', () => {
  it('locks 2026-10-07 → 10/07/26', () => {
    expect(formatFanShowDate('2026-10-07')).toBe('10/07/26');
    expect(formatFanShowDate(' 2026-07-10 ')).toBe('07/10/26');
  });

  it('returns invalid input unchanged', () => {
    expect(formatFanShowDate('nope')).toBe('nope');
    expect(formatFanShowDate('2026-02-31')).toBe('2026-02-31');
    expect(formatFanShowDate('2026-10-7')).toBe('2026-10-7');
    expect(formatFanShowDate('')).toBe('');
    expect(formatFanShowDate(null)).toBe(null);
  });
});
