import { useEffect } from 'react';

import {
  isVirtualKeyboardOpen,
  layoutViewportKeyboardOverlap,
} from '../lib/keyboardViewport.js';

/**
 * Marks `<html data-keyboard-open>` and sets `--keyboard-inset` from
 * `visualViewport` resize and scroll. Pinch-zoom is ignored.
 */
export default function useVirtualKeyboardOpen() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const layoutHeight = root.clientHeight;
      const vv = window.visualViewport;
      const visualHeight = vv?.height ?? layoutHeight;
      const offsetTop = vv?.offsetTop ?? 0;
      const scale = vv?.scale ?? 1;
      const overlap = layoutViewportKeyboardOverlap(layoutHeight, visualHeight, offsetTop);
      const open = isVirtualKeyboardOpen({ overlap, scale });
      if (open) root.dataset.keyboardOpen = 'true';
      else delete root.dataset.keyboardOpen;
      root.style.setProperty('--keyboard-inset', `${overlap}px`);
    };

    apply();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    window.addEventListener('resize', apply);
    return () => {
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
      delete root.dataset.keyboardOpen;
      root.style.removeProperty('--keyboard-inset');
    };
  }, []);
}
