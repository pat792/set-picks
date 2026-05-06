/**
 * Shared `vite build && vite preview` lifecycle for QA runners (#251).
 *
 * Why this lives in a shared helper:
 *   - Both runners need the same artifact: a fresh production build,
 *     served on a throwaway port, torn down deterministically. Copying
 *     the spawn/teardown logic between runners would drift over time.
 *   - The preview server is the only difference vs. a Vercel preview
 *     URL (no deployment-protection 401, same vite-built dist/). That
 *     makes it the right local stand-in for cache-headers / chunk-graph
 *     / Firestore-cache recipes — see `.cursor/skills/pr-qa/recipes.md`.
 *
 * Why not just use a fixed port:
 *   - Multiple runners shouldn't collide. Each picks an ephemeral port
 *     and announces it via stdout, just like `vite preview --port 0`
 *     would — except vite doesn't actually accept `--port 0`, so we
 *     pick from a small high-numbered range and retry on conflict.
 */

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';

const READY_TIMEOUT_MS = 60_000;
const READY_POLL_INTERVAL_MS = 250;

/**
 * Run `npm run build` synchronously. Surfaces build errors immediately
 * so the runner doesn't waste time launching a browser against stale
 * dist/ contents.
 *
 * @returns {Promise<void>}
 */
async function runBuild() {
  const proc = spawn('npm', ['run', 'build'], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  const [code] = await once(proc, 'exit');
  if (code !== 0) {
    throw new Error(`[scripts/qa] npm run build exited with code ${code}`);
  }
}

/**
 * Pick a high-numbered port in the user-private range, far away from
 * vite's 4173 default and the dev server's 5173 to avoid collisions
 * with humans running both.
 */
function pickPort() {
  const RANGE_START = 14_173;
  const RANGE_END = 14_273;
  return (
    RANGE_START + Math.floor(Math.random() * (RANGE_END - RANGE_START + 1))
  );
}

/**
 * Poll the preview URL until it responds with 200 or we time out. Vite
 * preview prints "Local: http://..." early but the HTTP server isn't
 * always immediately reachable; polling is more robust than parsing
 * stdout.
 *
 * @param {string} url
 */
async function waitForReady(url) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch {
      // Connection refused / DNS / etc. — keep polling.
    }
    await sleep(READY_POLL_INTERVAL_MS);
  }
  throw new Error(
    `[scripts/qa] vite preview did not become ready at ${url} within ` +
      `${READY_TIMEOUT_MS}ms.`,
  );
}

/**
 * Build and start `vite preview` on a throwaway port.
 *
 * @returns {Promise<{ url: string, kill: () => Promise<void> }>}
 */
export async function startPreview() {
  await runBuild();

  const port = pickPort();
  const url = `http://localhost:${port}`;

  // `--strictPort` makes vite fail fast on conflict instead of silently
  // picking another port (which would invalidate `url`). If we collide,
  // bubble up — the runner can be retried.
  const proc = spawn(
    'npm',
    ['run', 'preview', '--', '--port', String(port), '--strictPort'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let exited = false;
  proc.on('exit', () => {
    exited = true;
  });

  // Race readiness vs. early exit so a bind failure surfaces fast.
  const exitPromise = once(proc, 'exit').then(([code]) => {
    throw new Error(
      `[scripts/qa] vite preview exited unexpectedly with code ${code} ` +
        `before becoming ready on ${url}.`,
    );
  });

  await Promise.race([waitForReady(url), exitPromise]);

  const kill = async () => {
    if (exited) return;
    proc.kill('SIGTERM');
    // Give vite a moment to release the port; if it's still alive
    // after 2s, hard-kill so we don't leak processes.
    await Promise.race([once(proc, 'exit'), sleep(2_000)]);
    if (!exited) proc.kill('SIGKILL');
  };

  // Clean up on process exit signals (Ctrl-C, kill, uncaught throw).
  // Without this, a runner crash leaves vite preview holding the port.
  const onSignal = () => {
    void kill();
  };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);
  process.once('exit', onSignal);

  return { url, kill };
}
