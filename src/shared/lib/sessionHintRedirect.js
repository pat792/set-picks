/**
 * Inline + runtime helper for returning-user bounce on marketing `/` (#832).
 * Must stay free of Firebase — used by the marketing entry and injected HTML.
 */

import { hasPersistedSessionHint } from './persistedSessionHint';

export const SESSION_HINT_REDIRECT_SCRIPT = `(function(){try{if(location.pathname==="/"&&localStorage.getItem("setpicks_session_hint_v1")==="1"){location.replace("/dashboard");}}catch(e){}})();`;

/**
 * Client-side fallback if the inline script did not run (or hint was set later).
 * @returns {boolean} true when a redirect was started
 */
export function redirectIfPersistedSessionHint() {
  if (typeof window === 'undefined') return false;
  if (window.location.pathname !== '/') return false;
  if (!hasPersistedSessionHint()) return false;
  window.location.replace('/dashboard');
  return true;
}
