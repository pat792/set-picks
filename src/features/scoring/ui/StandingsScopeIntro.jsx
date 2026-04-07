import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Home, MoreHorizontal, Scale, Users } from 'lucide-react';

import DashboardActionRow from '../../../shared/ui/DashboardActionRow';
import GhostPill from '../../../shared/ui/GhostPill';

const MOBILE_VISIBLE_ACTIONS = 2;

function StandingsTopActions({
  isEveryone,
  onOpenPoolHub,
  onOpenScoringRules,
}) {
  const items = [
    <Link
      key="pools"
      to="/dashboard/pools"
      className="inline-flex items-center gap-2 rounded-full border border-border-subtle/35 bg-surface-inset px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-colors hover:border-border-venue/55 hover:bg-indigo-900/45 hover:text-emerald-300 sm:px-4"
    >
      <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
      Pools
    </Link>,
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
            <summary
              className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-border-subtle/35 bg-surface-panel px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-indigo-900/45 hover:text-teal-300 [&::-webkit-details-marker]:hidden"
              aria-label="More standings actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden />
              More
              <ChevronDown
                className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="absolute right-0 top-full z-20 mt-1 flex min-w-[11rem] flex-col gap-2 rounded-xl border border-border-subtle/35 bg-surface-panel-strong p-2 shadow-xl">
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
      <span className="text-slate-500">
        {' '}
        — all players who picked this show. Under Compare, pick a pool to see just that group.
      </span>
    </>
  ) : (
    <>
      <span className="text-slate-300">{showLabel}</span>
      {' · '}
      <span className="font-semibold text-slate-300">{poolName || 'This pool'}</span>
      <span className="text-slate-500">
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

      <details className="group rounded-xl border border-border-subtle/35 bg-surface-inset">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 transition-colors hover:text-slate-300 [&::-webkit-details-marker]:hidden">
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
          How scoring & pools work
        </summary>
        <div className="border-t border-border-subtle/30 px-3 py-3 text-sm leading-relaxed text-slate-400">
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
