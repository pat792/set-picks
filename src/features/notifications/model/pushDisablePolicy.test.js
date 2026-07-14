import { describe, expect, it } from 'vitest';

import { canShowPushDisable, pushDisableUnavailableCopy } from './pushDisablePolicy';

describe('pushDisablePolicy (#532)', () => {
  it('allows Disable only when installed', () => {
    expect(canShowPushDisable({ isInstalled: true })).toBe(true);
    expect(canShowPushDisable({ isInstalled: false })).toBe(false);
    expect(canShowPushDisable({})).toBe(false);
  });

  it('explains non-PWA when Disable is hidden', () => {
    const copy = pushDisableUnavailableCopy({ isInstalled: false, permission: 'default' });
    expect(copy).toMatch(/home screen/i);
    expect(pushDisableUnavailableCopy({ isInstalled: true })).toBeNull();
    expect(pushDisableUnavailableCopy({ isInstalled: false, permission: 'granted' })).toMatch(
      /system Settings/i,
    );
  });
});
