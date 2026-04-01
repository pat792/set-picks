import React from 'react';
import { useLeaderboard } from '../model/useLeaderboard';
import LeaderboardList from './LeaderboardList';

const Leaderboard = ({ poolPicks = [], actualSetlist = null, title, headerEnd = null }) => {
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
      title={title}
      headerEnd={headerEnd}
    />
  );
};

export default Leaderboard;
