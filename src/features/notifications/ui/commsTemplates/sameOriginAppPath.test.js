import { describe, expect, it } from 'vitest';

import { sameOriginAppPath } from './sameOriginAppPath.js';

describe('sameOriginAppPath', () => {
  const origin = 'https://www.setlistpickem.com';

  it('returns relative app paths as-is', () => {
    expect(sameOriginAppPath('/dashboard/picks', origin)).toBe('/dashboard/picks');
    expect(sameOriginAppPath('/dashboard/standings#self-recap', origin)).toBe(
      '/dashboard/standings#self-recap',
    );
  });

  it('accepts absolute same-origin URLs', () => {
    expect(
      sameOriginAppPath('https://www.setlistpickem.com/dashboard/picks', origin),
    ).toBe('/dashboard/picks');
  });

  it('rejects external and empty hrefs', () => {
    expect(sameOriginAppPath('https://example.com/x', origin)).toBeNull();
    expect(sameOriginAppPath('//cdn.example/x', origin)).toBeNull();
    expect(sameOriginAppPath('#', origin)).toBeNull();
    expect(sameOriginAppPath('', origin)).toBeNull();
    expect(sameOriginAppPath(undefined, origin)).toBeNull();
  });
});
