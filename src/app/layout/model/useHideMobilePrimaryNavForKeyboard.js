import { useEffect } from 'react';

import { DASHBOARD_SCROLLPORT_ID } from '../../../shared/hooks/useDashboardMobileChromePortal';
import {
  isLayoutViewportShrunk,
  readKeyboardParitySnapshot,
  shouldHidePrimaryNavAfterKeyboardSettle,
} from '../../../shared/lib/keyboardParityProbe';

const SETTLE_MS = 160;
const COMPACT_TOP_PADDING = 'calc(env(safe-area-inset-top, 0px) + 0.5rem)';
const COMPACT_BOTTOM_PADDING = '0.5rem';

/**
 * Keyboard chrome for the mobile dashboard shell. Runs only after
 * `visualViewport` resize/scroll settle, never on the tap.
 *
 * Two browser models on the same WebKit:
 * - Safari keeps the layout viewport tall and pans it. The fixed top stack
 *   and bottom nav leave the visible band on their own. Nothing to do.
 * - iOS Chrome frames its web view to the visible screen, so the layout
 *   viewport (`documentElement.clientHeight`) shrinks to the keyboard-free
 *   area. Every fixed band stays on screen and the scrollport keeps its
 *   reserved padding, so the form gets a few dozen pixels. In that case
 *   hide the top stack and nav and release the reserved padding, holding
 *   the scroll position so the focused field does not move.
 *
 * The bottom nav also keeps the rect gate (`navInVisual`) as a fallback.
 *
 * @param {React.RefObject<HTMLElement | null>} navRef
 * @param {React.RefObject<HTMLElement | null>} topChromeRef
 */
export function useHideMobilePrimaryNavForKeyboard(navRef, topChromeRef) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;

    let restingVisualHeight = vv.height;
    let restingClientHeight = document.documentElement.clientHeight;
    let compact = false;
    let timer = 0;

    const applyHideClass = (el, hide) => {
      if (!el) return;
      el.classList.toggle('invisible', hide);
      el.classList.toggle('pointer-events-none', hide);
      if (hide) el.setAttribute('aria-hidden', 'true');
      else el.removeAttribute('aria-hidden');
    };

    const setCompact = (next) => {
      if (next === compact) return;
      const scrollport = document.getElementById(DASHBOARD_SCROLLPORT_ID);
      const focused = document.activeElement;
      const focusedTop =
        focused && scrollport?.contains(focused)
          ? focused.getBoundingClientRect().top
          : null;

      applyHideClass(topChromeRef.current, next);
      if (scrollport) {
        scrollport.style.paddingTop = next ? COMPACT_TOP_PADDING : '';
        scrollport.style.paddingBottom = next ? COMPACT_BOTTOM_PADDING : '';
        if (focusedTop != null && focused) {
          const after = focused.getBoundingClientRect().top;
          scrollport.scrollTop += after - focusedTop;
        }
      }
      compact = next;
    };

    const apply = () => {
      const visualHeight = vv.height;
      const clientHeight = document.documentElement.clientHeight;
      restingVisualHeight = Math.max(restingVisualHeight, visualHeight);
      restingClientHeight = Math.max(restingClientHeight, clientHeight);

      const layoutShrunk = isLayoutViewportShrunk({
        clientHeight,
        restingClientHeight,
      });

      setCompact(layoutShrunk);

      const navEl = navRef.current;
      let hideNav = layoutShrunk;
      if (!hideNav && navEl) {
        const rect = navEl.getBoundingClientRect();
        const snap = readKeyboardParitySnapshot({
          clientHeight,
          visualHeight,
          offsetTop: vv.offsetTop ?? 0,
          navTop: rect.top,
          navBottom: rect.bottom,
        });
        hideNav = shouldHidePrimaryNavAfterKeyboardSettle({
          navInVisual: snap.navInVisual,
          visualHeight,
          restingVisualHeight,
          scale: vv.scale ?? 1,
        });
      }
      applyHideClass(navEl, hideNav);
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(apply, SETTLE_MS);
    };

    const reset = () => {
      applyHideClass(navRef.current, false);
      setCompact(false);
    };

    const onOrientation = () => {
      window.clearTimeout(timer);
      restingVisualHeight = 0;
      restingClientHeight = 0;
      reset();
      timer = window.setTimeout(() => {
        restingVisualHeight = vv.height;
        restingClientHeight = document.documentElement.clientHeight;
        apply();
      }, 300);
    };

    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', onOrientation);
    return () => {
      window.clearTimeout(timer);
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', onOrientation);
      reset();
    };
  }, [navRef, topChromeRef]);
}
