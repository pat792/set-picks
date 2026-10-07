import React from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useFeatureSpotlight } from '../model/useFeatureSpotlight';

const LINK =
  'font-bold text-slate-100 underline-offset-2 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg rounded';

/**
 * Dismissible note that Personal and Global carry picking average, PPS, and SLG.
 * One dismissal per signed-in player, through 2026-12-31.
 *
 * @param {{ className?: string }} [props]
 */
export default function StatsRatesDidYouKnow({ className = '' }) {
  const { active, markSeen, trackClick } = useFeatureSpotlight('stats-rates');
  if (!active) return null;

  return (
    <div
      className={[
        'flex items-start gap-2 rounded-xl border border-border-subtle/55 bg-surface-panel/40 px-3 py-2.5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="note"
      aria-label="Personal and Global stats"
    >
      <p className="min-w-0 flex-1 text-xs font-medium leading-snug text-content-secondary">
        <span className="font-black uppercase tracking-widest text-amber-200/90">
          Did you know?
        </span>{' '}
        In Stats,{' '}
        <Link
          to="/dashboard/stats/personal"
          className={LINK}
          onClick={trackClick}
        >
          Personal
        </Link>{' '}
        and{' '}
        <Link
          to="/dashboard/stats/global"
          className={LINK}
          onClick={trackClick}
        >
          Global
        </Link>{' '}
        show your picking average, points per show, and slugging percentage.
      </p>
      <button
        type="button"
        onClick={markSeen}
        className="-mr-1 -mt-0.5 rounded-md p-1 text-content-secondary transition hover:bg-surface-inset hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label="Dismiss stats tip"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
