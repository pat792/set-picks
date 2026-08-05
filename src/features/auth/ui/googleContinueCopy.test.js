import { describe, expect, it } from 'vitest';

import { resolveGoogleContinueMessage } from './googleContinueCopy.js';

describe('resolveGoogleContinueMessage', () => {
  it('uses create-account copy for signup intent', () => {
    expect(resolveGoogleContinueMessage('signup')).toBe(
      'Loading Google account sign-in options…',
    );
  });

  it('uses sign-in copy for existing / default intent', () => {
    expect(resolveGoogleContinueMessage('signin')).toBe('Logging you in…');
    expect(resolveGoogleContinueMessage(null)).toBe('Logging you in…');
    expect(resolveGoogleContinueMessage(undefined)).toBe('Logging you in…');
  });
});
