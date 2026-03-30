import React from 'react';
import { useLeaderboard } from './model/useLeaderboard';
import LeaderboardList from './ui/LeaderboardList';

const Leaderboard = ({ poolPicks = [], actualSetlist = null }) => {
  const { sortedPicks, getPickPayload, expandedUser, toggleUserExpansion } = useLeaderboard(
    poolPicks,
    actualSetlist
  );

  return (
    <LeaderboardList
      sortedPicks={sortedPicks}
      actualSetlist={actualSetlist}
      expandedUser={expandedUser}
      onToggle={toggleUserExpansion}
      getPickPayload={getPickPayload}
    />
  );
};

export default Leaderboard;