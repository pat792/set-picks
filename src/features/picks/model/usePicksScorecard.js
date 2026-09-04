import { useEffect, useMemo, useRef } from 'react';

import { PICKS_CLUSTER_PATHS } from '../../../shared/config/dashboardRoutes';
import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import { showOptionLabelCompact } from '../../../shared/utils/showOptionLabel';
import { computeStandingsSelfRecap, useStandings } from '../../scoring';
import { useShowCalendar } from '../../show-calendar';
import { computeScorecardOverlap } from './computeScorecardOverlap';
import { hasNonEmptyPicksObject } from './pickSubmission';
import {
  trackScorecardMetricImpression,
  trackScorecardOpen,
} from './picksAnalytics';
import {
  resolveScorecardState,
  scorecardShowsOverlap,
  scorecardShowsRank,
} from './resolveScorecardState';
import { selectScorecardOdds } from './selectScorecardOdds';
import usePicksForm from './usePicksForm';
import { usePickRecommendations } from './usePickRecommendations';

/**
 * Picks → Scorecard screen hook (#767). Global + show-scoped via the date
 * picker. Overlap is post-lock only. Odds come from Storage
 * `pick-recommendations.json` (`playProbBySong` when present; omit if
 * missing or for another night). Rank/score reuse the show-scoped
 * standings query — no extra collections.
 *
 * @param {{
 *   user: { uid?: string } | null | undefined,
 *   selectedDate: string | undefined,
 *   picksForm?: ReturnType<typeof usePicksForm>,
 * }} args
 */
export function usePicksScorecard({ user, selectedDate, picksForm: picksFormProp }) {
  const { showDates, showDatesByTour } = useShowCalendar();
  const localForm = usePicksForm({
    user: picksFormProp ? null : user,
    selectedDate: picksFormProp ? '' : selectedDate,
    showDates,
    showDatesByTour,
  });
  const {
    formData,
    isLocked,
    isLoadingPicks,
  } = picksFormProp ?? localForm;

  const { picks, actualSetlist, loading: standingsLoading } = useStandings(
    selectedDate,
    showDates,
  );
  const { artifact } = usePickRecommendations({ enabled: true });

  const hasPicks = hasNonEmptyPicksObject(formData);
  const hasSetlist = Boolean(actualSetlist);
  const state = resolveScorecardState({ hasPicks, isLocked, hasSetlist });
  const showOverlap = scorecardShowsOverlap(state);
  const showRank = scorecardShowsRank(state);
  const isLoading = Boolean(isLoadingPicks || (selectedDate && standingsLoading));

  const recap = useMemo(
    () => computeStandingsSelfRecap(picks, actualSetlist, user?.uid),
    [picks, actualSetlist, user?.uid],
  );

  const overlapRows = useMemo(
    () => (showOverlap ? computeScorecardOverlap(picks, user?.uid, formData) : []),
    [showOverlap, picks, user?.uid, formData],
  );

  const oddsRows = useMemo(
    () => selectScorecardOdds(artifact, selectedDate, formData),
    [artifact, selectedDate, formData],
  );

  const overlapBySlot = useMemo(() => {
    /** @type {Record<string, number>} */
    const map = {};
    for (const row of overlapRows) {
      map[row.fieldId] = row.alsoPickedCount;
    }
    return map;
  }, [overlapRows]);

  const oddsBySlot = useMemo(() => {
    /** @type {Record<string, { playProb: number | null, unknown: boolean }>} */
    const map = {};
    if (!oddsRows) return map;
    for (const row of oddsRows) {
      map[row.fieldId] = { playProb: row.playProb, unknown: Boolean(row.unknown) };
    }
    return map;
  }, [oddsRows]);

  const slots = useMemo(
    () =>
      FORM_FIELDS.map((field) => {
        const song = String(formData?.[field.id] ?? '').trim();
        const odds = oddsBySlot[field.id];
        return {
          fieldId: field.id,
          label: field.label,
          song,
          alsoPickedCount: showOverlap ? overlapBySlot[field.id] ?? 0 : null,
          playProb: odds?.playProb ?? null,
          oddsUnknown: Boolean(odds?.unknown),
        };
      }).filter((slot) => slot.song),
    [formData, showOverlap, overlapBySlot, oddsBySlot],
  );

  const show = selectedDate ? showDates?.find((s) => s.date === selectedDate) : null;
  const showLabel = show ? showOptionLabelCompact(show) : selectedDate || '';

  const standingsTo = selectedDate
    ? `/dashboard/standings?showDate=${encodeURIComponent(selectedDate)}`
    : '/dashboard/standings';

  const openKeyRef = useRef('');
  useEffect(() => {
    if (!selectedDate || isLoading) return;
    const key = `${selectedDate}:${state}`;
    if (openKeyRef.current === key) return;
    openKeyRef.current = key;
    trackScorecardOpen({ show_date: selectedDate, lock_state: state });
  }, [selectedDate, state, isLoading]);

  const impressedRef = useRef(/** @type {Set<string>} */ (new Set()));
  useEffect(() => {
    if (!selectedDate || isLoading) return;
    const mark = (metric, visible) => {
      if (!visible) return;
      const key = `${selectedDate}:${metric}`;
      if (impressedRef.current.has(key)) return;
      impressedRef.current.add(key);
      trackScorecardMetricImpression({ show_date: selectedDate, metric });
    };
    mark('overlap', showOverlap);
    mark('odds', Boolean(oddsRows));
    mark('rank', showRank);
  }, [selectedDate, isLoading, showOverlap, oddsRows, showRank]);

  return {
    isLoading,
    state,
    showLabel,
    slots,
    showOverlap,
    showOdds: Boolean(oddsRows),
    showRank,
    recap,
    standingsTo,
    makePicksTo: PICKS_CLUSTER_PATHS.makePicks,
  };
}
