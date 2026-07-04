import { describe, expect, it } from 'vitest';

import {
  MARKETING_INSTALL_HOWTO_UTM_CONTENT,
  buildMarketingInstallHowToUrl,
  resolveDashboardLegacyRedirect,
} from './dashboardLegacyRedirects.js';

describe('resolveDashboardLegacyRedirect', () => {
  it('redirects legacy notifications path preserving query', () => {
    expect(resolveDashboardLegacyRedirect('/dashboard/notifications', '?openPush=1')).toBe(
      '/dashboard/profile/notifications?openPush=1',
    );
  });

  it('redirects legacy account-security path', () => {
    expect(resolveDashboardLegacyRedirect('/dashboard/account-security')).toBe(
      '/dashboard/profile/account',
    );
  });

  it('redirects marketing install how-to on profile to Picks with install=1', () => {
    const target = resolveDashboardLegacyRedirect(
      '/dashboard/profile',
      '?utm_source=email&utm_campaign=summer_tour_2026_launch&utm_content=install_howto',
    );
    expect(target?.startsWith('/dashboard?')).toBe(true);
    const params = new URLSearchParams(target.split('?')[1]);
    expect(params.get('install')).toBe('1');
    expect(params.get('utm_content')).toBe(MARKETING_INSTALL_HOWTO_UTM_CONTENT);
  });

  it('redirects profile openPush deep links to Messages', () => {
    expect(resolveDashboardLegacyRedirect('/dashboard/profile', '?openPush=1')).toBe(
      '/dashboard/profile/notifications?openPush=1',
    );
  });

  it('returns null for canonical profile path without legacy params', () => {
    expect(resolveDashboardLegacyRedirect('/dashboard/profile')).toBeNull();
    expect(resolveDashboardLegacyRedirect('/dashboard/profile/notifications')).toBeNull();
  });
});

describe('buildMarketingInstallHowToUrl', () => {
  it('targets dashboard picks with install=1 and default UTMs', () => {
    const url = buildMarketingInstallHowToUrl('https://www.setlistpickem.com');
    expect(url).toContain('/dashboard?');
    expect(url).toContain('install=1');
    expect(url).toContain(`utm_content=${MARKETING_INSTALL_HOWTO_UTM_CONTENT}`);
  });
});
