import { useEffect } from 'react';

import {
  readKeyboardParitySnapshot,
  shouldHidePrimaryNavAfterKeyboardSettle,
} from '../../../shared/lib/keyboardParityProbe';

const SETTLE_MS = 160;

/**
 * After `visualViewport` resize/scroll settle, hide the primary nav only when
 * it still sits in the typing band (`navInVisual`). Does not run on focus/tap.
 * Does not change scrollport padding or other chrome.
 *
 * @param {React.RefObject<HTMLElement | null>} navRef
 */
export function useHideMobilePrimaryNavForKeyboard(navRef) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;

    let restingVisualHeight = vv.height;
    let timer = 0;

    const applyHideClass = (el, hide) => {
      el.classList.toggle('invisible', hide);
      el.classList.toggle('pointer-events-none', hide);
      if (hide) el.setAttribute('aria-hidden', 'true');
      else el.removeAttribute('aria-hidden');
    };

    const apply = () => {
      const el = navRef.current;
      if (!el) return;
      const visualHeight = vv.height;
      restingVisualHeight = Math.max(restingVisualHeight, visualHeight);
      const navRect = el.getBoundingClientRect();
      const snap = readKeyboardParitySnapshot({
        clientHeight: document.documentElement.clientHeight,
        visualHeight,
        offsetTop: vv.offsetTop ?? 0,
        navTop: navRect.top,
        navBottom: navRect.bottom,
      });
      applyHideClass(
        el,
        shouldHidePrimaryNavAfterKeyboardSettle({
          navInVisual: snap.navInVisual,
          visualHeight,
          restingVisualHeight,
          scale: vv.scale ?? 1,
        }),
      );
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(apply, SETTLE_MS);
    };

    const onOrientation = () => {
      window.clearTimeout(timer);
      restingVisualHeight = 0;
      if (navRef.current) applyHideClass(navRef.current, false);
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
      if (navRef.current) applyHideClass(navRef.current, false);
    };
  }, [navRef]);
}
