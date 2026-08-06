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

  it('rejects buttons and null', () => {
    expect(
      isCredentialAutofillTarget({
        tagName: 'BUTTON',
        getAttribute: () => null,
        id: '',
      }),
    ).toBe(false);
    expect(isCredentialAutofillTarget(null)).toBe(false);
  });
});

describe('blurAutofocusedCredentialField', () => {
  it('is a no-op when document is unavailable (node vitest)', () => {
    expect(() => blurAutofocusedCredentialField()).not.toThrow();
  });

  it('blurs document.activeElement when it is a credential field', () => {
    const blur = vi.fn();
    const prev = globalThis.document;
    globalThis.document = {
      activeElement: {
        tagName: 'INPUT',
        id: 'si-email',
        getAttribute: () => 'email',
        blur,
      },
    };
    try {
      blurAutofocusedCredentialField();
      expect(blur).toHaveBeenCalled();
    } finally {
      if (prev === undefined) delete globalThis.document;
      else globalThis.document = prev;
    }
  });
});
