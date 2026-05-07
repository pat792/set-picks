import { useCallback, useMemo, useState } from 'react';

import { ga4Event } from '../../../shared/lib/ga4';

import { SESSION_PUSH_NUDGE_AFTER_INSTALL_KEY } from './installEngageKeys';

const PUSH_NUDGE_DISMISS_KEY = 'set-picks-push-nudge-dismissed';

function readDismissed() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PUSH_NUDGE_DISMISS_KEY) === '1';
}

function readSessionPending() {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(SESSION_PUSH_NUDGE_AFTER_INSTALL_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Optional push follow-up (#334): after the app is installed (or added to home
 * screen), nudge users who have not decided on notification permission yet.
 * One tap routes to Notifications with the push section opened — closest to
 * "one-click" the web platform allows (browser still shows its own prompt).
 *
 * @param {{ userId: string | null | undefined, isInstalled: boolean }} params
 */
export function useDashboardPushNudge({ userId, isInstalled }) {
  const [tick, setTick] = useState(0);

  const dismissPushNudge = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PUSH_NUDGE_DISMISS_KEY, '1');
    try {
      window.sessionStorage.removeItem(SESSION_PUSH_NUDGE_AFTER_INSTALL_KEY);
    } catch {
      /* ignore */
    }
    setTick((t) => t + 1);
    ga4Event('push_nudge_dismissed', { surface: 'dashboard' });
  }, []);

  const clearSessionInstallFlag = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(SESSION_PUSH_NUDGE_AFTER_INSTALL_KEY);
      }
    } catch {
      /* ignore */
    }
    setTick((t) => t + 1);
  }, []);

  return useMemo(() => {
    void tick;
    const permission =
      typeof Notification !== 'undefined' ? Notification.permission : 'denied';
    const dismissed = readDismissed();
    const sessionPending = readSessionPending();
    const shouldShowPushNudge = Boolean(
      userId &&
      isInstalled &&
      permission === 'default' &&
      !dismissed
    );

    return {
      shouldShowPushNudge,
      /** True right after `appinstalled` / standalone — slightly stronger copy. */
      highlightAfterInstall: sessionPending && shouldShowPushNudge,
      dismissPushNudge,
      clearSessionInstallFlag,
    };
  }, [userId, isInstalled, tick, dismissPushNudge, clearSessionInstallFlag]);
}
