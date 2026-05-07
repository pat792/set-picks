import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ga4Event } from '../../../shared/lib/ga4';
import {
  isInstalled,
  isIosNonSafariBrowser,
  isIosSafariBrowser,
} from './installPromptPlatform';
import { SESSION_PUSH_NUDGE_AFTER_INSTALL_KEY } from './installEngageKeys';

const IOS_DISMISS_KEY = 'set-picks-install-ios-dismissed';
const DASHBOARD_INSTALL_SNOOZE_KEY = 'set-picks-install-dashboard-snooze-until';

function getIosDismissed() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(IOS_DISMISS_KEY) === '1';
}

function setIosDismissedStorage(value) {
  if (typeof window === 'undefined') return;
  if (value) {
    window.localStorage.setItem(IOS_DISMISS_KEY, '1');
  } else {
    window.localStorage.removeItem(IOS_DISMISS_KEY);
  }
}

function isDashboardInstallSnoozed() {
  if (typeof window === 'undefined') return false;
  const raw = window.localStorage.getItem(DASHBOARD_INSTALL_SNOOZE_KEY);
  if (!raw) return false;
  const t = Number(raw);
  return Number.isFinite(t) && t > Date.now();
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() =>
    typeof window === 'undefined' ? false : isInstalled(window, navigator)
  );
  const [isIosSafari, setIsIosSafari] = useState(() =>
    typeof window === 'undefined' ? false : isIosSafariBrowser(navigator)
  );
  const [isIosNonSafari, setIsIosNonSafari] = useState(() =>
    typeof navigator === 'undefined' ? false : isIosNonSafariBrowser(navigator)
  );
  const [iosDismissed, setIosDismissedState] = useState(getIosDismissed);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [snoozeTick, setSnoozeTick] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateInstalled = () => {
      setInstalled(isInstalled(window, navigator));
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = () => updateInstalled();
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      ga4Event('a2hs_installed');
      try {
        window.sessionStorage.setItem(SESSION_PUSH_NUDGE_AFTER_INSTALL_KEY, '1');
      } catch {
        /* ignore quota / privacy mode */
      }
    };
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    updateInstalled();
    setIsIosSafari(isIosSafariBrowser(navigator));
    setIsIosNonSafari(isIosNonSafariBrowser(navigator));
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onDisplayModeChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(onDisplayModeChange);
    }
    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', onDisplayModeChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(onDisplayModeChange);
      }
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  /** iOS “Add to Home Screen” / display-mode standalone may not fire `appinstalled`. */
  const prevInstalledRef = useRef(null);
  useEffect(() => {
    if (prevInstalledRef.current === null) {
      prevInstalledRef.current = installed;
      return;
    }
    if (!prevInstalledRef.current && installed) {
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(SESSION_PUSH_NUDGE_AFTER_INSTALL_KEY, '1');
        }
      } catch {
        /* ignore */
      }
    }
    prevInstalledRef.current = installed;
  }, [installed]);

  const canPrompt = Boolean(deferredPrompt) && !installed;
  const shouldShowIosFlow = isIosSafari && !installed && !iosDismissed;
  const shouldShowIosNonSafariFlow = isIosNonSafari && !installed && !iosDismissed;
  const shouldShowCard = canPrompt || shouldShowIosFlow || shouldShowIosNonSafariFlow;

  const dashboardSnoozed = useMemo(() => {
    void snoozeTick;
    return isDashboardInstallSnoozed();
  }, [snoozeTick, installed]);

  const shouldShowDashboardInstallBanner =
    !installed &&
    !dashboardSnoozed &&
    (canPrompt || shouldShowIosFlow || shouldShowIosNonSafariFlow);

  useEffect(() => {
    if (!shouldShowCard) return;
    let platform = 'ios_safari';
    if (canPrompt) platform = 'chromium';
    else if (isIosNonSafari) platform = 'ios_non_safari';
    ga4Event('a2hs_cta_shown', { platform });
  }, [shouldShowCard, canPrompt, isIosNonSafari]);

  const dismissIos = useCallback(() => {
    setIosDismissedStorage(true);
    setIosDismissedState(true);
    setShowIosGuide(false);
    ga4Event('a2hs_ios_dismissed');
  }, []);

  const openIosGuide = useCallback(() => {
    setShowIosGuide(true);
    ga4Event('a2hs_ios_guide_opened');
  }, []);

  const closeIosGuide = useCallback(() => {
    setShowIosGuide(false);
  }, []);

  const snoozeInstallDashboard = useCallback((days = 7) => {
    if (typeof window === 'undefined') return;
    const until = Date.now() + days * 86_400_000;
    window.localStorage.setItem(DASHBOARD_INSTALL_SNOOZE_KEY, String(until));
    setSnoozeTick((t) => t + 1);
    ga4Event('a2hs_dashboard_snoozed', { days });
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    ga4Event('a2hs_cta_clicked', { platform: 'chromium' });
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    ga4Event('a2hs_prompt_result', { outcome: choice?.outcome ?? 'unknown' });
    setDeferredPrompt(null);
    return choice?.outcome === 'accepted';
  }, [deferredPrompt]);

  return useMemo(
    () => ({
      canPrompt,
      isIosSafari,
      isIosNonSafari,
      isInstalled: installed,
      showIosGuide,
      shouldShowCard,
      shouldShowIosFlow,
      shouldShowIosNonSafariFlow,
      shouldShowDashboardInstallBanner,
      promptInstall,
      dismissIos,
      openIosGuide,
      closeIosGuide,
      snoozeInstallDashboard,
    }),
    [
      canPrompt,
      isIosSafari,
      isIosNonSafari,
      installed,
      showIosGuide,
      shouldShowCard,
      shouldShowIosFlow,
      shouldShowIosNonSafariFlow,
      shouldShowDashboardInstallBanner,
      promptInstall,
      dismissIos,
      openIosGuide,
      closeIosGuide,
      snoozeInstallDashboard,
    ]
  );
}
