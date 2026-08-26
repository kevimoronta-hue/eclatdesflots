// api/schema.js
// Returns the editable-content schema (sections + field metadata) for the admin UI.
// Requires a valid admin session. No secrets here — only labels/types/keys.

import { getSession } from './_lib/auth.js';
import { json } from './_lib/http.js';
import { SECTIONS } from '../cms/schema.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Méthode non autorisée.' });
  }
  const session = await getSession(req);
  if (!session) return json(res, 401, { error: 'Non authentifié.' });
  return json(res, 200, { sections: SECTIONS });
}
