// api/_lib/store.js
// Persistence abstraction with two interchangeable adapters:
//   - Upstash Redis (REST)  -> production on Vercel (persists across redeploys,
//                              across browsers, across serverless invocations)
//   - Local JSON file       -> local development only (`.data/db.json`)
// The rest of the app only ever calls kvGet / kvSet / kvDel / kvIncr / getJSON / setJSON.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { previewMode } from './http.js';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

export const usingRedis = Boolean(KV_URL && KV_TOKEN);

/* ------------------------------- Redis (REST) ------------------------------ */

async function redisCmd(args) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`KV command failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.result;
}

/* ------------------------------- Local file -------------------------------- */

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
let localCache = null;

async function localLoad() {
  if (localCache) return localCache;
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    localCache = JSON.parse(raw);
  } catch {
    localCache = {};
  }
  return localCache;
}

async function localSave() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(localCache, null, 2));
}

function localExpired(entry) {
  return entry && entry.exp && Date.now() > entry.exp;
}

/* --------------------------------- Public ---------------------------------- */

// Get a raw string value (or null).
export async function kvGet(key) {
  if (usingRedis) {
    const r = await redisCmd(['GET', key]);
    return r == null ? null : String(r);
  }
  const db = await localLoad();
  const entry = db[key];
  if (!entry) return null;
  if (localExpired(entry)) { delete db[key]; await localSave(); return null; }
  return entry.v == null ? null : String(entry.v);
}

// Set a raw string value. opts.ex = seconds TTL.
export async function kvSet(key, value, opts = {}) {
  if (previewMode()) return; // preview: never persist
  if (usingRedis) {
    const args = ['SET', key, String(value)];
    if (opts.ex) args.push('EX', String(opts.ex));
    await redisCmd(args);
    return;
  }
  const db = await localLoad();
  db[key] = { v: String(value), exp: opts.ex ? Date.now() + opts.ex * 1000 : 0 };
  await localSave();
}

export async function kvDel(key) {
  if (previewMode()) return; // preview: never persist
  if (usingRedis) { await redisCmd(['DEL', key]); return; }
  const db = await localLoad();
  delete db[key];
  await localSave();
}

// Atomic-ish increment with a TTL applied on first creation. Returns the new count.
export async function kvIncr(key, opts = {}) {
  if (previewMode()) return 1; // preview: ephemeral, never accumulates, never locks
  if (usingRedis) {
    const n = await redisCmd(['INCR', key]);
    if (n === 1 && opts.ex) await redisCmd(['EXPIRE', key, String(opts.ex)]);
    return Number(n);
  }
  const db = await localLoad();
  const entry = db[key];
  let count;
  if (!entry || localExpired(entry)) {
    count = 1;
    db[key] = { v: '1', exp: opts.ex ? Date.now() + opts.ex * 1000 : 0 };
  } else {
    count = Number(entry.v || 0) + 1;
    entry.v = String(count);
  }
  await localSave();
  return count;
}

/* ------------------------------ JSON helpers ------------------------------- */

export async function getJSON(key) {
  const raw = await kvGet(key);
  if (raw == null) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function setJSON(key, obj) {
  await kvSet(key, JSON.stringify(obj));
}

/* ------------------------------ list helpers ------------------------------- */
// Small capped list used for the content history log.

export async function listPushCapped(key, item, cap = 50) {
  if (previewMode()) return; // preview: never persist
  if (usingRedis) {
    await redisCmd(['LPUSH', key, JSON.stringify(item)]);
    await redisCmd(['LTRIM', key, '0', String(cap - 1)]);
    return;
  }
  const db = await localLoad();
  const entry = db[key];
  let arr = [];
  if (entry) { try { arr = JSON.parse(entry.v); } catch { arr = []; } }
  arr.unshift(item);
  arr = arr.slice(0, cap);
  db[key] = { v: JSON.stringify(arr), exp: 0 };
  await localSave();
}

export async function listGet(key, limit = 50) {
  if (usingRedis) {
    const rows = await redisCmd(['LRANGE', key, '0', String(limit - 1)]);
    return (rows || []).map((r) => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
  }
  const db = await localLoad();
  const entry = db[key];
  if (!entry) return [];
  try { return JSON.parse(entry.v).slice(0, limit); } catch { return []; }
}
