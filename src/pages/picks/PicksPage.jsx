import React from 'react';
import PicksForm from '../../features/picks/PicksForm';

export default function PicksPage({ user, selectedDate }) {
  return <PicksForm user={user} selectedDate={selectedDate} />;
}
