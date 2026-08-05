import { describe, expect, it } from 'vitest';

import { shouldPreferGoogleRedirectAuth } from './preferGoogleRedirectAuth.js';

const IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IOS_CRIOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1';
const DESKTOP_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const DESKTOP_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DESKTOP_FIREFOX =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const ANDROID_WEBVIEW =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A; wv) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36';
const IPAD_DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

describe('shouldPreferGoogleRedirectAuth', () => {
  it('prefers redirect on iOS Safari and iOS Chrome (WebKit)', () => {
    expect(shouldPreferGoogleRedirectAuth({ userAgent: IOS_SAFARI })).toBe(
      true,
    );
    expect(shouldPreferGoogleRedirectAuth({ userAgent: IOS_CRIOS })).toBe(true);
  });

  it('prefers redirect on desktop Safari and iPadOS desktop-class UA', () => {
    expect(shouldPreferGoogleRedirectAuth({ userAgent: DESKTOP_SAFARI })).toBe(
      true,
    );
    expect(
      shouldPreferGoogleRedirectAuth({
        userAgent: IPAD_DESKTOP_UA,
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it('prefers redirect in in-app / WebView shells', () => {
    expect(
      shouldPreferGoogleRedirectAuth({ userAgent: ANDROID_WEBVIEW }),
    ).toBe(true);
  });

  it('keeps popup on desktop Chromium/Firefox and Android Chrome', () => {
    expect(shouldPreferGoogleRedirectAuth({ userAgent: DESKTOP_CHROME })).toBe(
      false,
    );
    expect(shouldPreferGoogleRedirectAuth({ userAgent: DESKTOP_FIREFOX })).toBe(
      false,
    );
    expect(shouldPreferGoogleRedirectAuth({ userAgent: ANDROID_CHROME })).toBe(
      false,
    );
  });
});
