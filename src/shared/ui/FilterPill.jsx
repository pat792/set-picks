import React from 'react';

const baseClass =
  'shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold tracking-tight font-sans transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg';

/**
 * Compare / filter toggle (pill). Active state uses panel-strong + subtle border — not brand teal
 * (see docs/design.md § Filters & Chips).
 */
export default function FilterPill({
  selected = false,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={[
        baseClass,
        selected
          ? 'border-border-subtle bg-surface-panel-strong text-white shadow-inset-glass'
          : 'border-transparent bg-surface-panel text-slate-400 hover:bg-surface-panel-strong/90 hover:text-slate-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
