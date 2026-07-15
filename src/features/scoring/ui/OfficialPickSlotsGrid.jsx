import React from 'react';

import { FORM_FIELDS } from '../../../shared/data/gameConfig';

/** Official pick-slot board — wildcard stays blank by design (#552). */
export default function OfficialPickSlotsGrid({ actualSetlist }) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:gap-3"
      role="list"
      aria-label="Official pick slots"
    >
      {FORM_FIELDS.map((field) => {
        const isWild = field.id === 'wild';
        const raw = isWild ? '' : String(actualSetlist?.[field.id] ?? '').trim();
        const value = isWild ? null : raw || null;

        return (
          <div
            key={field.id}
            role="listitem"
            className="flex flex-col gap-1 rounded-xl border border-border-muted bg-surface-inset p-3"
          >
            <span className="text-[8px] font-bold uppercase tracking-wider text-content-secondary">
              {field.label}
            </span>
            {isWild ? (
              <span className="text-xs font-bold text-content-secondary/80">
                — <span className="font-semibold">personal pick</span>
              </span>
            ) : (
              <span
                className={`text-xs font-bold truncate ${
                  value ? 'text-white' : 'text-content-secondary'
                }`}
              >
                {value || '—'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
