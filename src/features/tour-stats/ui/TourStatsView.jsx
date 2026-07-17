import React from 'react';
import { Loader2 } from 'lucide-react';

import Card from '../../../shared/ui/Card';
import InfoTooltip, {
  InfoTooltipProvider,
} from '../../../shared/ui/InfoTooltip';
import { SCORING_RULES } from '../../../shared/utils/scoring';
import { TOUR_STATS_GAP_HIGHLIGHT_MIN } from '../model/aggregateTourSetlistStats';

const { BUSTOUT_MIN_GAP } = SCORING_RULES;

/** Matches Standings content-box shell (`standingsSurfaceClasses.js`). */
const STANDINGS_CARD_SHELL = '!rounded-xl !p-3.5 md:!p-4';
const STANDINGS_BOX_EYEBROW = 'text-[10px] font-black uppercase tracking-widest';

/** Invisible 3-col grid: # | Song | Plays — fixed tracks keep columns aligned. */
const TOP_SONGS_ROW_GRID =
  'grid grid-cols-[1.5rem_minmax(0,1fr)_3.5rem] items-center gap-x-2 min-h-[1.75rem]';

/** Invisible 3-col grid: Song | Date | Gap. */
const GAP_ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_6.5rem_3rem] items-center gap-x-2 min-h-[1.75rem]';

const COL_HEADER =
  'mb-0.5 border-b border-brand-primary/20 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-300';

const MOST_PLAYED_DEF =
  'Ranked by frequency; songs with the same number of plays this tour are sorted by total # of times played all-time.';

const HIGH_GAPS_DEF = `Gap = shows since last played before that night. Listed when gap ≥ ${TOUR_STATS_GAP_HIGHLIGHT_MIN} and below the bustout threshold.`;

const TILE_DEFS = {
  unique: {
    label: 'Unique songs',
    long: 'Distinct song titles across scored tour dates.',
  },
  played: {
    label: 'Songs played',
    long: 'Total number of songs played in this tour, including repeats.',
  },
  ratio: {
    label: 'Unique ratio',
    long: 'Unique songs ÷ songs played. Higher means more variety relative to volume.',
  },
  bustouts: {
    label: 'Bustouts',
    long: `Songs with a pre-show gap ≥ ${BUSTOUT_MIN_GAP} (Bustout Boost eligible).`,
  },
};

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
 *   onOpenScoringRules?: () => void,
 * }} props
 */
export default function TourStatsView({
  tourName,
  hasTour,
  calendarLoading,
  setlistLoading,
  setlistError,
  stats,
  overlay,
  overlayLoading,
  onOpenScoringRules,
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
      <Card variant="frosted" padding="none" className={STANDINGS_CARD_SHELL}>
        <p className="text-sm font-semibold text-content-secondary">
          No tour is available yet. Tour stats appear once a post-launch tour
          has shows on or before today.
        </p>
      </Card>
    );
  }

  if (setlistError) {
    return (
      <Card variant="danger" padding="none" className={STANDINGS_CARD_SHELL}>
        <p className="text-sm font-semibold text-red-300">
          Couldn’t load tour setlists. Try again in a moment.
        </p>
      </Card>
    );
  }

  return (
    <InfoTooltipProvider>
      <div className="space-y-4">
        <p className="rounded-xl border border-border-subtle/50 bg-surface-panel-strong/60 px-3.5 py-2 text-sm font-bold text-white shadow-inset-glass">
          {tourName ? (
            <>
              <span className="text-brand-primary">{tourName}</span>
              <span className="text-content-secondary"> · </span>
            </>
          ) : null}
          <span className="tabular-nums">
            {stats.showsWithSetlist} of {stats.tourShowCount} tour dates
          </span>
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label={TILE_DEFS.unique.label}
            value={stats.uniqueSongs}
            definition={TILE_DEFS.unique.long}
          />
          <StatTile
            label={TILE_DEFS.played.label}
            value={stats.totalSongPlays}
            definition={TILE_DEFS.played.long}
          />
          <StatTile
            label={TILE_DEFS.ratio.label}
            value={formatUniqueRatio(stats.uniqueSongs, stats.totalSongPlays)}
            definition={TILE_DEFS.ratio.long}
          />
          <StatTile
            label={TILE_DEFS.bustouts.label}
            value={stats.bustouts.length}
            definition={TILE_DEFS.bustouts.long}
            accent="bustout"
          />
        </div>

        {overlayLoading ? (
          <Card
            variant="frosted"
            padding="none"
            className={`${STANDINGS_CARD_SHELL} flex items-center gap-2`}
          >
            <Loader2 className="h-4 w-4 animate-spin text-brand-primary" aria-hidden />
            <span className="text-sm font-semibold text-content-secondary">
              Stacking your picks…
            </span>
          </Card>
        ) : overlay ? (
          <TourStatsSectionCard
            title="Your picks this tour"
            variant="venue"
            headerTone="personal"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 sm:gap-x-6">
              <OverlayStat label="Shows" value={overlay.showsPicked} />
              <OverlayStat
                label="Correct"
                value={`${overlay.slotsCorrect}/${overlay.slotsFilled}`}
              />
              <OverlayStat label="Bustout hits" value={overlay.bustoutHits} />
              <OverlayStat label="In most played" value={overlay.topSongOverlap} />
            </div>
          </TourStatsSectionCard>
        ) : null}

        <TourStatsSectionCard title="Most played" definition={MOST_PLAYED_DEF}>
          {stats.topSongs.length === 0 ? (
            <p className="text-sm text-content-secondary">No setlist songs yet.</p>
          ) : (
            <div>
              <div className={`${TOP_SONGS_ROW_GRID} ${COL_HEADER}`} aria-hidden>
                <span className="tabular-nums">#</span>
                <span>Song</span>
                <span className="justify-self-end">Plays</span>
              </div>
              <ol className="space-y-0.5 text-sm font-semibold text-slate-100">
                {stats.topSongs.map((row, idx) => (
                  <li key={row.title} className={TOP_SONGS_ROW_GRID}>
                    <span className="tabular-nums text-brand-primary/80">{idx + 1}</span>
                    <span className="min-w-0 truncate">{row.title}</span>
                    <span className="justify-self-end tabular-nums text-brand-primary">
                      {row.timesPlayed}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </TourStatsSectionCard>

        <TourStatsSectionCard title="Bustouts" headerTone="bustout">
          {stats.bustouts.length === 0 ? (
            <p className="text-sm text-content-secondary">No bustouts frozen yet.</p>
          ) : (
            <div>
              <div className={`${GAP_ROW_GRID} ${COL_HEADER}`} aria-hidden>
                <span>Song</span>
                <span className="justify-self-end">Date</span>
                <span className="justify-self-end">Gap</span>
              </div>
              <ul className="space-y-0.5 text-sm font-semibold text-slate-100">
                {stats.bustouts.map((row) => (
                  <li
                    key={`${row.showDate}-${row.title}`}
                    className={GAP_ROW_GRID}
                  >
                    <span className="min-w-0 truncate">{row.title}</span>
                    <span className="justify-self-end tabular-nums text-content-secondary">
                      {row.showDate}
                    </span>
                    <span
                      className="justify-self-end tabular-nums font-bold text-amber-200"
                      title={
                        row.gap != null
                          ? `${row.gap} shows since last played (pre-show gap)`
                          : undefined
                      }
                    >
                      {row.gap != null ? row.gap : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 border-t border-border-subtle/40 pt-3 text-[11px] font-semibold leading-relaxed text-content-secondary">
            Gap = shows since last played before that night. Bustout = gap ≥{' '}
            {BUSTOUT_MIN_GAP} (Bustout Boost eligible).
            {typeof onOpenScoringRules === 'function' ? (
              <>
                {' '}
                <button
                  type="button"
                  onClick={onOpenScoringRules}
                  className="text-teal-300 underline decoration-teal-500/50 underline-offset-2 hover:text-white hover:decoration-teal-300"
                >
                  What is a bustout?
                </button>
              </>
            ) : null}
          </p>
        </TourStatsSectionCard>

        {stats.gapHighlights.length > 0 ? (
          <TourStatsSectionCard
            title="High gaps (non-bustout)"
            definition={HIGH_GAPS_DEF}
            headerTone="muted"
          >
            <div>
              <div className={`${GAP_ROW_GRID} ${COL_HEADER}`} aria-hidden>
                <span>Song</span>
                <span className="justify-self-end">Date</span>
                <span className="justify-self-end">Gap</span>
              </div>
              <ul className="space-y-0.5 text-sm font-semibold text-slate-100">
                {stats.gapHighlights.map((row) => (
                  <li
                    key={`${row.showDate}-${row.title}`}
                    className={GAP_ROW_GRID}
                  >
                    <span className="min-w-0 truncate">{row.title}</span>
                    <span className="justify-self-end tabular-nums text-content-secondary">
                      {row.showDate}
                    </span>
                    <span
                      className="justify-self-end tabular-nums text-slate-300"
                      title={`${row.gap} shows since last played (pre-show gap)`}
                    >
                      {row.gap}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </TourStatsSectionCard>
        ) : null}
      </div>
    </InfoTooltipProvider>
  );
}

function formatUniqueRatio(uniqueSongs, songsPlayed) {
  if (!songsPlayed || songsPlayed <= 0) return '—';
  const pct = Math.round((uniqueSongs / songsPlayed) * 100);
  return `${pct}%`;
}

const HEADER_TONE = {
  default: {
    bar: 'border-brand-primary/35 bg-brand-primary/10',
    text: 'text-brand-primary',
  },
  personal: {
    bar: 'border-brand-primary/45 bg-gradient-to-r from-brand-primary/15 to-transparent',
    text: 'text-brand-primary',
  },
  bustout: {
    bar: 'border-amber-500/35 bg-amber-500/10',
    text: 'text-amber-200',
  },
  muted: {
    bar: 'border-brand-accent-blue/30 bg-brand-accent-blue/10',
    text: 'text-blue-200',
  },
};

/**
 * @param {{
 *   title: string,
 *   definition?: string,
 *   headerTone?: keyof typeof HEADER_TONE,
 *   variant?: 'frosted' | 'venue',
 *   children: React.ReactNode,
 * }} props
 */
function TourStatsSectionCard({
  title,
  definition,
  headerTone = 'default',
  variant = 'frosted',
  children,
}) {
  const tone = HEADER_TONE[headerTone] ?? HEADER_TONE.default;

  return (
    <Card variant={variant} padding="none" className={STANDINGS_CARD_SHELL}>
      <div className={`-mx-3.5 -mt-3.5 mb-3 rounded-t-xl border-b px-3.5 py-2.5 md:-mx-4 md:-mt-4 md:px-4 ${tone.bar}`}>
        <div className="flex items-center gap-1">
          <p className={`${STANDINGS_BOX_EYEBROW} ${tone.text}`}>{title}</p>
          {definition ? (
            <InfoTooltip label={title} definition={definition} />
          ) : null}
        </div>
      </div>
      {children}
    </Card>
  );
}

/**
 * @param {{ label: string, value: React.ReactNode }} props
 */
function OverlayStat({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <p className="flex min-h-[2.25rem] w-full items-end justify-center text-[10px] font-black uppercase leading-tight tracking-wider text-brand-primary/90">
        {label}
      </p>
      <p className="mt-1 w-full text-xl font-black tabular-nums text-white sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

/**
 * @param {{
 *   label: string,
 *   value: React.ReactNode,
 *   definition: string,
 *   accent?: 'default' | 'bustout',
 * }} props
 */
function StatTile({ label, value, definition, accent = 'default' }) {
  const isBustout = accent === 'bustout';

  return (
    <Card
      variant="frosted"
      padding="none"
      className={`${STANDINGS_CARD_SHELL} flex flex-col gap-1 text-center`}
    >
      <div
        className={`-mx-3.5 -mt-3.5 mb-1 rounded-t-xl border-b px-2 py-2 md:-mx-4 md:-mt-4 ${
          isBustout
            ? 'border-amber-500/30 bg-amber-500/10'
            : 'border-brand-primary/30 bg-brand-primary/10'
        }`}
      >
        <div className="flex items-start justify-center gap-1">
          <p
            className={`min-w-0 ${STANDINGS_BOX_EYEBROW} ${
              isBustout ? 'text-amber-200' : 'text-brand-primary'
            }`}
          >
            {label}
          </p>
          <InfoTooltip label={label} definition={definition} />
        </div>
      </div>
      <p
        className={`px-2 pb-1 pt-0.5 text-2xl font-black tabular-nums ${
          isBustout ? 'text-amber-200' : 'text-brand-primary'
        }`}
      >
        {value}
      </p>
    </Card>
  );
}
