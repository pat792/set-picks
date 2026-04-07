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
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-panel text-slate-300 hover:bg-indigo-900/45 hover:text-teal-300 transition-colors cursor-pointer border border-indigo-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
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
