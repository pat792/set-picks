import React from 'react';
import { useOutletContext } from 'react-router-dom';

import { PersonalStatsScreen } from '../../features/stats';

/**
 * Stats cluster — Personal Stats (`/dashboard/stats` and `/dashboard/stats/personal`).
 * All-time career block + tour-scoped self rollup (#1004).
 */
export default function PersonalStatsPage({ user: userProp }) {
  const outlet = useOutletContext();
  const user = userProp ?? outlet?.user;

  return <PersonalStatsScreen user={user} />;
}
