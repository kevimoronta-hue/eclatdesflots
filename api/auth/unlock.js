// api/auth/unlock.js
// POST { key }  -> if the recovery key matches the server-side secret:
//   locked = false, failedAttempts = 0, sessionEpoch++ (invalidate any sessions).
// Generic responses only. The real key lives in ADMIN_UNLOCK_KEY (env), never in Git.

import { getUser, saveUser, verifyUnlockKey, unlockKeyConfigured } from '../_lib/auth.js';
import { rateLimit } from '../_lib/ratelimit.js';
import { json, readJson, clientIp, logEvent } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Méthode non autorisée.' });
  }

  const ip = clientIp(req);
  const rl = await rateLimit('unlock', ip, { max: 10, windowSec: 600 });
  if (rl.limited) return json(res, 429, { error: 'Trop de tentatives. Réessayez plus tard.' });

  const body = await readJson(req);
  const key = body && typeof body.key === 'string' ? body.key : '';

  if (!unlockKeyConfigured()) {
    // Misconfiguration: do not reveal details to the client.
    logEvent('unlock_not_configured', { ip });
    return json(res, 400, { error: 'Déblocage indisponible.' });
  }

  const ok = await verifyUnlockKey(key);
  if (!ok) {
    logEvent('unlock_failed', { ip });
    return json(res, 400, { error: 'Clé invalide.' });
  }

  const user = await getUser();
  user.locked = false;
  user.failedAttempts = 0;
  user.sessionEpoch = (user.sessionEpoch || 1) + 1; // invalidate existing admin sessions
  await saveUser(user);
  logEvent('account_unlocked', { ip });
  return json(res, 200, { ok: true });
}
