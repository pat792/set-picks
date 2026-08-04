import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Paths that must boot the authenticated SPA document (`app.html`) in dev (#832). */
const APP_DOCUMENT_PATH_PREFIXES = [
  '/login',
  '/dashboard',
  '/setup',
  '/tour-stats',
  '/user/',
  '/password-reset-complete',
  '/privacy',
  '/terms',
  '/join',
  '/invite/',
  '/comms-preview',
];

function isAppDocumentPath(pathname) {
  if (!pathname || pathname === '/') return false;
  return APP_DOCUMENT_PATH_PREFIXES.some((prefix) => {
    if (prefix.endsWith('/')) return pathname.startsWith(prefix);
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

function appDocumentDevMiddleware() {
  return {
    name: 'app-document-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url || '';
        const pathname = raw.split('?')[0];
        if (pathname === '/app.html' || pathname.startsWith('/src/') || pathname.startsWith('/@') || pathname.startsWith('/node_modules') || pathname.startsWith('/assets') || pathname.startsWith('/branding') || pathname.startsWith('/fonts') || pathname.startsWith('/favicon')) {
          next();
          return;
        }
        if (isAppDocumentPath(pathname)) {
          req.url = `/app.html${raw.includes('?') ? `?${raw.split('?')[1]}` : ''}`;
        }
        next();
      });
    },
  };
}

// Group third-party modules into stable, cacheable chunks. Returning `undefined`
// for anything outside `node_modules` preserves Vite's automatic per-route
// splitting introduced in #240 — do NOT bundle app code here.
function manualChunks(id) {
  const normalized = id.replace(/\\/g, '/');
  if (!normalized.includes('/node_modules/')) return undefined;

  // Firebase ships as `firebase/<subpath>` wrappers that re-export from
  // `@firebase/<subpath>` internals. Match both so all Firebase code lands
  // in a firebase-* chunk (keeps #242's lazy-init story stable).
  const fbMatch = normalized.match(
    /\/node_modules\/(?:@firebase|firebase)\/([^/]+)/
  );
  if (fbMatch) {
    const sub = fbMatch[1];
    if (sub.startsWith('app-check')) return 'firebase-appcheck';
    if (sub.startsWith('storage')) return 'firebase-storage';
    return 'firebase-core';
  }

  // Path-segment match supports scoped packages (@tanstack/react-query).
  const pkgMatch = normalized.match(/\/node_modules\/((?:@[^/]+\/)?[^/]+)/);
  if (!pkgMatch) return undefined;
  const pkg = pkgMatch[1];

  if (pkg === '@tanstack/react-query') return 'vendor-react-query';
  if (pkg === 'lucide-react') return 'vendor-icons';

  // Exact-name set avoids the `react` naively matching `react-query` /
  // `react-helmet-async` / `react-ga4` classes of bug.
  const reactPkgs = new Set([
    'react',
    'react-dom',
    'react-router',
    'react-router-dom',
    'react-helmet-async',
    'react-ga4',
    'scheduler',
  ]);
  if (reactPkgs.has(pkg)) return 'vendor-react';

  return undefined;
}

export default defineConfig({
  base: '/',
  plugins: [react(), appDocumentDevMiddleware()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'api/**/*.test.js'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        // Named `marketing` so built HTML references `/assets/marketing-*.js` (#832).
        marketing: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'app.html'),
      },
      output: {
        manualChunks,
      },
    },
  },
});
