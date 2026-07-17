import React from 'react';

import { useSongCatalog } from '../../song-catalog';
import {
  buildDebutYearBySongName,
  computeAvgCorrectPicksPerShow,
  computeAvgPointsPerShow,
  computeAvgSongVintage,
  formatAvgCorrectPicksPerShow,
  formatAvgPointsPerShow,
  formatAvgSongVintage,
} from '../model/profileAverages';
import { useProfilePickHeatmap } from '../model/useProfilePickHeatmap';
import { useUserSeasonStats } from '../model/useUserSeasonStats';
import TopPicksFrequencyStrip from './TopPicksFrequencyStrip';

/**
 * Self-Profile stats: season averages + top-picks frequency strip (#553 / #554).
 * Heatmap is self-only (live-compute); public profile stays on the lighter strip.
 *
 * @param {{ uid?: string }} props
 */
export default function ProfileSelfStatsPanel({ uid }) {
  const { stats, loading: statsLoading } = useUserSeasonStats(uid);
  const heatmap = useProfilePickHeatmap(uid, { enabled: Boolean(uid) });
  const { songs } = useSongCatalog();

  const debutMap = buildDebutYearBySongName(songs);
  const vintage = computeAvgSongVintage(heatmap.songTitles, debutMap);

  const avgPoints = formatAvgPointsPerShow(computeAvgPointsPerShow(stats));
  const avgCorrect = formatAvgCorrectPicksPerShow(
    computeAvgCorrectPicksPerShow(stats)
  );
  const avgVintage = formatAvgSongVintage(vintage.avgYear);

  const columns = [
    {
      key: 'avgPts',
      label: 'Avg pts / show',
      value: avgPoints,
    },
    {
      key: 'avgCorrect',
      label: 'Avg correct / show',
      value: avgCorrect,
    },
    {
      key: 'vintage',
      label: 'Avg vintage',
      value: avgVintage,
    },
    {
      key: 'shows',
      label: 'Shows',
      value: typeof stats?.shows === 'number' ? stats.shows : 0,
    },
  ];

  if (!uid) return null;

  return (
    <div className="mb-8">
      <section className="rounded-3xl border border-border-subtle bg-surface-panel p-6 shadow-inset-glass">
        <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-content-secondary">
          Your stats
        </h2>
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {columns.map(({ key, label, value }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <p className="flex flex-1 items-end justify-center px-0.5 text-[10px] font-black uppercase leading-snug tracking-wider text-content-secondary">
                {label}
              </p>
              <div className="flex min-h-[3.25rem] items-center justify-center rounded-2xl border border-border-subtle bg-surface-field px-2 py-3">
                <span className="text-2xl font-black tabular-nums leading-none tracking-tight text-brand-primary">
                  {statsLoading && key !== 'vintage' ? '…' : value}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] font-medium leading-relaxed text-content-secondary">
          Career averages across graded nights. Avg correct needs the
          finalize rollup field (shows — until backfilled). Vintage is the
          mean debut year of songs in your recent top-picks window
          {vintage.datedCount > 0
            ? ` (${vintage.datedCount} of ${vintage.uniqueCount} dated)`
            : ''}
          .
        </p>
      </section>

      <TopPicksFrequencyStrip
        rows={heatmap.rows}
        loading={heatmap.loading}
        showsAggregated={heatmap.showsAggregated}
        showsAvailable={heatmap.showsAvailable}
      />
    </div>
  );
}
