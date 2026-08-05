import { useEffect } from 'react';

/**
 * Full-document navigation (MPA / dual-entry). Use when the target path must
 * load a different Vite HTML entry than the current document (#881 login).
 *
 * @param {{ to: string }} props
 */
export default function HardRedirect({ to }) {
  useEffect(() => {
    if (typeof to !== 'string' || !to) return;
    window.location.replace(to);
  }, [to]);
  return null;
}
