import { describe, expect, it } from 'vitest';

import { resolveLoginMode } from './LoginPage.jsx';

describe('resolveLoginMode (#834)', () => {
  it('prefers mode=signup|signin', () => {
    expect(resolveLoginMode(new URLSearchParams('mode=signup'))).toBe('signup');
    expect(resolveLoginMode(new URLSearchParams('mode=signin'))).toBe('signin');
  });

  it('accepts signup=1 alias', () => {
    expect(resolveLoginMode(new URLSearchParams('signup=1'))).toBe('signup');
  });

  it('defaults to signin', () => {
    expect(resolveLoginMode(new URLSearchParams(''))).toBe('signin');
    expect(resolveLoginMode(new URLSearchParams('mode=other'))).toBe('signin');
  });
});
