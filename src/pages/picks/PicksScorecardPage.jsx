import React from 'react';
import { useOutletContext } from 'react-router-dom';

import { PicksScorecardCard, usePicksScorecard } from '../../features/picks';

/**
 * Picks cluster — Scorecard (`/dashboard/picks/scorecard`).
 * Show-scoped via the global date picker; metrics live in the feature hook.
 */
export default function PicksScorecardPage({ user: userProp, selectedDate: selectedDateProp }) {
  const outlet = useOutletContext() || {};
  const user = userProp ?? outlet.user;
  const selectedDate = selectedDateProp ?? outlet.selectedDate;
  const scorecard = usePicksScorecard({
    user,
    selectedDate,
    picksForm: outlet.picksForm,
    artifact: outlet.pickRecommendationsArtifact,
  });

  return <PicksScorecardCard {...scorecard} />;
}
