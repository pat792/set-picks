import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { todayYmd } from '../../../shared/utils/dateUtils';
import { getTourByKey, resolveSelectableTours } from './resolveSelectableTours';

/**
 * URL-synced tour selection for the standings Tour view (#295).
 *
 * Owns the `?tour=<tourKey>` query param so the selected past tour survives
 * navigation and browser refresh. Mirrors the pattern of {@link useStandingsView}:
 *
 *   1. Derive selectable tours via {@link resolveSelectableTours} (post-launch
 *      shows on or before today, sorted newest last-show-date first).
 *   2. Resolve the selected tour from `?tour=` — defaults to the first
 *      selectable tour (current / most-recent) when the param is absent.
 *   3. Self-heal: if `?tour=` holds a key that no longer matches any
 *      selectable tour, drop the param so the URL always reflects reality.
 *
 * The default (first) tour deliberately omits the `?tour=` param from the
 * URL to keep canonical URLs clean — same convention as `?view=show` for
 * {@link useStandingsView}.
 *
 * @param {Array<{ tour: string, shows: Array<{ date: string }> }> | null | undefined} showDatesByTour
 * @returns {{
 *   selectedTour: { tour: string, shows: Array<{ date: string }> } | null,
 *   setTourKey: (tourKey: string) => void,
 *   selectableTours: Array<{ tour: string, shows: Array<{ date: string }> }>,
 * }}
 */
export function useStandingsTourSelection(showDatesByTour) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTour = searchParams.get('tour') || '';

  const selectableTours = resolveSelectableTours(showDatesByTour, todayYmd());

  const found = rawTour ? getTourByKey(selectableTours, rawTour) : null;
  const selectedTour = found ?? selectableTours[0] ?? null;

  // Self-heal: unknown ?tour= key → drop the param
  useEffect(() => {
    if (!rawTour) return;
    const match = getTourByKey(selectableTours, rawTour);
    if (match) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('tour');
        return next;
      },
      { replace: true },
    );
  }, [rawTour, selectableTours, setSearchParams]);

  const setTourKey = useCallback(
    (tourKey) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          // Omit the param when selecting the default (first selectable) tour
          // so canonical URLs stay clean — mirrors how ?view= is omitted for
          // the DEFAULT_STANDINGS_VIEW in useStandingsView.
          const defaultKey = selectableTours[0]?.tour ?? '';
          if (!tourKey || tourKey === defaultKey) {
            next.delete('tour');
          } else {
            next.set('tour', tourKey);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, selectableTours],
  );

  return { selectedTour, setTourKey, selectableTours };
}
