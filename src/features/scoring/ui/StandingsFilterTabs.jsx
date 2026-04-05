import React from 'react';

import PageTitle from '../../../shared/ui/PageTitle';

const scrollRibbon =
  'overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

/**
 * @param {Object} props
 * @param {string} props.activeFilter — `'global'` or a pool id
 * @param {Array<{ id: string; label: string }>} props.filterOptions
 * @param {(filterId: string) => void} props.onTabChange
 */
export default function StandingsFilterTabs({ activeFilter, filterOptions, onTabChange }) {
  return (
    <div className="mb-4">
      <PageTitle as="h3" variant="eyebrow" className="px-2 mb-2">
        Compare
      </PageTitle>

      <div className={`flex gap-1.5 px-1 pb-1 ${scrollRibbon}`}>
        {filterOptions.map((opt) => {
          const isActive = activeFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onTabChange(opt.id)}
              className={[
                'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold tracking-tight transition-colors',
                isActive
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
