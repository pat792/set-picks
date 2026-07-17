import React, { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

import { useNextShowPicksStatus } from '../../features/picks';
import {
  PoolJoinCreateCard,
  PoolsHowItWorksBody,
  PoolsHowItWorksMenu,
  PoolsMobileFixedChrome,
  UserPoolsSection,
  useUserPools,
} from '../../features/pools';
import { useShowCalendar } from '../../features/show-calendar';
import { useDashboardMobileChromePortal } from '../../shared/hooks/useDashboardMobileChromePortal';
import DashboardActionRow from '../../shared/ui/DashboardActionRow';
import DashboardRowPill from '../../shared/ui/DashboardRowPill';
import { getNextShow } from '../../shared/utils/timeLogic.js';

export default function Pools({ user }) {
  const { showDates } = useShowCalendar();
  const { pools, loading, error, handleJoin, handleCreate } = useUserPools(
    user?.uid,
    { showDates }
  );
  const nextShowDate = getNextShow(showDates).date;
  const {
    hasSubmittedPicksForNextShow,
    loading: picksStatusLoading,
    error: picksStatusError,
  } = useNextShowPicksStatus(nextShowDate);
  const isSecured = picksStatusLoading
    ? false
    : picksStatusError
      ? false
      : hasSubmittedPicksForNextShow;
  const mobileChromeRoot = useDashboardMobileChromePortal();
  const howItWorksContentId = useId();
  const [isHowItWorksExpanded, setIsHowItWorksExpanded] = useState(false);

  return (
    <div className="w-full pb-6 md:pb-12">
      {mobileChromeRoot
        ? createPortal(
            <PoolsMobileFixedChrome
              isHowItWorksExpanded={isHowItWorksExpanded}
              onToggleHowItWorks={() => setIsHowItWorksExpanded((prev) => !prev)}
              howItWorksContentId={howItWorksContentId}
            />,
            mobileChromeRoot,
          )
        : null}

      <div className="mb-8 hidden md:block">
        <DashboardActionRow>
          <PoolsHowItWorksMenu
            leading={
              <DashboardRowPill as={Link} to="/dashboard" tone="accent">
                <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                Go to Picks
              </DashboardRowPill>
            }
          />
        </DashboardActionRow>
      </div>

      <div
        id={howItWorksContentId}
        className={isHowItWorksExpanded ? 'mb-6 md:hidden' : 'hidden'}
      >
        <PoolsHowItWorksBody />
      </div>

      <div className="space-y-8">
        <UserPoolsSection
          pools={pools}
          hasPicksForNextShow={isSecured}
          picksStatusLoading={picksStatusLoading}
        />
        <PoolJoinCreateCard
          loading={loading}
          error={error}
          onJoin={handleJoin}
          onCreate={handleCreate}
        />
      </div>
    </div>
  );
}
