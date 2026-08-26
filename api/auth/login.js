// api/auth/login.js
// POST { username, password }
// - throttled per IP, locked after MAX_FAILED consecutive bad passwords
// - generic errors (no user enumeration, no technical leakage)
// - issues a session on success; first login flags mustChangePassword

import { getUser, saveUser, verifyPassword, issueSession, MAX_FAILED } from '../_lib/auth.js';
import { rateLimit } from '../_lib/ratelimit.js';
import { json, readJson, clientIp, logEvent } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Méthode non autorisée.' });
  }

  const ip = clientIp(req);
  const rl = await rateLimit('login', ip, { max: 10, windowSec: 300 });
  if (rl.limited) {
    logEvent('login_ratelimited', { ip });
    return json(res, 429, { error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
  }

  const body = await readJson(req);
  const username = body && typeof body.username === 'string' ? body.username.trim() : '';
  const password = body && typeof body.password === 'string' ? body.password : '';

  const user = await getUser();

  // Already locked -> hard stop, generic message.
  if (user.locked) {
    logEvent('login_blocked_locked', { ip });
    return json(res, 423, { locked: true, error: 'Accès administrateur verrouillé.' });
  }

  const usernameOk = username === user.username;
  const passwordOk = usernameOk && (await verifyPassword(password, user.passwordHash));

  if (!passwordOk) {
    // Only real attempts on the admin account count toward the lockout.
    if (usernameOk) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= MAX_FAILED) {
        user.locked = true;
        await saveUser(user);
        logEvent('account_locked', { ip });
        return json(res, 423, { locked: true, error: 'Accès administrateur verrouillé.' });
      }
      await saveUser(user);
    }
    logEvent('login_failed', { ip });
    return json(res, 401, { error: 'Identifiants invalides.' });
  }

  // Success -> reset counter, issue session.
  if (user.failedAttempts) { user.failedAttempts = 0; await saveUser(user); }
  await issueSession(res, user);
  logEvent('login_success', { ip, mustChangePassword: user.mustChangePassword });
  return json(res, 200, { ok: true, mustChangePassword: user.mustChangePassword });
}
