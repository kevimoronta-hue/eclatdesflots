// api/_lib/http.js
// Small portable helpers so handlers use only Node's raw req/res primitives.
// This keeps every function identical on Vercel (Node runtime) and the local dev server.

export function getCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

export function setCookie(res, name, value, opts = {}) {
  const segs = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge != null) segs.push(`Max-Age=${Math.floor(opts.maxAge)}`);
  segs.push(`Path=${opts.path || '/'}`);
  if (opts.httpOnly) segs.push('HttpOnly');
  if (opts.secure) segs.push('Secure');
  segs.push(`SameSite=${opts.sameSite || 'Lax'}`);
  const prev = res.getHeader('Set-Cookie');
  const cookie = segs.join('; ');
  if (!prev) res.setHeader('Set-Cookie', cookie);
  else res.setHeader('Set-Cookie', Array.isArray(prev) ? [...prev, cookie] : [prev, cookie]);
}

export function clearCookie(res, name, opts = {}) {
  setCookie(res, name, '', { ...opts, maxAge: 0 });
}

export function isProd() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

// Dev-only preview mode: exercises the whole /admin UI with ZERO persistence.
// Forced OFF in production regardless of the env var, so the real secure system
// always takes over on Vercel.
export function previewMode() {
  if (isProd()) return false;
  return /^(1|true|yes|on)$/i.test(process.env.ADMIN_PREVIEW_MODE || '');
}

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function readRawBody(req, limitBytes = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    // On Vercel the JSON body is sometimes pre-parsed into req.body; support both.
    if (req.body && typeof req.body !== 'string' && !Buffer.isBuffer(req.body)) {
      resolve({ parsed: req.body, buffer: null });
      return;
    }
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limitBytes) { reject(new Error('PAYLOAD_TOO_LARGE')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve({ parsed: null, buffer: Buffer.concat(chunks) }));
    req.on('error', reject);
  });
}

export async function readJson(req) {
  const { parsed, buffer } = await readRawBody(req);
  if (parsed) return parsed;
  if (!buffer || buffer.length === 0) return {};
  try { return JSON.parse(buffer.toString('utf8')); } catch { return null; }
}

export function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Structured server-side log that NEVER includes secrets (passwords, keys, tokens).
export function logEvent(event, meta = {}) {
  const safe = { ...meta };
  for (const k of ['password', 'newPassword', 'oldPassword', 'key', 'token', 'hash', 'secret']) delete safe[k];
  try {
    console.log(JSON.stringify({ at: new Date().toISOString(), event, ...safe }));
  } catch {
    console.log(`[${event}]`);
  }
}
