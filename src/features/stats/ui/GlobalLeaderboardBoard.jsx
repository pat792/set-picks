import React from 'react';

import PlayerHandleLink from '../../../shared/ui/PlayerHandleLink';
import { formatBoardValue } from '../model/globalLeaderboardRanking';

const rankBadgeClass = (rank, outsideTop) => {
  if (outsideTop) return 'bg-surface-inset text-content-secondary ring-1 ring-border-muted';
  if (rank === 1) return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40';
  if (rank === 2)
    return 'bg-brand-accent-blue/15 text-blue-200 ring-1 ring-brand-accent-blue/35';
  if (rank === 3) return 'bg-orange-900/40 text-orange-200 ring-1 ring-orange-700/40';
  return 'bg-surface-inset text-slate-300 ring-1 ring-border-muted';
};

/**
 * @param {{
 *   title: string,
 *   boardKey: 'pointsPerShow' | 'pickingAverage' | 'shows',
 *   rows: Array<{
 *     uid: string,
 *     handle: string,
 *     value: number | null,
 *     shows: number,
 *     rank: number | null,
 *     isSelf?: boolean,
 *     outsideTop?: boolean,
 *   }>,
 * }} props
 */
export default function GlobalLeaderboardBoard({ title, boardKey, rows }) {
  const list = Array.isArray(rows) ? rows : [];

  return (
    <section aria-label={title} className="space-y-2">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-content-secondary">
        {title}
      </h3>
      {list.length === 0 ? (
        <p className="text-sm text-content-secondary">
          No ranked players yet. Boards refresh after each score rollup.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {list.map((row) => {
            const rankLabel = row.outsideTop
              ? '50+'
              : row.rank != null
                ? String(row.rank)
                : '—';
            return (
              <li
                key={`${row.uid}-${row.outsideTop ? 'you' : 'rank'}`}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                  row.isSelf
                    ? 'border-brand-primary/45 bg-brand-primary/10'
                    : 'border-border-subtle/30 bg-surface-panel/80'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black tabular-nums ${rankBadgeClass(
                      row.rank,
                      row.outsideTop
                    )}`}
                    aria-label={
                      row.outsideTop
                        ? 'Outside top 50'
                        : `Rank ${rankLabel}`
                    }
                  >
                    {rankLabel}
                  </span>
                  <PlayerHandleLink
                    userId={row.uid}
                    handle={row.handle}
                    className="truncate text-sm"
                  />
                  {row.isSelf ? (
                    <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-brand-primary">
                      You
                    </span>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black tabular-nums text-white">
                    {formatBoardValue(boardKey, row.value)}
                  </p>
                  {boardKey !== 'shows' ? (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                      {row.shows} {row.shows === 1 ? 'show' : 'shows'}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
