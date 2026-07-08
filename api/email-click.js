/**
 * Email CTA click-through — `click.setlistpickem.com` (host rewrite in vercel.json).
 *
 * Rewritten as `/api/email-click?path=dashboard/picks&tid=...` from the click host.
 */

import { buildEmailClickRedirectUrl, normalizeDestinationPath } from '../comms/emailLinks.cjs';

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end('Method Not Allowed');
  }

  const rawPath = req.query.path;
  const pathString = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath || '').trim();
  const destinationPath = pathString ? `/${pathString.replace(/^\/+/, '')}` : '/dashboard';
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
