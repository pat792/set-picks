/**
 * Public site origin for absolute URLs (invite links, etc.).
 */
export function getPublicAppBaseUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  const fromEnv = import.meta.env?.VITE_PUBLIC_APP_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  return '';
}
