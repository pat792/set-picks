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
  // Avoid a blank frame while replace runs (#899 logout race).
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-content-secondary"
      role="status"
      aria-live="polite"
    >
      Taking you there…
    </div>
  );
}
