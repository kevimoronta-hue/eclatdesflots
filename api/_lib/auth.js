// api/_lib/auth.js
// Authentication core: password hashing/policy, signed session cookies with a
// server-side epoch (for global invalidation), CSRF double-submit tokens, the
// admin user record + secure seed, and unlock-key comparison.

import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { getJSON, setJSON } from './store.js';
import { getCookies, setCookie, clearCookie, isProd, previewMode } from './http.js';

const USER_KEY = 'auth:user';
const SESSION_COOKIE = 'admin_session';
const CSRF_COOKIE = 'admin_csrf';
const SESSION_TTL_SEC = 8 * 60 * 60; // 8 hours
const BCRYPT_COST = 12;
export const MAX_FAILED = 5;

/* ------------------------------ session secret ----------------------------- */

let cachedSecret = null;
async function sessionSecret() {
  if (cachedSecret) return cachedSecret;
  if (process.env.SESSION_SECRET) {
    cachedSecret = process.env.SESSION_SECRET;
    return cachedSecret;
  }
  if (isProd()) throw new Error('SESSION_SECRET is required in production.');
  // Dev only: persist a random secret so sessions survive restarts.
  const devFile = path.join(process.cwd(), '.data', 'dev-session-secret');
  try {
    cachedSecret = await fs.readFile(devFile, 'utf8');
  } catch {
    cachedSecret = crypto.randomBytes(32).toString('hex');
    await fs.mkdir(path.dirname(devFile), { recursive: true });
    await fs.writeFile(devFile, cachedSecret);
  }
  return cachedSecret;
}

/* -------------------------------- password --------------------------------- */

export function passwordPolicyError(pw) {
  if (typeof pw !== 'string' || pw.length < 10) return 'Le mot de passe doit contenir au moins 10 caractères.';
  if (!/[a-z]/.test(pw)) return 'Le mot de passe doit contenir une minuscule.';
  if (!/[A-Z]/.test(pw)) return 'Le mot de passe doit contenir une majuscule.';
  if (!/[0-9]/.test(pw)) return 'Le mot de passe doit contenir un chiffre.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Le mot de passe doit contenir un caractère spécial.';
  return null;
}

export async function hashPassword(pw) {
  return bcrypt.hash(pw, BCRYPT_COST);
}
export async function verifyPassword(pw, hash) {
  if (!hash) return false;
  try { return await bcrypt.compare(pw, hash); } catch { return false; }
}

/* ------------------------------- user record ------------------------------- */

// Seeds `admin` on first access. Initial password "admin" is stored only as a
// bcrypt hash, server-side, and forces a password change on first login.
// Cached ephemeral hash for preview mode (avoids re-hashing on every request).
let previewHash = null;

export async function getUser() {
  // Preview mode: always return a FRESH clone of a default admin. Never reads or
  // writes the store, never accumulates failedAttempts, never locks.
  if (previewMode()) {
    if (!previewHash) previewHash = await hashPassword('admin');
    const now = new Date().toISOString();
    return {
      username: 'admin', passwordHash: previewHash, mustChangePassword: true,
      failedAttempts: 0, locked: false, sessionEpoch: 1,
      createdAt: now, updatedAt: now, passwordUpdatedAt: now,
    };
  }
  let user = await getJSON(USER_KEY);
  if (!user) {
    const now = new Date().toISOString();
    user = {
      username: 'admin',
      passwordHash: await hashPassword('admin'),
      mustChangePassword: true,
      failedAttempts: 0,
      locked: false,
      sessionEpoch: 1,
      createdAt: now,
      updatedAt: now,
      passwordUpdatedAt: now,
    };
    await setJSON(USER_KEY, user);
  }
  return user;
}

export async function saveUser(user) {
  user.updatedAt = new Date().toISOString();
  await setJSON(USER_KEY, user);
  return user;
}

/* --------------------------------- sessions -------------------------------- */

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlJson(obj) { return b64url(Buffer.from(JSON.stringify(obj), 'utf8')); }

async function sign(payloadB64) {
  const secret = await sessionSecret();
  return b64url(crypto.createHmac('sha256', secret).update(payloadB64).digest());
}

function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Issue a session cookie for the given user (uses the user's current epoch).
// opts.pwChanged marks a preview-mode password change inside the token itself
// (no persistence), so the dashboard becomes reachable in preview.
export async function issueSession(res, user, opts = {}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: user.username, iat: now, exp: now + SESSION_TTL_SEC, epoch: user.sessionEpoch };
  if (opts.pwChanged) payload.pw = 1;
  const p = b64urlJson(payload);
  const token = `${p}.${await sign(p)}`;
  setCookie(res, SESSION_COOKIE, token, {
    httpOnly: true, secure: isProd(), sameSite: 'Lax', path: '/', maxAge: SESSION_TTL_SEC,
  });
  // CSRF token: readable by the admin JS, sent back as a header on mutations.
  const csrf = crypto.randomBytes(24).toString('hex');
  setCookie(res, CSRF_COOKIE, csrf, {
    httpOnly: false, secure: isProd(), sameSite: 'Lax', path: '/', maxAge: SESSION_TTL_SEC,
  });
  return csrf;
}

export function destroySession(res) {
  clearCookie(res, SESSION_COOKIE, { path: '/' });
  clearCookie(res, CSRF_COOKIE, { path: '/' });
}

// Verify the session cookie and that its epoch still matches the user record.
// Returns { user } or null.
export async function getSession(req) {
  const cookies = getCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token || token.indexOf('.') < 0) return null;
  const [p, sig] = token.split('.');
  const expected = await sign(p);
  if (!timingSafeEqualStr(sig, expected)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')); }
  catch { return null; }
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) return null;
  const user = await getUser();
  if (payload.epoch !== user.sessionEpoch) return null; // globally invalidated
  // Preview mode: reflect an in-session (non-persisted) password change.
  if (previewMode() && payload.pw) user.mustChangePassword = false;
  return { payload, user };
}

// CSRF check for state-changing requests (double-submit cookie).
export function checkCsrf(req) {
  const cookies = getCookies(req);
  const cookieToken = cookies[CSRF_COOKIE];
  const headerToken = req.headers['x-csrf-token'];
  if (!cookieToken || !headerToken) return false;
  return timingSafeEqualStr(cookieToken, headerToken);
}

/* ------------------------------- unlock key -------------------------------- */

// Compares a submitted unlock key against the server-side secret.
// Prefers a bcrypt hash (ADMIN_UNLOCK_KEY_HASH); falls back to a plain env value
// (ADMIN_UNLOCK_KEY) compared in constant time. Never logs or returns the key.
export async function verifyUnlockKey(submitted) {
  if (typeof submitted !== 'string' || !submitted) return false;
  const hash = process.env.ADMIN_UNLOCK_KEY_HASH;
  if (hash) {
    try { return await bcrypt.compare(submitted, hash); } catch { return false; }
  }
  const plain = process.env.ADMIN_UNLOCK_KEY;
  if (plain) return timingSafeEqualStr(submitted, plain);
  return false; // no unlock key configured -> cannot unlock
}

export function unlockKeyConfigured() {
  return Boolean(process.env.ADMIN_UNLOCK_KEY_HASH || process.env.ADMIN_UNLOCK_KEY);
}
