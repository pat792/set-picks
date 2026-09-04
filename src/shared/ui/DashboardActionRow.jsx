import React from 'react';

import InfoTooltip, { InfoTooltipProvider } from './InfoTooltip';

/**
 * Dashboard top band: primary actions plus optional helper copy.
 *
 * **Default:** helper copy is an {@link InfoTooltip} via `hint`. Do not add a
 * visible description paragraph unless the repo owner explicitly asks — then
 * use `summary`.
 *
 * @param {{
 *   hint?: string | null,
 *   hintLabel?: string,
 *   summary?: React.ReactNode,
 *   children?: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function DashboardActionRow({
  hint = null,
  hintLabel = 'this section',
  summary = null,
  children,
  className = '',
}) {
  const hasHint = typeof hint === 'string' && hint.trim().length > 0;
  const hasSummary = summary != null && summary !== false;
  const hasActions = children != null && children !== false;

  const actions = hasHint || hasActions ? (
    <div
      className={[
        'flex flex-wrap items-center gap-2',
        hasSummary ? 'order-1 justify-start sm:order-2 sm:justify-end' : 'w-full justify-end',
      ].join(' ')}
    >
      {hasHint ? <InfoTooltip label={hintLabel} definition={hint} /> : null}
      {children}
    </div>
  ) : null;

  const body = (
    <div
      className={[
        'mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3',
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
      {actions}
    </div>
  );

  if (!hasHint) return body;
  return <InfoTooltipProvider>{body}</InfoTooltipProvider>;
}
