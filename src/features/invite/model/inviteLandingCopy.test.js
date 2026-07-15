import { describe, expect, it } from 'vitest';

import {
  getInviteLandingHeadline,
  getInviteLandingSubcopy,
} from './inviteLandingCopy';

describe('inviteLandingCopy', () => {
  it('uses personalized site headline when handle resolves', () => {
    expect(
      getInviteLandingHeadline({ inviteKind: 'site', resolvedHandle: 'Mikey' }),
    ).toBe("Mikey invited you to Setlist Pick'em");
  });

  it('falls back to generic site headline when handle is missing', () => {
    expect(
      getInviteLandingHeadline({ inviteKind: 'site', resolvedHandle: null }),
    ).toBe("You're invited to Setlist Pick'em");
  });

  it('uses personalized pool headline when handle resolves', () => {
    expect(
      getInviteLandingHeadline({ inviteKind: 'pool', resolvedHandle: 'Mikey' }),
    ).toBe('Mikey invited you to join their pool');
  });

  it('falls back to generic pool headline when handle is missing', () => {
    expect(
      getInviteLandingHeadline({ inviteKind: 'pool', resolvedHandle: null }),
    ).toBe("You're invited to join a Setlist Pick'em pool");
  });

  it('returns kind-specific subcopy', () => {
    expect(getInviteLandingSubcopy({ inviteKind: 'site' })).toMatch(/predict setlists/i);
    expect(getInviteLandingSubcopy({ inviteKind: 'pool' })).toMatch(/join the pool/i);
  });
});
