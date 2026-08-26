// api/auth/session.js
// GET -> current admin session status (used by the admin SPA on load).
// Also ensures the admin user is seeded so login state is well-defined.

import { getSession, getUser } from '../_lib/auth.js';
import { json, previewMode } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Méthode non autorisée.' });
  }
  const preview = previewMode();
  const user = await getUser(); // seeds on first ever call
  const session = await getSession(req);
  if (!session) {
    return json(res, 200, { authenticated: false, locked: user.locked, preview });
  }
  return json(res, 200, {
    authenticated: true,
    username: session.user.username,
    mustChangePassword: session.user.mustChangePassword,
    preview,
  });
}
