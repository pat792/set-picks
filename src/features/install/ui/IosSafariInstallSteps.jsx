import React from 'react';

import { IOS_SAFARI_INSTALL_STEPS } from '../model/installCopy';

/**
 * Shared ordered Safari A2HS steps (#539).
 *
 * @param {{ className?: string, compact?: boolean }} props
 */
export default function IosSafariInstallSteps({ className = '', compact = false }) {
  const listClass = compact
    ? 'space-y-1.5 rounded-xl border border-border-muted bg-surface-inset p-3 text-xs text-content-secondary'
    : 'space-y-2 rounded-2xl border border-border-muted bg-surface-inset p-4 text-sm text-content-secondary';

  return (
    <ol className={`${listClass} ${className}`.trim()}>
      {IOS_SAFARI_INSTALL_STEPS.map((step) => (
        <li key={step.id}>
          {step.prefix}
          {step.parts.map((part, i) =>
            part.bold ? (
              <span key={`${step.id}-${i}`} className="font-bold text-white">
                {part.text}
              </span>
            ) : (
              <span key={`${step.id}-${i}`}>{part.text}</span>
            ),
          )}
        </li>
      ))}
    </ol>
  );
}
