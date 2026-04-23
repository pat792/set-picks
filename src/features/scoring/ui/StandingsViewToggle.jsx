import React from 'react';
import { CalendarDays, ListOrdered, Users } from 'lucide-react';

const OPTIONS = [
  { id: 'show', label: 'Show', Icon: ListOrdered },
  { id: 'tour', label: 'Tour', Icon: CalendarDays },
  { id: 'pools', label: 'Pools', Icon: Users },
];

const baseClass =
  'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg';

/**
 * Active state mirrors `Button variant="primary"` (teal fill, dark text,
 * brand glow) — the user-facing contract for primary CTAs across the
 * app — so the IA toggle reads as "pick one of these", not a passive
 * filter. Kept inline rather than extending `FilterPill` so the neutral
 * pool sub-selector pills can retain the subdued `FilterPill` style and
 * preserve visual hierarchy.
 */
const selectedClass =
  'border-transparent bg-brand-primary text-brand-bg-deep shadow-glow-brand hover:shadow-glow-brand-lg';

const unselectedClass =
  'border-border-venue/70 bg-surface-panel text-slate-300 hover:border-border-venue-strong hover:bg-surface-panel-strong hover:text-white';

/**
 * Primary IA toggle for `/dashboard/standings` (#255) — three-way pick
 * between show-scoped standings, tour-scoped cumulative standings, and
 * pool-scoped show standings. Renders as the first in-page content so
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
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={[
              baseClass,
              selected ? selectedClass : unselectedClass,
              'min-w-[5.5rem] justify-center',
            ].join(' ')}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
