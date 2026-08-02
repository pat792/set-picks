import { describe, expect, it } from 'vitest';

import {
  appPathFromPushTargetUrl,
  sanitizePushNavigationPath,
} from './pushNavigationPath.js';

describe('sanitizePushNavigationPath', () => {
  it('accepts app-relative paths', () => {
    expect(sanitizePushNavigationPath('/dashboard/picks')).toBe(
      '/dashboard/picks',
    );
    expect(sanitizePushNavigationPath('/dashboard/standings?showDate=2026-08-01')).toBe(
      '/dashboard/standings?showDate=2026-08-01',
    );
  });

  it('rejects open redirects and non-paths', () => {
    expect(sanitizePushNavigationPath('https://evil.example/')).toBe(null);
    expect(sanitizePushNavigationPath('//evil.example')).toBe(null);
    expect(sanitizePushNavigationPath('dashboard/picks')).toBe(null);
    expect(sanitizePushNavigationPath('')).toBe(null);
  });
});

describe('appPathFromPushTargetUrl', () => {
  const origin = 'https://www.setlistpickem.com';

  it('keeps same-origin absolute URLs as paths', () => {
    expect(
      appPathFromPushTargetUrl(
        'https://www.setlistpickem.com/dashboard/picks?x=1',
        origin,
      ),
    ).toBe('/dashboard/picks?x=1');
  });

  it('rejects cross-origin targets', () => {
    expect(
      appPathFromPushTargetUrl('https://evil.example/dashboard', origin),
    ).toBe(null);
  });
});
