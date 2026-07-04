import React, { createContext, useContext } from 'react';

import { useAuthState } from './useAuthState';

const AuthContext = createContext(null);

/**
 * Single auth session for the SPA. Mount once near the root so Firebase
 * auth/profile listeners are not duplicated on every `useAuth()` consumer
 * (Safari was opening multiple WebChannel streams and stalling profile nav).
 */
export function AuthProvider({ children }) {
  const value = useAuthState();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
