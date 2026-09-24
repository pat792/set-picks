import React from 'react';
import { useOutletContext } from 'react-router-dom';

import { GlobalStatsScreen } from '../../features/stats';

/**
 * Stats cluster — Global Stats (`/dashboard/stats/global`).
 * Phase 2 leaderboards (#1004). Song explorer lives on Band.
 */
export default function GlobalStatsPage({ user: userProp }) {
  const outlet = useOutletContext();
  const user = userProp ?? outlet?.user;

  return <GlobalStatsScreen user={user} />;
}
