/**
 * Email CTA click-through — `click.setlistpickem.com` (host rewrite in vercel.json).
 *
 * Logs-friendly 302 to www with UTM params so GA4 can attribute email CTA taps.
 * Service email HTML exposes only this link in the body (wordmark is decorative).
 */

import { buildEmailClickRedirectUrl, normalizeDestinationPath } from '../../comms/emailLinks.cjs';

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end('Method Not Allowed');
  }

  const segments = req.query.path;
  const parts = Array.isArray(segments) ? segments : segments ? [segments] : [];
  const destinationPath = parts.length ? `/${parts.join('/')}` : '/dashboard';
  const normalized = normalizeDestinationPath(destinationPath);
  if (!normalized) {
    return res.status(400).send('Invalid destination');
  }

  const { path: _path, ...trackingQuery } = req.query;
  const redirectUrl = buildEmailClickRedirectUrl(normalized, trackingQuery);

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method === 'HEAD') {
    res.setHeader('Location', redirectUrl);
    return res.status(302).end();
  }
  return res.redirect(302, redirectUrl);
}
