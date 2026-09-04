import React, { useState } from 'react';

import { ProfileSelfStatsPanel } from '../../profile';
import { useStandingsTourSelection } from '../../scoring';
import { TourStatsSelfOverlay, useTourStatsScreen } from '../../tour-stats';
import { useShowCalendar } from '../../show-calendar';
import StatsScopeToggle from './StatsScopeToggle';

const SCOPE_ITEMS = [
  { id: 'allTime', label: 'All-time' },
  { id: 'tour', label: 'This tour' },
];

const PERSONAL_CARD_ITEMS = [
  { id: 'stats', label: 'Your stats' },
  { id: 'picks', label: 'Top picks' },
];

/**
 * Personal Stats (#1004): All-time / This tour tray. All-time stays mounted.
 *
 * @param {{ user?: { uid?: string } | null }} props
 */
export default function PersonalStatsScreen({ user }) {
  const [scope, setScope] = useState('allTime');
  const [personalCard, setPersonalCard] = useState('stats');
  const { showDatesByTour, loading: calendarLoading } = useShowCalendar();
  const { selectedTour } = useStandingsTourSelection(showDatesByTour);
  const screen = useTourStatsScreen({
    selectedTour,
    calendarLoading,
    includeSelfOverlay: true,
  });

  return (
    <div className="space-y-4">
      <StatsScopeToggle
        ariaLabel="Personal stats scope"
        value={scope}
        onChange={setScope}
        items={SCOPE_ITEMS}
        hint="All-time is every show you've played. This tour uses the picker above."
        hintLabel="Personal stats scope"
      />

      <div hidden={scope !== 'allTime'}>
        <StatsScopeToggle
          ariaLabel="All-time personal cards"
          value={personalCard}
          onChange={setPersonalCard}
          items={PERSONAL_CARD_ITEMS}
        />
        <div className="mt-3">
          <ProfileSelfStatsPanel uid={user?.uid} section={personalCard} />
        </div>
      </div>

      <div hidden={scope !== 'tour'}>
        <TourStatsSelfOverlay
          overlay={screen.overlay}
          overlayLoading={screen.overlayLoading}
          calendarLoading={screen.calendarLoading}
          setlistLoading={screen.setlistLoading}
          hasTour={screen.hasTour}
          setlistError={screen.setlistError}
          showEmpty
        />
      </div>
    </div>
  );
}
