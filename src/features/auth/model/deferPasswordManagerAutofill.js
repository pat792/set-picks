import { useState } from 'react';

/**
 * Safari / iOS often auto-focuses the first email field on cold `/login`
 * (#909). Keychain may be suppressed by `readOnly`, but a blinking cursor
 * still steals the Google vs email choice.
 *
 * Strategy:
 * - Credential fields start `readOnly` until a real user gesture
 * - Reject pre-gesture autofocus (blur + park on a non-input)
 * - Document-level listeners survive React replacing `#root`
 */

export const LOGIN_FOCUS_PARK_ID = 'login-focus-park';

/**
 * Per-field hook — call once per credential input (do not share across fields).
 * @returns {{ readOnly: boolean, onFocus: () => void }}
 */
export function useDeferPasswordManagerAutofill() {
  const [editable, setEditable] = useState(false);
  return {
    readOnly: !editable,
    onFocus() {
      setEditable(true);
    },
  };
}

/**
 * @param {Element | null | undefined} el
 * @returns {boolean}
 */
export function isCredentialAutofillTarget(el) {
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName;
  if (tag !== 'INPUT' && tag !== 'TEXTAREA') return false;
  const type = (
    typeof el.getAttribute === 'function'
      ? el.getAttribute('type') || ''
      : el.type || ''
  ).toLowerCase();
  // Never treat checkbox / submit / hidden as credential autofill targets.
  if (
    type === 'checkbox' ||
    type === 'radio' ||
    type === 'button' ||
    type === 'submit' ||
    type === 'hidden'
  ) {
    return false;
  }
  if (
    type === 'email' ||
    type === 'password' ||
    type === 'text' ||
    type === '' ||
    type === 'search' ||
    type === 'tel' ||
    type === 'url'
  ) {
    return true;
  }
  const id = typeof el.id === 'string' ? el.id : '';
  return (
    id === 'si-email' ||
    id === 'si-pass' ||
    id === 'su-email' ||
    id === 'su-pass' ||
    id === 'su-confirm'
  );
}

/**
 * Move focus off credential fields onto a non-editable park node.
 * @returns {boolean} true if a credential field was neutralized
 */
export function blurAutofocusedCredentialField() {
  if (typeof document === 'undefined') return false;
  try {
    const ae = document.activeElement;
    if (!isCredentialAutofillTarget(ae)) return false;
    if (typeof ae.blur === 'function') ae.blur();
    const park = document.getElementById(LOGIN_FOCUS_PARK_ID);
    if (park && typeof park.focus === 'function') {
      park.focus({ preventScroll: true });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * After hydrate: retry neutralize — Safari private often focuses after paint.
 * Stops early once focus is no longer on a credential field.
 */
export function scheduleNeutralLoginFocus() {
  if (typeof window === 'undefined') return () => {};
  const delays = [0, 50, 150, 400];
  const ids = [];
  const run = () => {
    blurAutofocusedCredentialField();
  };
  run();
  if (typeof window.requestAnimationFrame === 'function') {
    const raf = window.requestAnimationFrame(run);
    ids.push(() => window.cancelAnimationFrame(raf));
  }
  for (const ms of delays) {
    const t = window.setTimeout(run, ms);
    ids.push(() => window.clearTimeout(t));
  }
  return () => {
    for (const cancel of ids) cancel();
  };
}

/**
 * Install document listeners once (idempotent). Survives `#root` remounts.
 * Pre-gesture focus on credential fields is rejected; gesture unlocks readonly.
 */
export function ensureNeutralLoginFocusGuards() {
  if (typeof document === 'undefined') return;
  if (document.documentElement.dataset.loginFocusGuard === '1') return;
  document.documentElement.dataset.loginFocusGuard = '1';

  let gestured = false;
  const markGesture = () => {
    gestured = true;
  };
  document.addEventListener('pointerdown', markGesture, true);
  document.addEventListener('touchstart', markGesture, true);
  document.addEventListener('keydown', markGesture, true);

  document.addEventListener(
    'focusin',
    (ev) => {
      const t = ev.target;
      if (!isCredentialAutofillTarget(t)) return;
      if (gestured) {
        if (t.readOnly) t.readOnly = false;
        return;
      }
      // Autofocus before any user gesture — keep neutral door.
      if (typeof t.blur === 'function') t.blur();
      const park = document.getElementById(LOGIN_FOCUS_PARK_ID);
      if (park && typeof park.focus === 'function') {
        park.focus({ preventScroll: true });
      }
    },
    true,
  );
}
