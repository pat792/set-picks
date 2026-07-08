import { describe, expect, it } from 'vitest';

import { resolveHydratedPushRegistration } from './pushRegistrationState.js';

describe('resolveHydratedPushRegistration', () => {
  it('stays idle when browser permission is not granted', () => {
    expect(
      resolveHydratedPushRegistration({
        permission: 'default',
        storedToken: 'stored',
        localToken: 'local',
      }),
    ).toEqual({ status: 'idle', token: '', shouldResync: false });
  });

  it('enables from Firestore when permission is granted', () => {
    expect(
      resolveHydratedPushRegistration({
        permission: 'granted',
        storedToken: 'stored-token',
        localToken: null,
      }),
    ).toEqual({ status: 'enabled', token: 'stored-token', shouldResync: false });
  });

  it('enables from local FCM token when Firestore is empty', () => {
    expect(
      resolveHydratedPushRegistration({
        permission: 'granted',
        storedToken: null,
        localToken: 'local-token',
      }),
    ).toEqual({ status: 'enabled', token: 'local-token', shouldResync: true });
  });

  it('prefers local token and requests resync when tokens differ', () => {
    expect(
      resolveHydratedPushRegistration({
        permission: 'granted',
        storedToken: 'stale-token',
        localToken: 'fresh-token',
      }),
    ).toEqual({ status: 'enabled', token: 'fresh-token', shouldResync: true });
  });

  it('stays idle when permission is granted but no token exists anywhere', () => {
    expect(
      resolveHydratedPushRegistration({
        permission: 'granted',
        storedToken: '',
        localToken: '',
      }),
    ).toEqual({ status: 'idle', token: '', shouldResync: false });
  });
});
