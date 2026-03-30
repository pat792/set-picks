import React from 'react';
import AdminForm from '../../features/admin/AdminForm';

export default function AdminPage({ user, selectedDate }) {
  return <AdminForm user={user} selectedDate={selectedDate} />;
}
