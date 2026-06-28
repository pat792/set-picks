import { describe, it, expect } from 'vitest';

import {
  DEFAULT_NOTIFICATION_PREFS,
  resolveNotificationPrefs,
} from './notificationPrefsApi.js';

describe('resolveNotificationPrefs', () => {
  it('returns defaults when notificationPrefs is missing', () => {
    expect(resolveNotificationPrefs(null)).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(resolveNotificationPrefs(undefined)).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(resolveNotificationPrefs({})).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(resolveNotificationPrefs({ notificationPrefs: 'nope' })).toEqual(
      DEFAULT_NOTIFICATION_PREFS,
    );
  });

  it('defaults the allow-categories on, commercial off', () => {
    expect(DEFAULT_NOTIFICATION_PREFS).toEqual({
      reminders: true,
      results: true,
      nearMiss: true,
      lifecycle: true,
      commercial: false,
    });
  });

  it('treats only explicit false as opt-out for allow-categories', () => {
    const prefs = resolveNotificationPrefs({
      notificationPrefs: { reminders: false, lifecycle: false },
    });
    expect(prefs.reminders).toBe(false);
    expect(prefs.lifecycle).toBe(false);
    // Untouched keys stay on.
    expect(prefs.results).toBe(true);
    expect(prefs.nearMiss).toBe(true);
  });

  it('lifecycle is on unless explicitly disabled', () => {
    expect(resolveNotificationPrefs({ notificationPrefs: { lifecycle: true } }).lifecycle).toBe(
      true,
    );
    expect(resolveNotificationPrefs({ notificationPrefs: { foo: 1 } }).lifecycle).toBe(true);
    expect(resolveNotificationPrefs({ notificationPrefs: { lifecycle: false } }).lifecycle).toBe(
      false,
    );
  });

  it('commercial requires explicit true to opt in (default-deny)', () => {
    expect(resolveNotificationPrefs({ notificationPrefs: {} }).commercial).toBe(false);
    expect(resolveNotificationPrefs({ notificationPrefs: { commercial: false } }).commercial).toBe(
      false,
    );
    // Any non-true value stays opted out.
    expect(
      resolveNotificationPrefs({ notificationPrefs: { commercial: 'yes' } }).commercial,
    ).toBe(false);
    expect(resolveNotificationPrefs({ notificationPrefs: { commercial: true } }).commercial).toBe(
      true,
    );
  });
});
