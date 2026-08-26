// api/history.js
// GET (admin) -> recent content-change history (updatedAt, who, old/new values).

import { getSession } from './_lib/auth.js';
import { json } from './_lib/http.js';
import { readHistory } from './content.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Méthode non autorisée.' });
  }
  const session = await getSession(req);
  if (!session) return json(res, 401, { error: 'Non authentifié.' });
  if (session.user.mustChangePassword) return json(res, 403, { error: 'Changement de mot de passe requis.' });
  const entries = await readHistory();
  return json(res, 200, { entries });
}
