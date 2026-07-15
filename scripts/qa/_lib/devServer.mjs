/**
 * Shared `npm run dev` lifecycle for auth-scenario QA (localhost App Check debug).
 */

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';

const DEV_PORT = 5173;
const READY_TIMEOUT_MS = 60_000;
const READY_POLL_INTERVAL_MS = 250;

/**
 * @param {string} url
 */
async function waitForReady(url) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch {
      // keep polling
    }
    await sleep(READY_POLL_INTERVAL_MS);
  }
  throw new Error(`[scripts/qa] dev server not ready at ${url} within ${READY_TIMEOUT_MS}ms`);
}

/**
 * @param {string} [origin] — override, e.g. http://localhost:5173 when user already runs dev
 * @returns {Promise<{ url: string, kill: () => Promise<void>, spawned: boolean }>}
 */
export async function startDev(origin) {
  const url = (origin || process.env.QA_DEV_ORIGIN || `http://localhost:${DEV_PORT}`).replace(
    /\/$/,
    '',
  );

  try {
    const res = await fetch(url, { method: 'GET' });
    if (res.ok) {
      return { url, spawned: false, kill: async () => {} };
    }
  } catch {
    // spawn below
  }

  const proc = spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  let exited = false;
  proc.on('exit', () => {
    exited = true;
  });

  const exitPromise = once(proc, 'exit').then(([code]) => {
    throw new Error(`[scripts/qa] dev server exited with code ${code}`);
  });

  await Promise.race([waitForReady(url), exitPromise]);

  const kill = async () => {
    if (exited) return;
    proc.kill('SIGTERM');
    await Promise.race([once(proc, 'exit'), sleep(2_000)]);
    if (!exited) proc.kill('SIGKILL');
  };

  return { url, spawned: true, kill };
}
