import { describe, expect, it } from 'vitest';

import { SESSION_HINT_REDIRECT_SCRIPT } from './sessionHintRedirect.js';

describe('SESSION_HINT_REDIRECT_SCRIPT', () => {
  it('bounces only on / with the session hint key', () => {
    expect(SESSION_HINT_REDIRECT_SCRIPT).toContain('setpicks_session_hint_v1');
    expect(SESSION_HINT_REDIRECT_SCRIPT).toContain('location.pathname==="/"');
    expect(SESSION_HINT_REDIRECT_SCRIPT).toContain('/dashboard');
    expect(SESSION_HINT_REDIRECT_SCRIPT).not.toContain('firebase');
  });
});
