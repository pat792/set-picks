import React from 'react';
import { CalendarDays, ListOrdered, Users } from 'lucide-react';

import FilterPill from '../../../shared/ui/FilterPill';

const OPTIONS = [
  { id: 'show', label: 'Show', Icon: ListOrdered },
  { id: 'tour', label: 'Tour', Icon: CalendarDays },
  { id: 'pools', label: 'Pools', Icon: Users },
];

/**
 * Primary IA toggle for `/dashboard/standings` (#255) — three-way pick
 * between show-scoped standings, tour-scoped cumulative standings, and
 * pool-scoped show standings. Renders as the first in-page element so
 * users can orient before any data is shown.
 *
 * State + URL sync lives in {@link useStandingsView}; this is the
 * presentational half.
 *
 * @param {{
 *   view: 'show' | 'tour' | 'pools',
 *   onChange: (next: 'show' | 'tour' | 'pools') => void,
 *   className?: string,
 * }} props
 */
export default function StandingsViewToggle({ view, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      aria-label="Standings view"
      className={[
        'mb-5 flex flex-wrap items-center justify-center gap-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {OPTIONS.map(({ id, label, Icon }) => {
        const selected = view === id;
        return (
          <FilterPill
            key={id}
            role="tab"
            aria-selected={selected}
            selected={selected}
            onClick={() => onChange(id)}
            className="min-w-[5.5rem] justify-center"
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </span>
          </FilterPill>
        );
      })}
    </div>
  );
}
