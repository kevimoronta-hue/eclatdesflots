// api/auth/logout.js
// POST -> clears the session + CSRF cookies. Idempotent.

import { destroySession, getSession, checkCsrf } from '../_lib/auth.js';
import { json, logEvent, clientIp } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Méthode non autorisée.' });
  }
  // CSRF check when a session exists (prevents forced-logout via cross-site POST).
  const session = await getSession(req);
  if (session && !checkCsrf(req)) return json(res, 403, { error: 'Requête invalide.' });
  destroySession(res);
  if (session) logEvent('logout', { ip: clientIp(req) });
  return json(res, 200, { ok: true });
}
