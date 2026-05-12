import { useMemo } from 'react';

import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import {
  computeShowWinnerOfTheNight,
  computeStandingsSelfRecap,
  useStandings,
} from '../../scoring';

function formHasPicks(formData) {
  if (!formData || typeof formData !== 'object') return false;
  return FORM_FIELDS.some((f) => {
    const v = formData[f.id];
    return v != null && String(v).trim() !== '';
  });
}

/**
 * Global-show rank snapshot for the Picks tab (same ordering as Standings).
 *
 * @param {{ user: { uid?: string } | null | undefined, selectedDate: string | undefined, showDates: unknown[], formData: Record<string, unknown> }} args
 */
export function usePicksSelfRecap({ user, selectedDate, showDates, formData }) {
  const { picks, actualSetlist } = useStandings(selectedDate, showDates);

  const recap = useMemo(
    () => computeStandingsSelfRecap(picks, actualSetlist, user?.uid),
    [picks, actualSetlist, user?.uid],
  );

  const shareGradedRecapAllowed = useMemo(() => {
    if (!actualSetlist || !formHasPicks(formData)) return false;
    return !computeShowWinnerOfTheNight(picks).hasUngradedNonEmptyPick;
  }, [actualSetlist, formData, picks]);

  return { recap, shareGradedRecapAllowed, actualSetlist };
}
