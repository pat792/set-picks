import React, { useEffect, useRef } from 'react';
import { ChevronDown, Lock, Radio } from 'lucide-react';

import {
  DASHBOARD_CARD_BODY,
  DASHBOARD_CARD_CHEVRON,
  DASHBOARD_CARD_EYEBROW,
  DASHBOARD_CARD_EYEBROW_ICON,
  DASHBOARD_CARD_L2_MIN_H,
  DASHBOARD_CARD_PAD,
  DASHBOARD_CARD_RADIUS,
} from '../../../shared/ui/dashboardCardClasses';
import {
  trackCrowdPulseFullExpand,
  trackCrowdPulseSectionOpen,
  trackCrowdPulseView,
} from '../model/crowdPulseAnalytics';
import CrowdPulseTopTable from './CrowdPulseTopTable';

/**
 * Crowd pulse summary + expandable deep analysis (#694 ship).
 * Collapsed by default to match sibling Standings card heights: the summary
 * row teases the leading multi-picker song; expanding reveals the top table
 * and the "Full crowd stats" disclosure.
 * Pre-lock (NEXT): top multi-picker songs stay visible; gap / vintage /
 * leaders blur until showtime. Presentational — data from `useCrowdNightStats`.
 *
 * @param {object} props
 * @param {string} [props.showDate]
 * @param {import('../model/aggregateCrowdNightSongs').CrowdNightSongStats & {
 *   multiPickerFull?: Array<{
 *     title: string,
 *     cardCount: number,
 *     pctOfPickers: number,
 *     gap?: number | null,
 *     last?: string | null,
 *   }>
 * } | null} props.night
 * @param {{ pickers: number, uniqueSongs: number, topMulti: Array<{ title: string, cardCount: number, pctOfPickers: number, gap?: number | null, last?: string | null }> } | null} props.card
 * @param {{ highestGap: Array<{ title: string, cardCount: number, pctOfPickers?: number, gap: number, last?: string | null }>, vintage: { avgYear: number | null, medianYear: number | null, coveragePct: number, datedSlots: number, totalSlots: number } } | null} props.catalog
 * @param {{ lockedInLabel: string, leaders: Array<{ rank: number, handle: string, totalPoints: number }>, songs: Array<{ title: string, cardCount: number, subtitle?: string | null, gap?: number | null, last?: string | null }> } | null} props.leaders
 * @param {boolean} [props.catalogLoading]
 * @param {boolean} [props.blurDeepStats] — true while picks still editable (NEXT)
 * @param {Set<string> | null} [props.playedTitles] — official setlist hits (LIVE + PAST)
 * @param {string} [props.className]
 */
export default function CrowdNightPulsePanel({
  showDate = '',
  night,
  card,
  catalog,
  leaders,
  catalogLoading = false,
  blurDeepStats = false,
  playedTitles = null,
  className = '',
}) {
  const pickers =
    card && night && night.pickers > 0 ? card.pickers : 0;

  useCrowdPulseViewTelemetry(showDate, blurDeepStats, pickers);

  if (!card || !night || night.pickers === 0) {
    return (
      <section
        className={`flex ${DASHBOARD_CARD_L2_MIN_H} flex-col justify-center ${DASHBOARD_CARD_RADIUS} border border-border-subtle bg-surface-panel/60 ${DASHBOARD_CARD_PAD} ${className}`}
        aria-label="Crowd pulse"
      >
        <p
          className={`inline-flex items-center gap-1.5 ${DASHBOARD_CARD_EYEBROW} text-content-secondary`}
        >
          <Radio className={DASHBOARD_CARD_EYEBROW_ICON} aria-hidden />
          Crowd pulse
        </p>
        <p className={`mt-1 ${DASHBOARD_CARD_BODY}`}>
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

  const multiFull = night.multiPickerFull || night.multiPickerSongs || [];
  const showPlayedLegend =
    playedTitles instanceof Set && playedTitles.size > 0;

  const onFullToggle = (event) => {
    if (event.currentTarget.open) {
      trackCrowdPulseFullExpand({ show_date: showDate || '' });
    }
  };

  const onPanelToggle = (event) => {
    if (event.currentTarget.open) {
      trackCrowdPulseSectionOpen({
        show_date: showDate || '',
        section: 'top_songs',
      });
    }
  };

  const topSong = card.topMulti[0] || null;
  const teaser = topSong
    ? `“${topSong.title}” leads on ${topSong.cardCount} cards`
    : 'No multi-picker songs yet (everyone unique).';

  return (
    <section
      className={`flex ${DASHBOARD_CARD_L2_MIN_H} flex-col justify-center ${DASHBOARD_CARD_RADIUS} border border-border-subtle bg-surface-panel/60 ${DASHBOARD_CARD_PAD} ${className}`}
      aria-label="Crowd pulse"
    >
      <details className="group/pulse" onToggle={onPanelToggle}>
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`inline-flex items-center gap-1.5 ${DASHBOARD_CARD_EYEBROW} text-brand-primary transition-colors group-hover/pulse:text-brand-primary-strong`}
            >
              <Radio className={DASHBOARD_CARD_EYEBROW_ICON} aria-hidden />
              Crowd pulse
            </p>
            <p className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-content-secondary">
              {card.pickers} pickers · {card.uniqueSongs} songs
              <ChevronDown
                className={`${DASHBOARD_CARD_CHEVRON} group-open/pulse:rotate-180`}
                aria-hidden
              />
            </p>
          </div>
          {/* Full-width row so long song titles get the whole card width. */}
          <p className={`mt-0.5 truncate ${DASHBOARD_CARD_BODY}`}>{teaser}</p>
        </summary>

        {showPlayedLegend ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-content-secondary">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-brand-primary/80"
              aria-hidden
            />
            Highlight = played in setlist
          </p>
        ) : null}

        {card.topMulti.length > 0 ? (
          <CrowdPulseTopTable
            rows={card.topMulti}
            playedTitles={playedTitles}
            catalogLoading={catalogLoading}
          />
        ) : (
          <p className="mt-2 text-[11px] text-content-secondary">
            No multi-picker songs yet (everyone unique).
          </p>
        )}

        <details
          className="group mt-3 border-t border-border-subtle pt-2"
          onToggle={onFullToggle}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary transition-colors hover:text-brand-primary-strong [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1.5">
              Full crowd stats
              {blurDeepStats ? (
                <Lock className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
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
                  Full tables, vintage, and tour leaders stay private until
                  picks lock
                </p>
              </div>
            ) : null}

            <div
              className={`space-y-2 ${
                blurDeepStats
                  ? 'pointer-events-none select-none blur-sm'
                  : ''
              }`}
              aria-hidden={blurDeepStats || undefined}
            >
              <CrowdDeepSection
                title="Multi-picker songs"
                subtitle="Every song on 2+ cards tonight"
                sectionId="multi_picker"
                showDate={showDate}
              >
                <CrowdPulseTopTable
                  rows={multiFull}
                  playedTitles={playedTitles}
                  catalogLoading={catalogLoading}
                  className=""
                />
              </CrowdDeepSection>

              <CrowdDeepSection
                title="Highest gaps"
                subtitle="Top 10 picks by pre-show gap"
                sectionId="highest_gaps"
                showDate={showDate}
              >
                {catalogLoading && !catalog?.highestGap?.length ? (
                  <p className="text-[11px] text-content-secondary md:text-xs">
                    Loading catalog…
                  </p>
                ) : (
                  <CrowdPulseTopTable
                    rows={catalog?.highestGap || []}
                    playedTitles={playedTitles}
                    catalogLoading={catalogLoading}
                    className=""
                  />
                )}
              </CrowdDeepSection>

              <CrowdDeepSection
                title="Crowd vintage"
                subtitle="Slot-weighted debut years across all picks"
                sectionId="vintage"
                showDate={showDate}
              >
                <p className="text-[12px] font-semibold text-white md:text-sm">
                  Mean debut {vintageLabel}
                  {catalog?.vintage?.medianYear != null
                    ? ` · median ${Math.round(catalog.vintage.medianYear)}`
                    : ''}
                </p>
                <p className="mt-1 text-[10px] font-medium text-content-secondary md:text-[11px]">
                  Coverage {catalog?.vintage?.coveragePct ?? 0}% (
                  {catalog?.vintage?.datedSlots ?? 0}/
                  {catalog?.vintage?.totalSlots ?? 0} slots)
                </p>
              </CrowdDeepSection>

              <CrowdDeepSection
                title="Songs from top tour leaders"
                subtitle="What the tour top 5 locked in tonight"
                sectionId="leaders"
                showDate={showDate}
              >
                <CrowdPulseTopTable
                  rows={leaders?.songs || []}
                  playedTitles={playedTitles}
                  catalogLoading={catalogLoading}
                  countHeader="Among"
                  className=""
                />
              </CrowdDeepSection>
            </div>
          </div>
        </details>
      </details>
    </section>
  );
}

/**
 * @param {string} showDate
 * @param {boolean} blurDeepStats
 * @param {number} pickers
 */
function useCrowdPulseViewTelemetry(showDate, blurDeepStats, pickers) {
  const viewLoggedRef = useRef('');
  useEffect(() => {
    if (!showDate) return;
    const deep_stats = blurDeepStats ? 'locked' : 'open';
    const sig = `${showDate}|${deep_stats}|${pickers}`;
    if (viewLoggedRef.current === sig) return;
    viewLoggedRef.current = sig;
    trackCrowdPulseView({
      show_date: showDate,
      deep_stats,
      pickers,
    });
  }, [showDate, blurDeepStats, pickers]);
}

/**
 * Independently expandable deep-stats card.
 *
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   sectionId: string,
 *   showDate?: string,
 *   children: React.ReactNode,
 *   defaultOpen?: boolean,
 * }} props
 */
function CrowdDeepSection({
  title,
  subtitle,
  sectionId,
  showDate = '',
  children,
  defaultOpen = false,
}) {
  const onToggle = (event) => {
    if (event.currentTarget.open) {
      trackCrowdPulseSectionOpen({
        show_date: showDate || '',
        section: sectionId,
      });
    }
  };

  return (
    <details
      className="group/deep rounded-lg border border-border-subtle/70 bg-brand-bg/35 open:bg-brand-bg/50"
      open={defaultOpen || undefined}
      onToggle={onToggle}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-2 px-2.5 py-2 transition-colors hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-snug text-white md:text-[13px]">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 text-[10px] font-medium leading-snug text-content-secondary md:text-[11px]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <ChevronDown
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-content-secondary transition-transform group-open/deep:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-border-subtle/50 px-2.5 pb-2.5 pt-2">
        {children}
      </div>
    </details>
  );
}
