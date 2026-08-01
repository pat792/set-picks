import { describe, expect, it } from 'vitest';

import {
  isLikelyInAppBrowser,
  preferredExternalBrowserLabel,
} from './inAppBrowser.js';

describe('isLikelyInAppBrowser', () => {
  it('detects Android WebView and Gmail/GSA shells', () => {
    expect(
      isLikelyInAppBrowser(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A; wv) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
      ),
    ).toBe(true);
    expect(
      isLikelyInAppBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 GSA/300.0 Mobile/15E148',
      ),
    ).toBe(true);
  });

  it('does not flag desktop Chrome or iOS Safari / CriOS', () => {
    expect(
      isLikelyInAppBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ),
    ).toBe(false);
    expect(
      isLikelyInAppBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(false);
    expect(
      isLikelyInAppBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(false);
  });

  it('detects iOS WKWebView without Safari token', () => {
    expect(
      isLikelyInAppBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      ),
    ).toBe(true);
  });
});

describe('preferredExternalBrowserLabel', () => {
  it('returns Safari on iOS and Chrome on Android', () => {
    expect(preferredExternalBrowserLabel('iPhone OS 17_0')).toBe('Safari');
    expect(preferredExternalBrowserLabel('Linux; Android 14')).toBe('Chrome');
  });
});
