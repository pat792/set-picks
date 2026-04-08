import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Home, MoreHorizontal, Scale, Users } from 'lucide-react';

import DashboardActionRow from '../../../shared/ui/DashboardActionRow';
import DashboardRowPill from '../../../shared/ui/DashboardRowPill';
import GhostPill from '../../../shared/ui/GhostPill';

const MOBILE_VISIBLE_ACTIONS = 2;

function StandingsTopActions({
  isEveryone,
  onOpenPoolHub,
  onOpenScoringRules,
}) {
  const items = [
    <DashboardRowPill key="pools" as={Link} to="/dashboard/pools" tone="accent">
      <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
      Pools
    </DashboardRowPill>,
  ];

  if (!isEveryone && onOpenPoolHub) {
    items.push(
      <GhostPill key="pool-hub" type="button" icon={Home} onClick={onOpenPoolHub}>
        Pool details
      </GhostPill>,
    );
  }

  if (onOpenScoringRules) {
    items.push(
      <GhostPill key="scoring-rules" type="button" icon={Scale} onClick={onOpenScoringRules}>
        Scoring rules
      </GhostPill>,
    );
  }

  const overflow = items.length > MOBILE_VISIBLE_ACTIONS ? items.slice(MOBILE_VISIBLE_ACTIONS) : [];
  const mobileHead = items.slice(0, MOBILE_VISIBLE_ACTIONS);

  const overflowMenu = overflow.map((el) =>
    React.cloneElement(el, { key: `${el.key}-menu` }),
  );
  const overflowRow = overflow.map((el) =>
    React.cloneElement(el, { key: `${el.key}-row` }),
  );

  return (
    <>
      {mobileHead}
      {overflow.length > 0 ? (
        <>
          <details className="group relative sm:hidden">
            <DashboardRowPill
              as="summary"
              tone="muted"
              className="list-none"
              aria-label="More standings actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden />
              More
              <ChevronDown
                className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </DashboardRowPill>
            <div className="absolute right-0 top-full z-20 mt-1 flex min-w-[11rem] flex-col gap-2 rounded-xl border border-border-subtle bg-surface-panel-strong p-2 shadow-inset-glass">
              {overflowMenu}
            </div>
          </details>
          <span className="max-sm:hidden sm:contents">{overflowRow}</span>
        </>
      ) : null}
    </>
  );
}

/**
 * Compact standings header: one-line scope + actions; long explanation in a collapsed <details>.
 */
export default function StandingsScopeIntro({
  activeFilter,
  poolName,
  showLabel,
  onOpenPoolHub,
  onOpenScoringRules,
}) {
  const isEveryone = activeFilter === 'global';

  const summaryLine = isEveryone ? (
    <>
      <span className="text-slate-300">{showLabel}</span>
      {' · '}
      <span className="font-semibold text-slate-300">Everyone</span>
      <span className="text-content-secondary">
        {' '}
        — all players who picked this show. Under Compare, pick a pool to see just that group.
      </span>
    </>
  ) : (
    <>
      <span className="text-slate-300">{showLabel}</span>
      {' · '}
      <span className="font-semibold text-slate-300">{poolName || 'This pool'}</span>
      <span className="text-content-secondary">
        {' '}
        — pool members only. Open the Everyone tab to see all players.
      </span>
    </>
  );

  return (
    <div className="mb-4 space-y-2">
      <DashboardActionRow summary={summaryLine}>
        <StandingsTopActions
          isEveryone={isEveryone}
          onOpenPoolHub={onOpenPoolHub}
          onOpenScoringRules={onOpenScoringRules}
        />
      </DashboardActionRow>

      <details className="group rounded-xl border border-border-subtle bg-surface-glass shadow-inset-glass">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-bold text-content-secondary transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
          How scoring & pools work
        </summary>
        <div className="border-t border-border-muted px-3 py-3 text-sm leading-relaxed text-content-secondary">
          {isEveryone ? (
            <p>
              <span className="font-semibold text-slate-200">Show standings</span> are the running
              order of points for <span className="font-semibold text-slate-300">one night</span>{' '}
              only — everyone who locked picks for that date. To see the same night scoped to a
              crew, pick a pool under <span className="font-semibold text-slate-300">Compare</span>.
              (<span className="font-semibold text-slate-300">Pool details</span> has{' '}
              <span className="font-semibold text-slate-300">season totals</span> across many nights
              — different from this screen.)
            </p>
          ) : (
            <p>
              One night of points for{' '}
              <span className="font-semibold text-slate-200">{poolName || 'this pool'}</span> only
              — same idea as Everyone, scoped to the pool. Open{' '}
              <span className="font-semibold text-slate-200">Pool details</span> for invites and
              roster; <span className="font-semibold text-slate-200">Season totals</span> there sum
              points across every graded show in the pool.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
