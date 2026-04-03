import { useAuth } from './useAuth';

/** Public session surface for cross-feature use (user id only). */
export function useAuthSession() {
  const { user } = useAuth();
  return { userId: user?.uid ?? null };
}
