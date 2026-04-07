import React from 'react';

export default function GhostPill({
  children,
  onClick,
  icon: Icon,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border-subtle bg-surface-panel px-3 py-1.5 text-xs font-medium font-sans text-slate-300 transition-colors hover:bg-surface-panel-strong hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {Icon ? <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden /> : null}
      {children}
    </button>
  );
}
