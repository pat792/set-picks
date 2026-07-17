import React, { useMemo } from 'react';
import { BarChart3, CalendarDays, ListOrdered, Users } from 'lucide-react';

import {
  FeatureNewBadge,
  useFeatureSpotlight,
} from '../../feature-discovery';
import ChromeSegmentedControl from '../../../shared/ui/ChromeSegmentedControl';

const OPTIONS = [
  { id: 'show', label: 'Show', icon: ListOrdered },
  { id: 'tour', label: 'Tour', icon: CalendarDays },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'pools', label: 'Pools', icon: Users },
];

const baseClass =
  'relative shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg';

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
 * Primary IA toggle for Standings (#255 / #555) — Show / Tour / Stats / Pools.
 *
 * Responsive contract (#609): mobile fixed chrome uses boxed
 * `ChromeSegmentedControl` (icons + equal quarters); `md+` renders as an
 * auto-width inline pill group with primary CTA active state.
 *
 * State + navigation lives in {@link useStandingsView} /
 * {@link useStandingsViewChange}; this is the presentational half.
 *
 * @param {{
 *   view: 'show' | 'tour' | 'pools' | 'stats',
 *   onChange: (next: 'show' | 'tour' | 'pools' | 'stats') => void,
 *   className?: string,
 * }} props
 */
export default function StandingsViewToggle({ view, onChange, className = '' }) {
  const tourStatsSpotlight = useFeatureSpotlight('tour-stats');

  const handleChange = (next) => {
    if (next === 'stats' && tourStatsSpotlight.active) {
      tourStatsSpotlight.trackClick();
    }
    onChange(next);
  };

  const items = useMemo(() => {
    const badge = tourStatsSpotlight.active ? (
      <FeatureNewBadge variant="dot" title="New: Tour Stats" />
    ) : null;
    return OPTIONS.map((opt) =>
      opt.id === 'stats' ? { ...opt, badge } : opt,
    );
  }, [tourStatsSpotlight.active]);

  return (
    <>
      <ChromeSegmentedControl
        ariaLabel="Standings view"
        value={view}
        onChange={handleChange}
        items={items}
        className={['md:hidden', className].filter(Boolean).join(' ')}
      />

      <div
        role="tablist"
        aria-label="Standings view"
        className={[
          'mb-5 hidden w-auto flex-wrap items-center justify-center gap-2 md:flex',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {items.map(({ id, label, icon: Icon, badge }) => {
          const selected = view === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => handleChange(id)}
              className={[
                baseClass,
                selected ? selectedClass : unselectedClass,
                'min-w-[4.75rem] justify-center',
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
              {badge}
            </button>
          );
        })}
      </div>
    </>
  );
}
