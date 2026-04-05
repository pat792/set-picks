import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Loader2, Pencil, Trophy } from 'lucide-react';

import Button from '../../../shared/ui/Button';
import Card from '../../../shared/ui/Card';

/**
 * Prominent “active show” CTA on pool details (above season totals).
 *
 * @param {Object} props
 * @param {string} props.showLabel — e.g. venue + date line for the next pickable show
 * @param {boolean} props.isShowToday — when next pickable show’s calendar date is today
 * @param {boolean} props.isSecured — defensive: false while loading or on fetch error
 * @param {boolean} props.isLocked — show is not in NEXT pick window (LIVE / PAST / FUTURE)
 * @param {string} props.nextShowTimeStatus — from {@link getShowStatus} for LIVE vs PAST copy
 * @param {boolean} [props.picksStatusLoading] — when !isLocked, avoids flashing “no picks” before Firestore resolves
 * @param {string} props.poolId — passed through to Standings via router state
 */
export default function PoolHubActiveShow({
  showLabel,
  isShowToday,
  isSecured,
  isLocked,
  nextShowTimeStatus,
  picksStatusLoading = false,
  poolId,
}) {
  const navigate = useNavigate();

  const lockedEyebrow =
    nextShowTimeStatus === 'LIVE'
      ? 'LIVE NOW'
      : nextShowTimeStatus === 'PAST'
        ? 'PAST SHOW'
        : 'SHOW LOCKED';

  let eyebrow = 'CURRENT SHOW';
  let bodyLine = null;

  if (isLocked) {
    eyebrow = lockedEyebrow;
    bodyLine =
      nextShowTimeStatus === 'PAST'
        ? 'This show has wrapped — see that night’s show standings in the Standings tab (pool filter on).'
        : 'Follow tonight’s show standings with your pool selected in the Standings tab.';
  } else if (picksStatusLoading) {
    eyebrow = isShowToday ? "TONIGHT'S SHOW" : 'NOW PICKING FOR';
    bodyLine = 'Checking your picks for this show…';
  } else if (!isSecured) {
    eyebrow = isShowToday ? "TONIGHT'S SHOW" : 'NOW PICKING FOR';
    bodyLine = isShowToday
      ? "You haven't locked in picks for tonight's show yet."
      : "You haven't locked in picks for this upcoming show yet.";
  } else {
    eyebrow = isShowToday ? "TONIGHT'S SHOW" : 'PICKS SECURED';
    bodyLine = isShowToday
      ? "You're in for tonight — you can still edit on the Picks tab until showtime."
      : "You're in for this show — you can still edit on the Picks tab until showtime.";
  }

  return (
    <Card
      as="section"
      variant="default"
      padding="sm"
      className="border border-emerald-500/30 bg-gradient-to-br from-slate-800/90 to-slate-900/90 shadow-lg shadow-emerald-900/10 md:p-6"
    >
      <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/90">
            {eyebrow}
          </p>
          <p className="font-display text-lg font-bold leading-snug text-white md:text-xl">
            <span className="text-emerald-300/95">{showLabel}</span>
          </p>
          {picksStatusLoading && !isLocked ? (
            <p className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin text-slate-500"
                aria-hidden
              />
              {bodyLine}
            </p>
          ) : bodyLine ? (
            <p className="text-sm font-bold text-slate-400">{bodyLine}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {isLocked ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full min-w-[12rem] sm:w-auto uppercase tracking-widest"
              onClick={() =>
                navigate('/dashboard/standings', {
                  state: { targetPoolId: poolId },
                })
              }
            >
              <Trophy className="mr-2 h-5 w-5 shrink-0" aria-hidden />
              View show standings
            </Button>
          ) : picksStatusLoading ? (
            <div
              className="flex h-11 w-full min-w-[12rem] items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/50 sm:w-auto"
              aria-busy="true"
              aria-label="Loading picks status"
            >
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : !isSecured ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full min-w-[12rem] sm:w-auto uppercase tracking-widest"
              onClick={() => navigate('/dashboard')}
            >
              <ListMusic className="mr-2 h-5 w-5 shrink-0" aria-hidden />
              Make picks
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full min-w-[12rem] sm:w-auto uppercase tracking-widest"
              onClick={() => navigate('/dashboard')}
            >
              <Pencil className="mr-2 h-5 w-5 shrink-0" aria-hidden />
              View / Edit picks
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
