import { describe, expect, it } from 'vitest';

import {
  getInstallLeadCopy,
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
});
