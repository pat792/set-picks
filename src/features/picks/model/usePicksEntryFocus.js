import { useEffect } from 'react';

/**
 * While a Make Picks field is focused, collapse mobile tertiary + status chrome
 * so the typing band matches Safari (option B, #1041).
 *
 * @param {boolean} active
 */
export default function usePicksEntryFocus(active) {
  useEffect(() => {
    if (!active) return undefined;
    const root = document.documentElement;
    root.dataset.picksEntryFocus = 'true';
    return () => {
      delete root.dataset.picksEntryFocus;
    };
  }, [active]);
}
