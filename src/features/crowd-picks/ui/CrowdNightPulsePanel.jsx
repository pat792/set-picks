import React from 'react';
import { ChevronDown, Lock } from 'lucide-react';

/**
 * Crowd pulse summary + expandable deep analysis (C4 prototype).
 * Pre-lock (NEXT): top multi-picker songs stay visible; gap / vintage /
 * leaders blur until showtime. Presentational — data from `useCrowdNightStats`.
 *
 * @param {object} props
 * @param {import('../model/aggregateCrowdNightSongs').CrowdNightSongStats | null} props.night
 * @param {{ pickers: number, uniqueSongs: number, topMulti: Array<{ title: string, cardCount: number, pctOfPickers: number }> } | null} props.card
 * @param {{ highestGap: Array<{ title: string, gap: number, cardCount: number }>, vintage: { avgYear: number | null, medianYear: number | null, coveragePct: number, datedSlots: number, totalSlots: number } } | null} props.catalog
 * @param {{ lockedInLabel: string, leaders: Array<{ rank: number, handle: string, totalPoints: number }>, songs: Array<{ title: string, cardCount: number, amongLeaders: string[] }> } | null} props.leaders
 * @param {boolean} [props.catalogLoading]
 * @param {boolean} [props.blurDeepStats] — true while picks still editable (NEXT)
 * @param {string} [props.className]
 */
export default function CrowdNightPulsePanel({
  night,
  card,
  catalog,
  leaders,
  catalogLoading = false,
  blurDeepStats = false,
  className = '',
}) {
  if (!card || !night || night.pickers === 0) {
    return (
      <section
        className={`rounded-xl border border-border-subtle bg-surface-panel/60 px-3.5 py-3 ${className}`}
        aria-label="Crowd pulse"
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-content-secondary">
          Crowd pulse · prototype
        </p>
        <p className="mt-1 text-[11px] font-medium text-content-secondary md:text-xs">
          No submitted picks for this show yet.
        </p>
      </section>
    );
  }

  const vintageLabel =
    catalog?.vintage?.avgYear != null
      ? `~${Math.round(catalog.vintage.avgYear)}`
      : catalogLoading
        ? '…'
        : '—';

  const maxCards = card.topMulti.reduce(
    (m, s) => Math.max(m, s.cardCount),
    0
  );

  return (
    <section
      className={`rounded-xl border border-border-subtle bg-surface-panel/60 px-3.5 py-3 md:px-4 md:py-3.5 ${className}`}
      aria-label="Crowd pulse"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
          Crowd pulse · prototype
        </p>
        <p className="text-[10px] font-semibold text-content-secondary">
          {card.pickers} pickers · {card.uniqueSongs} songs
        </p>
      </div>

      {card.topMulti.length > 0 ? (
        <ul className="mt-2.5 space-y-2">
          {card.topMulti.map((s) => {
            const intensity =
              maxCards > 0 ? Math.max(0.12, s.cardCount / maxCards) : 0.12;
            return (
              <li key={s.title}>
                <div className="flex items-baseline justify-between gap-3 text-[11px] md:text-xs">
                  <span className="min-w-0 truncate font-semibold text-white">
                    {s.title}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-content-secondary">
                    {s.cardCount} · {s.pctOfPickers}%
                  </span>
                </div>
                <div
                  className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-field"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-primary/90 to-brand-primary/40"
                    style={{ width: `${Math.round(intensity * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-[11px] text-content-secondary">
          No multi-picker songs yet (everyone unique).
        </p>
      )}

      <details className="group mt-3 border-t border-border-subtle pt-2">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest text-content-secondary transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-1.5">
            Full crowd stats
            {blurDeepStats ? (
              <Lock className="h-3 w-3 shrink-0" aria-hidden />
            ) : null}
          </span>
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>

        <div className="relative mt-3 min-h-[7rem]">
          {blurDeepStats ? (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 rounded-lg px-3 text-center"
              role="status"
            >
              <p className="text-[11px] font-bold text-white md:text-xs">
                Unlocks at showtime
              </p>
              <p className="max-w-[16rem] text-[10px] font-medium text-content-secondary">
                Gap, vintage, and tour leaders stay private until picks lock
              </p>
            </div>
          ) : null}

          <div
            className={`space-y-4 text-[11px] md:text-xs ${
              blurDeepStats
                ? 'pointer-events-none select-none blur-sm'
                : ''
            }`}
            aria-hidden={blurDeepStats || undefined}
          >
            <div>
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-content-secondary">
                Multi-picker songs
              </p>
              <CrowdTable
                headers={['Song', 'Cards', '%']}
                rows={night.multiPickerSongs.slice(0, 20).map((s) => [
                  s.title,
                  String(s.cardCount),
                  `${s.pctOfPickers}%`,
                ])}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-content-secondary">
                Highest gap (top 10)
              </p>
              {catalogLoading && !catalog?.highestGap?.length ? (
                <p className="text-content-secondary">Loading catalog…</p>
              ) : (
                <CrowdTable
                  headers={['Song', 'Gap', 'Cards']}
                  rows={(catalog?.highestGap || []).map((s) => [
                    s.title,
                    String(s.gap),
                    String(s.cardCount),
                  ])}
                />
              )}
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-content-secondary">
                Vintage (slot-weighted)
              </p>
              <p className="font-medium text-white">
                Mean debut {vintageLabel}
                {catalog?.vintage?.medianYear != null
                  ? ` · median ${Math.round(catalog.vintage.medianYear)}`
                  : ''}
              </p>
              <p className="mt-0.5 text-content-secondary">
                Coverage {catalog?.vintage?.coveragePct ?? 0}% (
                {catalog?.vintage?.datedSlots ?? 0}/
                {catalog?.vintage?.totalSlots ?? 0} slots)
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-content-secondary">
                Tour leaders tonight ({leaders?.lockedInLabel || '0/5'})
              </p>
              {leaders?.leaders?.length ? (
                <ol className="mb-2 space-y-0.5 text-content-secondary">
                  {leaders.leaders.map((l) => (
                    <li key={l.uid || l.rank}>
                      #{l.rank}{' '}
                      <span className="font-semibold text-white">{l.handle}</span>
                      {typeof l.totalPoints === 'number'
                        ? ` · ${l.totalPoints} pts`
                        : ''}
                    </li>
                  ))}
                </ol>
              ) : null}
              <CrowdTable
                headers={['Song', 'Among top 5', 'Who']}
                rows={(leaders?.songs || []).slice(0, 12).map((s) => [
                  s.title,
                  String(s.cardCount),
                  (s.amongLeaders || []).join(', '),
                ])}
              />
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}

/**
 * @param {{ headers: string[], rows: string[][] }} props
 */
function CrowdTable({ headers, rows }) {
  if (!rows.length) {
    return <p className="text-content-secondary">None yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[16rem] border-collapse text-left">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-content-secondary">
            {headers.map((h) => (
              <th key={h} className="pb-1 pr-2 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row[0]}-${i}`} className="border-t border-border-subtle/60">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`py-1 pr-2 align-top ${
                    j === 0 ? 'font-semibold text-white' : 'text-content-secondary'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
