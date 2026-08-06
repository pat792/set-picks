import { describe, expect, it, vi } from 'vitest';

import {
  blurAutofocusedCredentialField,
  isCredentialAutofillTarget,
} from './deferPasswordManagerAutofill';

describe('isCredentialAutofillTarget', () => {
  it('matches email/password inputs', () => {
    expect(
      isCredentialAutofillTarget({
        tagName: 'INPUT',
        getAttribute: () => 'email',
        id: 'si-email',
      }),
    ).toBe(true);
    expect(
      isCredentialAutofillTarget({
        tagName: 'INPUT',
        getAttribute: () => 'password',
        id: 'si-pass',
      }),
    ).toBe(true);
  });

  it('rejects buttons, checkboxes, and null', () => {
    expect(
      isCredentialAutofillTarget({
        tagName: 'BUTTON',
        getAttribute: () => null,
        id: '',
      }),
    ).toBe(false);
    expect(
      isCredentialAutofillTarget({
        tagName: 'INPUT',
        getAttribute: () => 'checkbox',
        id: 'legal',
      }),
    ).toBe(false);
    expect(isCredentialAutofillTarget(null)).toBe(false);
  });
});

describe('blurAutofocusedCredentialField', () => {
  it('is a no-op when document is unavailable (node vitest)', () => {
    expect(() => blurAutofocusedCredentialField()).not.toThrow();
  });

  it('blurs credential focus and parks on focus park', () => {
    const blur = vi.fn();
    const parkFocus = vi.fn();
    const prev = globalThis.document;
    globalThis.document = {
      activeElement: {
        tagName: 'INPUT',
        id: 'si-email',
        getAttribute: () => 'email',
        blur,
      },
      getElementById: (id) =>
        id === 'login-focus-park'
          ? { focus: parkFocus }
          : null,
    };
    try {
      expect(blurAutofocusedCredentialField()).toBe(true);
      expect(blur).toHaveBeenCalled();
      expect(parkFocus).toHaveBeenCalledWith({ preventScroll: true });
    } finally {
      if (prev === undefined) delete globalThis.document;
      else globalThis.document = prev;
    }
  });
});
