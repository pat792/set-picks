import { describe, expect, it } from 'vitest';

import {
  isInstalled,
  isIosSafariBrowser,
  isStandaloneDisplayMode,
  isStandaloneNavigator,
} from './installPromptPlatform';

describe('installPromptPlatform', () => {
  it('detects standalone display mode', () => {
    const win = {
      matchMedia: (query) => ({ matches: query === '(display-mode: standalone)' }),
    };

    expect(isStandaloneDisplayMode(win)).toBe(true);
  });

  it('returns false when matchMedia is unavailable', () => {
    expect(isStandaloneDisplayMode({})).toBe(false);
  });

  it('detects iOS Safari user agents only', () => {
    const iosSafari = {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    };
    const iosChrome = {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/132.0.0.0 Mobile/15E148 Safari/604.1',
    };

    expect(isIosSafariBrowser(iosSafari)).toBe(true);
    expect(isIosSafariBrowser(iosChrome)).toBe(false);
  });

  it('combines display and navigator standalone detection', () => {
    const win = { matchMedia: () => ({ matches: false }) };
    const nav = { standalone: true };

    expect(isStandaloneNavigator(nav)).toBe(true);
    expect(isInstalled(win, nav)).toBe(true);
  });
});
