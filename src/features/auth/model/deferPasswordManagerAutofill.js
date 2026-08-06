import { useState } from 'react';

/**
 * Safari / iOS Keychain + Face ID often auto-focus the first email/password
 * field on cold `/login`, stealing the choice between Google and email (#909).
 *
 * Start credential fields `readOnly`; unlock on intentional focus. Pair with
 * HTML-first boot shell `readonly` + blur script in `login-boot-shell.mjs`.
 */

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
  if (
    type === 'email' ||
    type === 'password' ||
    type === 'text' ||
    type === ''
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
 * Blur an autofocused credential field after paint / hydrate.
 * Safe no-op when nothing is focused or focus is already outside inputs.
 */
export function blurAutofocusedCredentialField() {
  if (typeof document === 'undefined') return;
  try {
    const ae = document.activeElement;
    if (!isCredentialAutofillTarget(ae)) return;
    if (typeof ae.blur === 'function') ae.blur();
  } catch {
    // Private mode / odd DOM — ignore.
  }
}
