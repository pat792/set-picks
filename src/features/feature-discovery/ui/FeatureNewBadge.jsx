import React from 'react';

/**
 * Soft discovery chrome (#639).
 * - `label` — “New” micro-pill (section headings, roomy chrome)
 * - `dot` — corner accent for tight controls (e.g. Standings Stats tab)
 *
 * @param {{
 *   className?: string,
 *   title?: string,
 *   variant?: 'label' | 'dot',
 * }} [props]
 */
export default function FeatureNewBadge({
  className = '',
  title = 'New feature',
  variant = 'label',
}) {
  if (variant === 'dot') {
    return (
      <span
        title={title}
        className={[
          'pointer-events-none absolute right-1 top-1 inline-flex items-center justify-center',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="sr-only">{title}</span>
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          aria-hidden
        />
      </span>
    );
  }

  return (
    <span
      title={title}
      className={[
        'inline-block shrink-0 rounded-md border border-brand-primary/35 bg-brand-primary/15 px-1 py-0.5 text-[9px] font-black uppercase tracking-wider text-brand-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      New
    </span>
  );
}
