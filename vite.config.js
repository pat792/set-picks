import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

/** Dev-server: serve Firebase app.html for app-only hard opens (#832). */
function appEntryHtmlPlugin() {
  const appPaths = (urlPath) => {
    if (!urlPath) return false;
    const pathOnly = urlPath.split('?')[0];
    return (
      pathOnly === '/login' ||
      pathOnly === '/app.html' ||
      pathOnly === '/setup' ||
      pathOnly === '/password-reset-complete' ||
      pathOnly === '/comms-preview' ||
      pathOnly === '/join' ||
      pathOnly.startsWith('/dashboard') ||
      pathOnly.startsWith('/join/') ||
      pathOnly.startsWith('/invite/') ||
      pathOnly.startsWith('/user/')
    );
  };

  return {
    name: 'app-entry-html',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (appPaths(req.url)) {
          req.url = '/app.html';
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (appPaths(req.url)) {
          req.url = '/app.html';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [react(), appEntryHtmlPlugin()],
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
      // Dual entry (#832): marketing (no Firebase) + app (AuthProvider).
      input: {
        main: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'app.html'),
      },
      output: {
        manualChunks,
      },
    },
  },
});

