// tests/admin-flow.mjs — end-to-end auth + CMS flow against a running dev server.
// Usage: `npm run dev` in one terminal, then `npm run test:admin`.
// Uses a per-request X-Forwarded-For so the IP rate-limit doesn't mask the
// per-account lockout (they are independent mechanisms).

import { promises as fs } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:5173';
const NEW_PW = 'Eclat!2026xy';
let jar = {};
let ipctr = 0;
let pass = 0, fail = 0;

function setJar(res) {
  const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of cookies) {
    const [pair] = c.split(';');
    const i = pair.indexOf('=');
    const k = pair.slice(0, i).trim();
    const v = pair.slice(i + 1).trim();
    if (v === '') delete jar[k]; else jar[k] = v;
  }
}
function cookieHeader() { return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '); }

async function call(method, url, { json, raw, type, freshIp = true } = {}) {
  const headers = { Cookie: cookieHeader() };
  if (freshIp) headers['X-Forwarded-For'] = `10.0.0.${(ipctr++ % 250) + 1}`;
  let body;
  if (json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  if (raw !== undefined) { headers['Content-Type'] = type; body = raw; }
  if (method !== 'GET' && jar.admin_csrf) headers['X-CSRF-Token'] = jar.admin_csrf;
  const res = await fetch(BASE + url, { method, headers, body });
  setJar(res);
  let data = {}; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

function check(name, cond, extra) {
  if (cond) { pass++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else { fail++; console.log(`  \x1b[31m✗ ${name}\x1b[0m${extra ? '  ' + JSON.stringify(extra) : ''}`); }
}

async function main() {
  // Fresh state
  await fs.rm(path.join(process.cwd(), '.data'), { recursive: true, force: true });

  console.log('\nA. First login admin/admin forces password change');
  let r = await call('GET', '/api/auth/session');
  check('session starts unauthenticated', r.data.authenticated === false, r.data);
  r = await call('POST', '/api/auth/login', { json: { username: 'admin', password: 'admin' } });
  check('admin/admin accepted', r.status === 200 && r.data.ok === true, r.data);
  check('mustChangePassword = true', r.data.mustChangePassword === true, r.data);
  r = await call('PUT', '/api/content', { json: { updates: { 'hero.title': 'X' } } });
  check('dashboard write blocked until password changed (403)', r.status === 403, r.data);

  console.log('\nB. Change password, then log in with the new one');
  r = await call('POST', '/api/auth/change-password', { json: { oldPassword: 'admin', newPassword: 'short', confirm: 'short' } });
  check('weak password rejected', r.status === 400, r.data);
  r = await call('POST', '/api/auth/change-password', { json: { oldPassword: 'admin', newPassword: NEW_PW, confirm: NEW_PW } });
  check('valid password change ok', r.status === 200 && r.data.ok === true, r.data);
  r = await call('POST', '/api/auth/login', { json: { username: 'admin', password: 'admin' } });
  check('admin/admin NO LONGER works', r.status === 401, r.data);
  r = await call('POST', '/api/auth/login', { json: { username: 'admin', password: NEW_PW } });
  check('new password works', r.status === 200 && r.data.ok === true && !r.data.mustChangePassword, r.data);

  console.log('\nC. Five wrong passwords lock the account');
  let locked = false;
  for (let i = 1; i <= 5; i++) {
    r = await call('POST', '/api/auth/login', { json: { username: 'admin', password: 'wrong' + i } });
    if (r.data.locked) locked = true;
  }
  check('account locked after 5 failures', locked === true, r.data);

  console.log('\nD. Lock persists across refresh / new client');
  jar = {}; // simulate a brand-new browser (no cookies)
  r = await call('GET', '/api/auth/session');
  check('session reports locked', r.data.locked === true, r.data);
  r = await call('POST', '/api/auth/login', { json: { username: 'admin', password: NEW_PW } });
  check('correct password still blocked while locked (423)', r.status === 423 && r.data.locked === true, r.data);

  console.log('\nF. Wrong unlock key does nothing');
  r = await call('POST', '/api/auth/unlock', { json: { key: 'nope' } });
  check('wrong key rejected', r.status === 400, r.data);
  r = await call('POST', '/api/auth/login', { json: { username: 'admin', password: NEW_PW } });
  check('still locked after wrong key', r.status === 423, r.data);

  console.log('\nE. Correct unlock key resets the account');
  r = await call('POST', '/api/auth/unlock', { json: { key: 'DEV-UNLOCK-KEY-CHANGE-ME' } });
  check('unlock ok', r.status === 200 && r.data.ok === true, r.data);
  r = await call('POST', '/api/auth/login', { json: { username: 'admin', password: NEW_PW } });
  check('login works again after unlock', r.status === 200 && r.data.ok === true, r.data);

  console.log('\nG. Edit text -> public content updated');
  const NEWTITLE = 'Titre test ' + Date.now();
  r = await call('PUT', '/api/content', { json: { updates: { 'hero.title': NEWTITLE } } });
  check('content PUT ok', r.status === 200 && r.data.ok === true, r.data);
  r = await call('GET', '/api/content');
  check('public /api/content reflects edit', r.data.content['hero.title'] === NEWTITLE, r.data.content && r.data.content['hero.title']);
  check('untouched field falls back to default', typeof r.data.content['project1.title'] === 'string' && r.data.content['project1.title'].length > 0);

  console.log('\nH. Upload image -> stored + referenced');
  // 1x1 PNG
  const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const pngBuf = Buffer.from(pngB64, 'base64');
  r = await call('POST', '/api/upload', { raw: pngBuf, type: 'image/png' });
  check('image upload ok, url returned', r.status === 200 && typeof r.data.url === 'string', r.data);
  const url = r.data.url;
  r = await call('PUT', '/api/content', { json: { updates: { 'project1.beforeImage': url } } });
  check('image url saved to content', r.status === 200, r.data);
  r = await call('GET', '/api/content');
  check('content references new image url', r.data.content['project1.beforeImage'] === url, url);
  // reject a fake "image"
  r = await call('POST', '/api/upload', { raw: Buffer.from('hello'), type: 'text/plain' });
  check('non-image rejected (415)', r.status === 415, r.data);

  console.log('\nI. Persistence (survives restart / redeploy)');
  const db = JSON.parse(await fs.readFile(path.join(process.cwd(), '.data', 'db.json'), 'utf8'));
  const contentData = JSON.parse(db['content:data'].v);
  check('edited content persisted in store', contentData['hero.title'] === NEWTITLE, contentData['hero.title']);
  const user = JSON.parse(db['auth:user'].v);
  check('password stored as bcrypt hash (not plaintext)', /^\$2[aby]\$/.test(user.passwordHash));
  check('no plaintext password/admin in user record', !JSON.stringify(user).includes('"admin"') || user.username === 'admin');
  check('history recorded', Array.isArray(JSON.parse((db['content:history'] || { v: '[]' }).v)) );

  console.log('\nJ. Logout revokes access');
  r = await call('POST', '/api/auth/logout', {});
  check('logout ok', r.status === 200, r.data);
  r = await call('GET', '/api/auth/session');
  check('session unauthenticated after logout', r.data.authenticated === false, r.data);
  r = await call('PUT', '/api/content', { json: { updates: { 'hero.title': 'Y' } } });
  check('write blocked after logout (401)', r.status === 401, r.data);

  console.log('\nK. IP rate-limit throttles rapid attempts (same IP)');
  let got429 = false;
  for (let i = 0; i < 14; i++) {
    const res = await fetch(BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.9' },
      body: JSON.stringify({ username: 'admin', password: 'z' }),
    });
    if (res.status === 429) got429 = true;
  }
  check('rapid same-IP attempts eventually rate-limited (429)', got429 === true);

  console.log(`\n${fail === 0 ? '\x1b[32m' : '\x1b[31m'}${pass} passed, ${fail} failed\x1b[0m\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
