import React from 'react';
import { AdminForm } from '../../features/admin';

export default function AdminPage({ user, selectedDate }) {
  return <AdminForm user={user} selectedDate={selectedDate} />;
}
