import { useEffect } from 'react';

import { DASHBOARD_SCROLLPORT_ID } from '../../../shared/hooks/useDashboardMobileChromePortal';
import {
  readKeyboardParitySnapshot,
  shouldHidePrimaryNavAfterKeyboardSettle,
} from '../../../shared/lib/keyboardParityProbe';

const SETTLE_MS = 160;
const TOP_CHROME_PADDING = 'calc(env(safe-area-inset-top, 0px) + 0.5rem)';

/**
 * After `visualViewport` resize/scroll settle, hide a fixed band only when
 * it still sits in the typing band. Does not run on focus/tap.
 * Safari already pans these bands out, so this is a no-op there.
 * Releasing scrollport top padding happens only when the top stack itself
 * is hidden, so the field can use that space on Chrome.
 *
 * @param {React.RefObject<HTMLElement | null>} navRef
 * @param {React.RefObject<HTMLElement | null>} topChromeRef
 */
export function useHideMobilePrimaryNavForKeyboard(navRef, topChromeRef) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;

    let restingVisualHeight = vv.height;
    let timer = 0;

    const applyHideClass = (el, hide) => {
      if (!el) return;
      el.classList.toggle('invisible', hide);
      el.classList.toggle('pointer-events-none', hide);
      if (hide) el.setAttribute('aria-hidden', 'true');
      else el.removeAttribute('aria-hidden');
    };

    const bandInVisual = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return readKeyboardParitySnapshot({
        clientHeight: document.documentElement.clientHeight,
        visualHeight: vv.height,
        offsetTop: vv.offsetTop ?? 0,
        navTop: rect.top,
        navBottom: rect.bottom,
      }).navInVisual;
    };

    const apply = () => {
      const visualHeight = vv.height;
      restingVisualHeight = Math.max(restingVisualHeight, visualHeight);
      const scale = vv.scale ?? 1;
      const hideBand = (el) =>
        shouldHidePrimaryNavAfterKeyboardSettle({
          navInVisual: bandInVisual(el),
          visualHeight,
          restingVisualHeight,
          scale,
        });

      applyHideClass(navRef.current, hideBand(navRef.current));

      const hideTop = hideBand(topChromeRef.current);
      applyHideClass(topChromeRef.current, hideTop);
      const scrollport = document.getElementById(DASHBOARD_SCROLLPORT_ID);
      if (scrollport) {
        scrollport.style.paddingTop = hideTop ? TOP_CHROME_PADDING : '';
      }
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(apply, SETTLE_MS);
    };

    const onOrientation = () => {
      window.clearTimeout(timer);
      restingVisualHeight = 0;
      applyHideClass(navRef.current, false);
      applyHideClass(topChromeRef.current, false);
      const scrollport = document.getElementById(DASHBOARD_SCROLLPORT_ID);
      if (scrollport) scrollport.style.paddingTop = '';
      timer = window.setTimeout(() => {
        restingVisualHeight = vv.height;
        apply();
      }, 300);
    };

    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
    window.addEventListener('orientationchange', onOrientation);
    return () => {
      window.clearTimeout(timer);
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
      window.removeEventListener('orientationchange', onOrientation);
      applyHideClass(navRef.current, false);
      applyHideClass(topChromeRef.current, false);
      const scrollport = document.getElementById(DASHBOARD_SCROLLPORT_ID);
      if (scrollport) scrollport.style.paddingTop = '';
    };
  }, [navRef, topChromeRef]);
}
