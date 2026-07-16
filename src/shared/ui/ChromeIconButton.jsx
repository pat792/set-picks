import React from 'react';

const baseClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-venue/70 bg-surface-panel text-slate-300 transition-colors hover:border-border-venue-strong hover:bg-surface-panel-strong hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg';

/**
 * Round utility icon button for mobile dashboard chrome (#609).
 *
 * @param {{
 *   icon: React.ComponentType<{ className?: string, 'aria-hidden'?: boolean }>,
 *   label: string,
 *   onClick: () => void,
 *   className?: string,
 * }} props
 */
export default function ChromeIconButton({ icon: Icon, label, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[baseClass, className].filter(Boolean).join(' ')}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
    </button>
  );
}
