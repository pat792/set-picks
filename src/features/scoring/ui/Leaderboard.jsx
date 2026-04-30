import React from 'react';
import { useLeaderboard } from '../model/useLeaderboard';
import LeaderboardList from './LeaderboardList';

const Leaderboard = ({
  poolPicks = [],
  actualSetlist = null,
  title,
  headerEnd = null,
  selfUserId = null,
  suppressLeadingCallout = false,
  redactOpponentPicksPreLock = false,
}) => {
  const { sortedPicks, getPickPayload, expandedUser, toggleUserExpansion } = useLeaderboard(
    poolPicks,
    actualSetlist,
    { selfUserId }
  );

  return (
    <LeaderboardList
      sortedPicks={sortedPicks}
      actualSetlist={actualSetlist}
      expandedUser={expandedUser}
      onToggle={toggleUserExpansion}
      getPickPayload={getPickPayload}
      title={title}
      headerEnd={headerEnd}
      selfUserId={selfUserId}
      suppressLeadingCallout={suppressLeadingCallout}
      redactOpponentPicksPreLock={redactOpponentPicksPreLock}
    />
  );
};

export default Leaderboard;
