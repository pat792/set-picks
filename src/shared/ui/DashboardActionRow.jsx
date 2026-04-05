import React from 'react';

/**
 * Consistent dashboard top band: optional short context (left / below on narrow screens)
 * and primary actions (right, or first on mobile when both exist so CTAs stay thumb-friendly).
 */
export default function DashboardActionRow({
  summary = null,
  children,
  className = '',
}) {
  const hasSummary = summary != null && summary !== false;

  return (
    <div
      className={[
        'mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {hasSummary ? (
        <div className="order-2 min-w-0 flex-1 text-xs leading-snug text-slate-400 sm:order-1">
          {summary}
        </div>
      ) : null}
      <div
        className={[
          'flex flex-wrap items-center gap-2',
          hasSummary ? 'order-1 justify-start sm:order-2 sm:justify-end' : 'w-full justify-end',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
