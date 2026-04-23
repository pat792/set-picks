import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Canonical standings view ids (#255). Keep aligned with
 * `dashboardPageMeta.js` (which hides the date picker when `view=tour`)
 * and `scripts/verify-dashboard-meta.mjs`.
 */
export const STANDINGS_VIEWS = Object.freeze(['show', 'tour', 'pools']);

/** Default view when the URL has no `?view` query. */
export const DEFAULT_STANDINGS_VIEW = 'show';

function isKnownView(v) {
  return typeof v === 'string' && STANDINGS_VIEWS.includes(v);
}

/**
 * Pure normalizer: anything unrecognized falls back to the default
 * view so a stale bookmark (`?view=season`, `?view=`, etc.) still
 * renders something sensible rather than an empty tab panel.
 */
export function normalizeView(raw) {
  return isKnownView(raw) ? raw : DEFAULT_STANDINGS_VIEW;
}

/**
 * Pure read-side derivation of `(view, poolId)` from the current URL
 * query + the user's pools. Exercised directly in unit tests; the
 * hook below layers URL-sync side effects on top.
 *
 * @param {{
 *   view?: string | null | undefined,
 *   pool?: string | null | undefined,
 * }} query
 * @param {Array<{ id: string }> | null | undefined} userPools
 */
export function deriveStandingsView(query, userPools) {
  const view = normalizeView(query?.view);
  const rawPool = typeof query?.pool === 'string' ? query.pool : '';
  if (view !== 'pools' || !rawPool) {
    return { view, poolId: null };
  }
  const found = (userPools || []).some(
    (p) => p && typeof p.id === 'string' && p.id === rawPool,
  );
  return { view, poolId: found ? rawPool : null };
}

/**
 * URL-synced state for the standings top-level pill toggle.
 *
 * Owns the `?view=show|tour|pools` and `?pool=<id>` query params so
 * `useDisplayedPicks` can stay a pure derivation and the page can stay
 * declarative. Handles:
 *
 *   1. **Deep-link from pool details** — `navTargetPoolId` (passed through
 *      `location.state.targetPoolId` when jumping from pool details) wins
 *      once on mount; flips `view=pools` + selects that pool and writes
 *      the canonical URL shape.
 *   2. **Legacy `?poolId=<id>`** from the old `useDisplayedPicks` URL
 *      contract — migrated one-shot to `?view=pools&pool=<id>` so old
 *      bookmarks still land on the right surface.
 *   3. **Invalid pool ids** — if `?pool=<id>` doesn't match any of the
 *      user's pools (race after leaving a pool, stale bookmark), we fall
 *      back to the default view and clear the query rather than render
 *      an empty leaderboard.
 *
 * @param {{
 *   userPools?: Array<{ id: string, name?: string, members?: string[] }> | null,
 *   navTargetPoolId?: string | null | undefined,
 * }} options
 */
export function useStandingsView({ userPools, navTargetPoolId } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkConsumedRef = useRef(false);
  const legacyMigrationConsumedRef = useRef(false);

  const rawView = searchParams.get('view');
  const rawPool = searchParams.get('pool') || '';
  const rawLegacyPoolId = searchParams.get('poolId') || '';

  const poolsById = useMemo(() => {
    const map = new Map();
    (userPools || []).forEach((p) => {
      if (p && typeof p.id === 'string') map.set(p.id, p);
    });
    return map;
  }, [userPools]);

  const { view, poolId } = deriveStandingsView(
    { view: rawView, pool: rawPool },
    userPools,
  );

  // One-shot: promote `location.state.targetPoolId` (coming from pool
  // details CTA) over whatever the URL says.
  useEffect(() => {
    if (deepLinkConsumedRef.current) return;
    const target = typeof navTargetPoolId === 'string' ? navTargetPoolId.trim() : '';
    if (!target) return;
    if (!poolsById.has(target)) return;
    deepLinkConsumedRef.current = true;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('view', 'pools');
        next.set('pool', target);
        next.delete('poolId');
        return next;
      },
      { replace: true },
    );
  }, [navTargetPoolId, poolsById, setSearchParams]);

  // Legacy migration: `?poolId=<id>` (pre-#255) → `?view=pools&pool=<id>`.
  useEffect(() => {
    if (legacyMigrationConsumedRef.current) return;
    if (!rawLegacyPoolId.trim()) return;
    if (rawView) {
      // The user already landed on a modern URL — just drop the stray
      // `poolId` query so it stops confusing the selector.
      legacyMigrationConsumedRef.current = true;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('poolId');
          return next;
        },
        { replace: true },
      );
      return;
    }
    const legacyId = rawLegacyPoolId.trim();
    legacyMigrationConsumedRef.current = true;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('view', 'pools');
        if (poolsById.has(legacyId)) {
          next.set('pool', legacyId);
        } else {
          next.delete('pool');
        }
        next.delete('poolId');
        return next;
      },
      { replace: true },
    );
  }, [rawLegacyPoolId, rawView, poolsById, setSearchParams]);

  // Self-heal: `?view=pools&pool=<unknown>` → drop to default.
  useEffect(() => {
    if (view !== 'pools') return;
    if (!rawPool) return;
    if (poolsById.has(rawPool)) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('pool');
        return next;
      },
      { replace: true },
    );
  }, [view, rawPool, poolsById, setSearchParams]);

  const setView = useCallback(
    (nextView) => {
      const normalized = normalizeView(nextView);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (normalized === DEFAULT_STANDINGS_VIEW) {
            next.delete('view');
          } else {
            next.set('view', normalized);
          }
          if (normalized !== 'pools') {
            next.delete('pool');
          }
          next.delete('poolId');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPoolId = useCallback(
    (id) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('view', 'pools');
          if (typeof id === 'string' && id.trim()) {
            next.set('pool', id.trim());
          } else {
            next.delete('pool');
          }
          next.delete('poolId');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { view, poolId, setView, setPoolId };
}
