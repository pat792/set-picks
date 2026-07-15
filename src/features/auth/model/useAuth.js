/**
 * Session-scoped auth hook — thin re-export of `AuthContext` (#496).
 * A single `AuthProvider` owns the Firebase auth + profile listeners.
 */
export { useAuth } from './AuthContext.jsx';
