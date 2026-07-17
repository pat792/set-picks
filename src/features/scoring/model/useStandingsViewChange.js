import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ga4Event } from '../../../shared/lib/ga4';
import { buildStandingsViewPath } from './standingsViewPath';
import { DEFAULT_STANDINGS_VIEW, STANDINGS_VIEWS } from './useStandingsView';

/**
 * Cross-route Standings IA toggle (#555).
 *
 * Show / Tour / Pools stay on `/dashboard/standings` (delegating to the
 * in-page `setPathView` when already there — that path owns GA4). Stats
 * navigates to `/dashboard/tour-stats`. Preserves `?tour=` across Tour ↔ Stats.
 *
 * @param {{
 *   view: 'show' | 'tour' | 'pools' | 'stats',
 *   setPathView?: (next: 'show' | 'tour' | 'pools') => void,
 * }} options
 */
export function useStandingsViewChange({ view, setPathView }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return useCallback(
    (nextView) => {
      const normalized =
        typeof nextView === 'string' && STANDINGS_VIEWS.includes(nextView)
          ? nextView
          : DEFAULT_STANDINGS_VIEW;
      if (normalized === view) return;

      const tourKey = searchParams.get('tour') || '';
      const poolId = searchParams.get('pool') || '';

      if (normalized === 'stats' || view === 'stats') {
        ga4Event('standings_view_change', { from: view, to: normalized });
        navigate(
          buildStandingsViewPath(normalized, {
            tourKey:
              normalized === 'tour' || normalized === 'stats' ? tourKey : '',
            poolId: normalized === 'pools' ? poolId : '',
          }),
        );
        return;
      }

      if (typeof setPathView === 'function') {
        setPathView(normalized);
        return;
      }

      ga4Event('standings_view_change', { from: view, to: normalized });
      navigate(
        buildStandingsViewPath(normalized, {
          tourKey: normalized === 'tour' ? tourKey : '',
          poolId: normalized === 'pools' ? poolId : '',
        }),
      );
    },
    [navigate, searchParams, setPathView, view],
  );
}
