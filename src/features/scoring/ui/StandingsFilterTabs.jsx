import React from 'react';

import Button from '../../../shared/ui/Button';
import PageTitle from '../../../shared/ui/PageTitle';

/**
 * @param {Object} props
 * @param {string} props.activeFilter — `'global'` or a pool id
 * @param {Array<{ id: string; label: string }>} props.filterOptions
 * @param {(filterId: string) => void} props.onTabChange
 */
export default function StandingsFilterTabs({ activeFilter, filterOptions, onTabChange }) {
  return (
    <div className="mb-6">
      <PageTitle as="h3" variant="eyebrow" className="px-2 mb-3">
        Leaderboard Filter:
      </PageTitle>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
        {filterOptions.map((opt) => {
          const isGlobal = opt.id === 'global';
          const isActive = activeFilter === opt.id;
          return (
            <Button
              key={opt.id}
              variant="text"
              onClick={() => onTabChange(opt.id)}
              className={`px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-widest whitespace-nowrap transition-all shadow-lg ${
                isActive
                  ? isGlobal
                    ? 'bg-emerald-500 text-slate-900 shadow-emerald-500/20'
                    : 'bg-blue-500 text-white shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
