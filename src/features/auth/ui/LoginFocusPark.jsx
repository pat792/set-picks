import React from 'react';

import { LOGIN_FOCUS_PARK_ID } from '../model/deferPasswordManagerAutofill';

/**
 * Non-editable focus target for #909 — Safari autofocus parks here instead of
 * leaving a blinking cursor in the email field.
 */
export default function LoginFocusPark() {
  return (
    <button
      type="button"
      id={LOGIN_FOCUS_PARK_ID}
      tabIndex={-1}
      aria-hidden="true"
      className="pointer-events-none fixed h-px w-px -m-px overflow-hidden border-0 p-0 opacity-0"
      style={{ clip: 'rect(0, 0, 0, 0)' }}
    />
  );
}
