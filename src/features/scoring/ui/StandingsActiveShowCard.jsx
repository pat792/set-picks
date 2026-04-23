import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Loader2, Pencil } from 'lucide-react';

import Button from '../../../shared/ui/Button';
import Card from '../../../shared/ui/Card';

/**
 * "Tonight's show / make picks" surface for the Standings page Show view
 * (#255). Mirrors `PoolHubActiveShow`'s pre-lock branches — "Make picks"
 * when not secured, "You're in / edit until showtime" when secured — but
 * intentionally omits the `isLocked` / "View show standings" branch
 * because this card only renders while the pick window is open; once the
 * show locks, the leaderboard itself is the primary surface and this
 * card is hidden by the page.
 *
 * Routes to `/dashboard` (Picks tab) so users land on the editable form.
 *
 * @param {Object} props
 * @param {string} props.showLabel — venue + date for the selected show
 * @param {boolean} props.isShowToday — selectedDate === today
 * @param {boolean} props.isSecured — user has submitted non-empty picks
 * @param {boolean} [props.picksStatusLoading] — avoids flashing "no picks" before Firestore resolves
 */
export default function StandingsActiveShowCard({
  showLabel,
  isShowToday,
  isSecured,
  picksStatusLoading = false,
}) {
  const navigate = useNavigate();

  let eyebrow;
  let bodyLine;

  if (picksStatusLoading) {
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
    <Card as="section" variant="venue" padding="sm" className="md:p-6">
      <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
            {eyebrow}
          </p>
          {showLabel ? (
            <p className="font-display text-lg font-bold leading-snug text-white md:text-xl">
              <span className="text-brand-primary">{showLabel}</span>
            </p>
          ) : null}
          {picksStatusLoading ? (
            <p className="flex items-center gap-2 text-sm font-bold text-content-secondary">
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin text-content-secondary"
                aria-hidden
              />
              {bodyLine}
            </p>
          ) : (
            <p className="text-sm font-bold text-content-secondary">{bodyLine}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {picksStatusLoading ? (
            <div
              className="flex h-11 w-full min-w-[12rem] items-center justify-center rounded-xl border border-border-subtle bg-surface-field sm:w-auto"
              aria-busy="true"
              aria-label="Loading picks status"
            >
              <Loader2 className="h-5 w-5 animate-spin text-content-secondary" />
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
