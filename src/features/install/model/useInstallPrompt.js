import { useCallback, useEffect, useMemo, useState } from 'react';

import { ga4Event } from '../../../shared/lib/ga4';
import { isInstalled, isIosSafariBrowser } from './installPromptPlatform';

const IOS_DISMISS_KEY = 'set-picks-install-ios-dismissed';

function getIosDismissed() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(IOS_DISMISS_KEY) === '1';
}

function setIosDismissed(value) {
  if (typeof window === 'undefined') return;
  if (value) {
    window.localStorage.setItem(IOS_DISMISS_KEY, '1');
  } else {
    window.localStorage.removeItem(IOS_DISMISS_KEY);
  }
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() =>
    typeof window === 'undefined' ? false : isInstalled(window, navigator)
  );
  const [isIosSafari, setIsIosSafari] = useState(() =>
    typeof window === 'undefined' ? false : isIosSafariBrowser(navigator)
  );
  const [iosDismissed, setIosDismissedState] = useState(getIosDismissed);
  const [showIosGuide, setShowIosGuide] = useState(false);

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
    };
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    updateInstalled();
    setIsIosSafari(isIosSafariBrowser(navigator));
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

  const canPrompt = Boolean(deferredPrompt) && !installed;
  const shouldShowIosFlow = isIosSafari && !installed && !iosDismissed;
  const shouldShowCard = canPrompt || shouldShowIosFlow;

  useEffect(() => {
    if (!shouldShowCard) return;
    ga4Event('a2hs_cta_shown', { platform: canPrompt ? 'chromium' : 'ios_safari' });
  }, [shouldShowCard, canPrompt]);

  const dismissIos = useCallback(() => {
    setIosDismissed(true);
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
      isInstalled: installed,
      showIosGuide,
      shouldShowCard,
      promptInstall,
      dismissIos,
      openIosGuide,
      closeIosGuide,
      shouldShowIosFlow,
    }),
    [
      canPrompt,
      isIosSafari,
      installed,
      showIosGuide,
      shouldShowCard,
      promptInstall,
      dismissIos,
      openIosGuide,
      closeIosGuide,
      shouldShowIosFlow,
    ]
  );
}
