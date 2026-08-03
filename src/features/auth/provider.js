/**
 * Narrow auth public surface for app boot (#731).
 * Importing from `features/auth` root pulls splash/modals into the entry graph;
 * boot only needs the provider.
 */
export { AuthProvider, useAuth } from './model/AuthContext.jsx';
