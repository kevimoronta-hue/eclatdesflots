// api/auth/change-password.js
// POST { oldPassword, newPassword, confirm, invalidateOthers? }
// Works for the forced first-login change AND the dashboard "Sécurité" change.
// This is the ONLY protected endpoint reachable while mustChangePassword is true.

import {
  getSession, saveUser, verifyPassword, hashPassword,
  passwordPolicyError, issueSession, checkCsrf,
} from '../_lib/auth.js';
import { json, readJson, clientIp, logEvent, previewMode } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Méthode non autorisée.' });
  }

  const session = await getSession(req);
  if (!session) return json(res, 401, { error: 'Non authentifié.' });
  if (!checkCsrf(req)) return json(res, 403, { error: 'Requête invalide.' });

  const body = await readJson(req);
  const oldPassword = body && typeof body.oldPassword === 'string' ? body.oldPassword : '';
  const newPassword = body && typeof body.newPassword === 'string' ? body.newPassword : '';
  const confirm = body && typeof body.confirm === 'string' ? body.confirm : '';
  const invalidateOthers = body ? body.invalidateOthers !== false : true;

  const user = session.user;

  if (!(await verifyPassword(oldPassword, user.passwordHash))) {
    logEvent('password_change_bad_old', { ip: clientIp(req) });
    return json(res, 400, { error: 'Ancien mot de passe incorrect.' });
  }
  if (newPassword !== confirm) {
    return json(res, 400, { error: 'La confirmation ne correspond pas.' });
  }
  const policy = passwordPolicyError(newPassword);
  if (policy) return json(res, 400, { error: policy });
  if (await verifyPassword(newPassword, user.passwordHash)) {
    return json(res, 400, { error: 'Le nouveau mot de passe doit être différent de l’ancien.' });
  }

  const preview = previewMode();
  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false; // "admin" is now invalid as a password
  user.passwordUpdatedAt = new Date().toISOString();
  // In preview the epoch must stay put (the ephemeral user is always epoch 1),
  // otherwise the reissued session would be immediately invalidated.
  if (invalidateOthers && !preview) user.sessionEpoch = (user.sessionEpoch || 1) + 1;
  await saveUser(user); // no-op in preview

  // Re-issue the current session so THIS browser stays logged in.
  await issueSession(res, user, { pwChanged: preview });
  logEvent('password_changed', { ip: clientIp(req), invalidateOthers, preview });
  return json(res, 200, { ok: true });
}
