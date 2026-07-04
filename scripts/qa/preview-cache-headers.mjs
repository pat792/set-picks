#!/usr/bin/env node
/**
 * QA runner for `.cursor/skills/pr-qa/recipes.md` §C — cache-control on a
 * **deployed** preview origin (issue #348).
 *
 * `vite preview` does not apply `vercel.json` headers; this script hits the
 * real deployment. When Vercel Deployment Protection is on, set
 * **`QA_VERCEL_PROTECTION_BYPASS`** to the automation secret from Vercel
 * (sent as `x-vercel-protection-bypass`).
 *
 * Env (from `.env.qa.local` or CI):
 *   - **QA_PREVIEW_BASE_URL** — `https://your-preview.vercel.app` (no trailing slash)
 *   - **QA_VERCEL_PROTECTION_BYPASS** — optional; required if previews return 401
 *
 * Exits 0 with SKIP log when `QA_PREVIEW_BASE_URL` is unset (local/optional CI).
 */

/**
 * @param {string | null} value
 */
function normalizeCc(value) {
  return (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * @param {string} baseUrl
 * @param {string} [bypass]
 */
function bypassHeaders(bypass) {
  const h = /** @type {Record<string, string>} */ ({});
  const t = bypass?.trim();
  if (t) h['x-vercel-protection-bypass'] = t;
  return h;
}

/**
 * @param {string} base
 * @param {string} path
 * @param {Record<string, string>} headers
 */
async function fetchPath(base, path, headers) {
  const url = `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { ...headers },
  });
  return res;
}

/**
 * @param {string} html
 * @returns {string | null}
 */
function firstAssetJsPath(html) {
  const m = html.match(/src="(\/assets\/[^"]+\.js)"/);
  return m ? m[1] : null;
}

async function run() {
  const base = process.env.QA_PREVIEW_BASE_URL?.trim();
  if (!base) {
    console.log(
      '[qa:preview-headers] SKIP: QA_PREVIEW_BASE_URL unset. ' +
        'Set it to a Vercel preview origin to assert §C headers. See scripts/qa/README.md.',
    );
    process.exit(0);
  }

  const bypass = process.env.QA_VERCEL_PROTECTION_BYPASS?.trim();
  const headers = bypassHeaders(bypass);

  console.log(`[qa:preview-headers] GET ${base}/ …`);

  const indexRes = await fetchPath(base, '/', headers);
  if (!indexRes.ok) {
    console.error(
      `[qa:preview-headers] FAIL: GET / returned ${indexRes.status}. ` +
        'If the preview uses Deployment Protection, set QA_VERCEL_PROTECTION_BYPASS.',
    );
    process.exit(1);
  }

  const indexCc = normalizeCc(indexRes.headers.get('cache-control'));
  if (
    !indexCc.includes('max-age=0') ||
    !indexCc.includes('must-revalidate')
  ) {
    console.error(
      `[qa:preview-headers] FAIL: HTML cache-control expected max-age=0 + must-revalidate; ` +
        `got: "${indexRes.headers.get('cache-control')}"`,
    );
    process.exit(1);
  }

  // Security headers (#412) — always-on + CSP Report-Only until enforce flip.
  const nosniff = (indexRes.headers.get('x-content-type-options') || '').toLowerCase();
  if (nosniff !== 'nosniff') {
    console.error(
      `[qa:preview-headers] FAIL: expected X-Content-Type-Options: nosniff; ` +
        `got: "${indexRes.headers.get('x-content-type-options')}"`,
    );
    process.exit(1);
  }
  const referrer = (indexRes.headers.get('referrer-policy') || '').toLowerCase();
  if (!referrer.includes('strict-origin-when-cross-origin')) {
    console.error(
      `[qa:preview-headers] FAIL: expected Referrer-Policy strict-origin-when-cross-origin; ` +
        `got: "${indexRes.headers.get('referrer-policy')}"`,
    );
    process.exit(1);
  }
  const cspRo = indexRes.headers.get('content-security-policy-report-only') || '';
  const cspEnforce = indexRes.headers.get('content-security-policy') || '';
  if (!cspRo.includes("default-src 'self'") && !cspEnforce.includes("default-src 'self'")) {
    console.error(
      '[qa:preview-headers] FAIL: expected Content-Security-Policy-Report-Only (or enforce) with default-src \'self\'.',
    );
    process.exit(1);
  }
  if (cspEnforce && !cspRo) {
    console.log(
      '[qa:preview-headers] note: CSP is enforcing (promote-day flip complete).',
    );
  }

  console.log(`[qa:preview-headers] GET ${base}/__/auth/iframe …`);
  const authIframeRes = await fetchPath(base, '/__/auth/iframe', headers);
  if (!authIframeRes.ok) {
    console.error(
      `[qa:preview-headers] FAIL: GET /__/auth/iframe returned ${authIframeRes.status}.`,
    );
    process.exit(1);
  }
  const authFrameOpts = (authIframeRes.headers.get('x-frame-options') || '').toLowerCase();
  if (authFrameOpts === 'deny' || authFrameOpts === 'sameorigin') {
    console.error(
      `[qa:preview-headers] FAIL: /__/auth/iframe must not set X-Frame-Options (breaks Firebase Auth iframe); ` +
        `got: "${authIframeRes.headers.get('x-frame-options')}"`,
    );
    process.exit(1);
  }
  const indexFrameOpts = (indexRes.headers.get('x-frame-options') || '').toLowerCase();
  if (indexFrameOpts !== 'deny') {
    console.error(
      `[qa:preview-headers] FAIL: expected X-Frame-Options: DENY on /; ` +
        `got: "${indexRes.headers.get('x-frame-options')}"`,
    );
    process.exit(1);
  }

  const html = await indexRes.text();
  const assetPath = firstAssetJsPath(html);
  if (!assetPath) {
    console.error(
      '[qa:preview-headers] FAIL: could not find /assets/*.js in index HTML.',
    );
    process.exit(1);
  }

  console.log(`[qa:preview-headers] GET ${base}${assetPath} …`);
  const assetRes = await fetchPath(base, assetPath, headers);
  if (!assetRes.ok) {
    console.error(
      `[qa:preview-headers] FAIL: GET ${assetPath} returned ${assetRes.status}.`,
    );
    process.exit(1);
  }

  const assetCc = normalizeCc(assetRes.headers.get('cache-control'));
  if (
    !assetCc.includes('max-age=31536000') ||
    !assetCc.includes('immutable')
  ) {
    console.error(
      `[qa:preview-headers] FAIL: asset cache-control expected long-cache + immutable; ` +
        `got: "${assetRes.headers.get('cache-control')}"`,
    );
    process.exit(1);
  }

  console.log(
    '[qa:preview-headers] PASS: HTML and /assets/*.js cache-control match recipes.md §C; security headers (#412) present.',
  );
  process.exit(0);
}

run().catch((err) => {
  console.error('[qa:preview-headers] runner crashed:', err);
  process.exit(1);
});
