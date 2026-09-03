import React from 'react';
import { useOutletContext } from 'react-router-dom';

import { PicksLabPanel } from '../../features/picks';

/**
 * Picks cluster — Picks Lab destination (`/dashboard/picks/lab`).
 */
export default function PicksLabPage({ user: userProp, selectedDate: selectedDateProp }) {
  const outlet = useOutletContext() || {};
  const user = userProp ?? outlet.user;
  const selectedDate = selectedDateProp ?? outlet.selectedDate;

  return (
    <PicksLabPanel
      user={user}
      selectedDate={selectedDate}
      picksForm={outlet.picksForm}
    />
  );
}
