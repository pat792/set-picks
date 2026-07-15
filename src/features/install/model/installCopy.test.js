import { describe, expect, it } from 'vitest';

import {
  getInstallLeadCopy,
  IOS_CHROME_INSTALL_STEPS,
  IOS_SAFARI_INSTALL_STEPS,
  isAndroidLike,
  resolveInstallCopyBranch,
} from './installCopy';

describe('installCopy (#539)', () => {
  it('detects Android UA', () => {
    expect(isAndroidLike({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120' })).toBe(true);
    expect(isAndroidLike({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' })).toBe(false);
  });

  it('resolves telemetry branches', () => {
    expect(
      resolveInstallCopyBranch({
        canPrompt: true,
        nav: { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120' },
      }),
    ).toBe('android_chrome');
    expect(
      resolveInstallCopyBranch({
        canPrompt: true,
        nav: { userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120' },
      }),
    ).toBe('desktop_chromium');
    expect(resolveInstallCopyBranch({ shouldShowIosFlow: true })).toBe('ios_safari');
    expect(resolveInstallCopyBranch({ shouldShowIosNonSafariFlow: true })).toBe('ios_non_safari');
  });

  it('android lead copy references Chrome install, not Safari Share', () => {
    const copy = getInstallLeadCopy('android_chrome');
    expect(copy.body.toLowerCase()).toContain('chrome');
    expect(copy.body.toLowerCase()).not.toContain('share');
  });

  it('Safari steps reference Share toolbar, not three-dot menu', () => {
    const joined = IOS_SAFARI_INSTALL_STEPS.flatMap((s) => s.parts.map((p) => p.text)).join('');
    expect(joined.toLowerCase()).toContain('share');
    expect(joined.toLowerCase()).toContain('toolbar');
    expect(joined.toLowerCase()).not.toContain('three-dot');
    expect(joined).not.toContain('...');
  });

  it('iOS Chrome copy teaches A2HS in Chrome (does not claim install is impossible)', () => {
    const copy = getInstallLeadCopy('ios_non_safari');
    expect(copy.body.toLowerCase()).toContain('chrome');
    expect(copy.body.toLowerCase()).toContain('add to home screen');
    expect(copy.body.toLowerCase()).not.toContain("can't install");
    expect(copy.body.toLowerCase()).not.toContain('cannot install');
    expect(copy.eyebrow.toLowerCase()).not.toContain('open in safari');
  });

  it('iOS Chrome steps use Share → Add to Home Screen', () => {
    const joined = IOS_CHROME_INSTALL_STEPS.flatMap((s) => s.parts.map((p) => p.text)).join('');
    expect(joined.toLowerCase()).toContain('share');
    expect(joined.toLowerCase()).toContain('add to home screen');
  });
});
