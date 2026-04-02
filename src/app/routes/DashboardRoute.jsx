import React from 'react';
import { Navigate } from 'react-router-dom';

import { AuthLoadingScreen, useAuth } from '../../features/auth';

import DashboardLayout from '../layout/DashboardLayout';

export default function DashboardRoute() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!userProfile) {
    return <Navigate to="/setup" replace />;
  }

  return <DashboardLayout />;
}
