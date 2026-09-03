import React from 'react';
import { useOutletContext } from 'react-router-dom';

import { ProfileSelfStatsPanel } from '../../features/profile';

/**
 * Stats cluster — Personal Stats (`/dashboard/stats` and `/dashboard/stats/personal`).
 * Career-scoped self averages + heatmap (#553 / #554); no global date picker.
 */
export default function PersonalStatsPage({ user: userProp }) {
  const outlet = useOutletContext();
  const user = userProp ?? outlet?.user;

  return <ProfileSelfStatsPanel uid={user?.uid} />;
}
