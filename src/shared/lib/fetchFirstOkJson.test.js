import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchFirstOkJson } from './fetchFirstOkJson';

describe('fetchFirstOkJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the first successful JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ ok: true }),
      })),
    );
    await expect(fetchFirstOkJson(['https://example.test/a.json'])).resolves.toEqual({
      ok: true,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries the next URL after a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (String(url).includes('primary')) {
          return { ok: false, status: 402, json: async () => ({}) };
        }
        return { ok: true, json: async () => ({ source: 'fallback' }) };
      }),
    );
    await expect(
      fetchFirstOkJson([
        'https://example.test/primary.json',
        'https://example.test/fallback.json',
      ]),
    ).resolves.toEqual({ source: 'fallback' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('skips blanks and throws the last error when every URL fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 403, json: async () => ({}) })),
    );
    await expect(fetchFirstOkJson(['', 'https://example.test/a.json'])).rejects.toThrow(
      'HTTP 403',
    );
  });
});
