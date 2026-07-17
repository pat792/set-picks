import React from 'react';
import { Loader2 } from 'lucide-react';

import Card from '../../../shared/ui/Card';
import { SCORING_RULES } from '../../../shared/utils/scoring';

const { BUSTOUT_MIN_GAP } = SCORING_RULES;

/**
 * @param {{
 *   tourName: string,
 *   hasTour: boolean,
 *   calendarLoading: boolean,
 *   setlistLoading: boolean,
 *   setlistError: unknown,
 *   stats: import('../model/aggregateTourSetlistStats').TourSetlistStats,
 *   setlistReads: number,
 *   overlay: null | {
 *     showsPicked: number,
 *     slotsFilled: number,
 *     slotsCorrect: number,
 *     bustoutHits: number,
 *     topSongOverlap: number,
 *   },
 *   overlayLoading: boolean,
 * }} props
 */
export default function TourStatsView({
  tourName,
  hasTour,
  calendarLoading,
  setlistLoading,
  setlistError,
  stats,
  setlistReads,
  overlay,
  overlayLoading,
}) {
  if (calendarLoading || setlistLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" aria-label="Loading tour stats" />
      </div>
    );
  }

  if (!hasTour) {
    return (
      <Card className="p-5">
        <p className="text-sm font-semibold text-content-secondary">
          No tour is available yet. Tour stats appear once a post-launch tour
          has shows on or before today.
        </p>
      </Card>
    );
  }

  if (setlistError) {
    return (
      <Card className="p-5">
        <p className="text-sm font-semibold text-red-300">
          Couldn’t load tour setlists. Try again in a moment.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-content-secondary">
        {tourName} · {stats.showsWithSetlist} of {stats.tourShowCount} shows with
        setlists · {setlistReads} setlist reads
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Unique songs" value={stats.uniqueSongs} />
        <StatTile label="Song plays" value={stats.totalSongPlays} />
        <StatTile label="Bustouts" value={stats.bustouts.length} />
      </div>

      {overlayLoading ? (
        <Card className="flex items-center gap-2 p-4">
          <Loader2 className="h-4 w-4 animate-spin text-brand-primary" aria-hidden />
          <span className="text-sm font-semibold text-content-secondary">
            Stacking your picks…
          </span>
        </Card>
      ) : overlay ? (
        <Card className="space-y-2 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-brand-primary">
            Your picks this tour
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-slate-100 sm:grid-cols-4">
            <span>{overlay.showsPicked} shows</span>
            <span>
              {overlay.slotsCorrect}/{overlay.slotsFilled} correct
            </span>
            <span>{overlay.bustoutHits} bustout hits</span>
            <span>{overlay.topSongOverlap} in top songs</span>
          </div>
        </Card>
      ) : null}

      <Card className="space-y-3 p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-content-secondary">
          Most played
        </p>
        {stats.topSongs.length === 0 ? (
          <p className="text-sm text-content-secondary">No setlist songs yet.</p>
        ) : (
          <ol className="space-y-1.5">
            {stats.topSongs.map((row, idx) => (
              <li
                key={row.title}
                className="grid grid-cols-[1.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-sm font-semibold text-slate-100"
              >
                <span className="tabular-nums text-content-secondary">{idx + 1}</span>
                <span className="min-w-0 truncate">{row.title}</span>
                <span className="justify-self-end tabular-nums text-content-secondary">
                  ×{row.timesPlayed}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-content-secondary">
          Bustouts
        </p>
        {stats.bustouts.length === 0 ? (
          <p className="text-sm text-content-secondary">No bustouts frozen yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {stats.bustouts.map((row) => (
              <li
                key={`${row.showDate}-${row.title}`}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-sm font-semibold text-slate-100"
              >
                <span className="min-w-0 truncate">{row.title}</span>
                <span className="tabular-nums text-content-secondary">{row.showDate}</span>
                <span className="tabular-nums text-orange-200">
                  {row.gap != null ? row.gap : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] font-semibold text-content-secondary">
          Bustout = pre-show gap ≥ {BUSTOUT_MIN_GAP}.
        </p>
      </Card>

      {stats.gapHighlights.length > 0 ? (
        <Card className="space-y-3 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-content-secondary">
            High gaps (non-bustout)
          </p>
          <ul className="space-y-1.5">
            {stats.gapHighlights.map((row) => (
              <li
                key={`${row.showDate}-${row.title}`}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-sm font-semibold text-slate-100"
              >
                <span className="min-w-0 truncate">{row.title}</span>
                <span className="tabular-nums text-content-secondary">{row.showDate}</span>
                <span className="tabular-nums text-content-secondary">{row.gap}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <Card className="flex flex-col gap-1 p-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-wider text-content-secondary">
        {label}
      </p>
      <p className="text-2xl font-black tabular-nums text-brand-primary">{value}</p>
    </Card>
  );
}
