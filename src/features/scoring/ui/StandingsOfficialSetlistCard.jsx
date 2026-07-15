import React from 'react';
import { ChevronDown, ExternalLink, ListMusic } from 'lucide-react';

import Card from '../../../shared/ui/Card';
import { buildPhishNetSetlistUrl } from '../model/buildPhishNetSetlistUrl';
import { groupOfficialSetlistBySet } from '../model/groupOfficialSetlistBySet';
import OfficialPickSlotsGrid from './OfficialPickSlotsGrid';

function SetSongList({ label, songs }) {
  if (!songs.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-brand-primary">
        {label}
      </p>
      <ol className="space-y-1">
        {songs.map((title, idx) => (
          <li
            key={`${label}-${idx}-${title}`}
            className="flex gap-2 text-sm font-bold leading-snug text-slate-100"
          >
            <span className="w-5 shrink-0 tabular-nums text-content-secondary">
              {idx + 1}.
            </span>
            <span className="min-w-0">{title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Collapsible live / official setlist + official pick-slot board for Standings (#552).
 * Presentational only — consumes `actualSetlist` already loaded by `useStandings`.
 *
 * @param {object} props
 * @param {object} props.actualSetlist
 * @param {string} [props.showDate] — YYYY-MM-DD for Phish.net setlist link
 * @param {string} [props.showLabel]
 * @param {string} [props.showStatus] — NEXT | LIVE | PAST | FUTURE
 * @param {string} [props.className]
 */
export default function StandingsOfficialSetlistCard({
  actualSetlist,
  showDate = '',
  showLabel = '',
  showStatus = '',
  className = '',
}) {
  const grouped = groupOfficialSetlistBySet(actualSetlist);

  if (!actualSetlist || (!grouped.hasSongs && !grouped.hasOfficialSlots)) {
    return null;
  }

  const isLive = showStatus === 'LIVE';
  const statusLabel = isLive ? 'Live' : showStatus === 'PAST' ? 'Final' : 'Official';
  const phishNetHref = buildPhishNetSetlistUrl(showDate);

  return (
    <Card
      as="section"
      variant="default"
      padding="sm"
      className={`mb-3 md:p-5 ${className}`.trim()}
    >
      <details className="group" defaultOpen={isLive}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <ListMusic
                className="h-4 w-4 shrink-0 text-brand-primary"
                aria-hidden
              />
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                Setlist
              </p>
              <span
                className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                  isLive
                    ? 'border-brand-primary/40 bg-brand-primary/15 text-brand-primary'
                    : 'border-border-subtle bg-surface-inset text-content-secondary'
                }`}
              >
                {statusLabel}
              </span>
            </div>
            {showLabel ? (
              <p className="truncate font-display text-base font-bold text-white sm:text-lg">
                {showLabel}
              </p>
            ) : (
              <p className="font-display text-base font-bold text-white sm:text-lg">
                Official setlist
              </p>
            )}
          </div>
          <ChevronDown
            className="mt-1 h-5 w-5 shrink-0 text-content-secondary transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>

        <div className="mt-4 space-y-5 border-t border-border-subtle pt-4">
          {grouped.hasSongs ? (
            <div className="space-y-4">
              <SetSongList label="Set 1" songs={grouped.set1} />
              <SetSongList label="Set 2" songs={grouped.set2} />
              <SetSongList label="Encore" songs={grouped.encore} />
            </div>
          ) : (
            <p className="text-sm font-bold text-content-secondary">
              Slot picks are in — full song order lands as the setlist builds.
            </p>
          )}

          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-content-secondary">
              Official pick slots
            </p>
            <OfficialPickSlotsGrid actualSetlist={actualSetlist} />
          </div>

          <p className="text-xs font-semibold leading-relaxed text-content-secondary">
            Setlist data courtesy of Phish.net.{' '}
            <a
              href={phishNetHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-teal-300 underline decoration-teal-500/50 underline-offset-2 hover:text-white hover:decoration-teal-300"
            >
              See more show details on Phish.net
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        </div>
      </details>
    </Card>
  );
}
