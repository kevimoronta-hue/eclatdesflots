// dev-server.mjs — LOCAL DEVELOPMENT ONLY (not used by Vercel).
// Serves the static site + routes /api/* to the exact same handler files Vercel runs,
// using Node's raw req/res (identical contract). Uses the local store/blob adapters.

import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const PORT = process.env.PORT || 5173;

// Dev-only conveniences so the full flow is testable without cloud services.
if (!process.env.ADMIN_UNLOCK_KEY && !process.env.ADMIN_UNLOCK_KEY_HASH) {
  process.env.ADMIN_UNLOCK_KEY = 'DEV-UNLOCK-KEY-CHANGE-ME';
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8',
};

async function serveStatic(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
    res.end(data);
    return true;
  } catch { return false; }
}

const handlerCache = new Map();
async function loadHandler(apiPath) {
  // apiPath like '/api/auth/login' -> file './api/auth/login.js'
  const rel = apiPath.replace(/^\/+/, '');
  const file = path.join(ROOT, rel + '.js');
  try { await fs.access(file); } catch { return null; }
  if (!handlerCache.has(file)) {
    const mod = await import(pathToFileURL(file).href);
    handlerCache.set(file, mod.default);
  }
  return handlerCache.get(file);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (pathname.startsWith('/api/')) {
      const handler = await loadHandler(pathname);
      if (!handler) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return; }
      await handler(req, res);
      return;
    }

    // dev uploads served from .data/uploads
    if (pathname.startsWith('/uploads/')) {
      const f = path.join(ROOT, '.data', pathname.replace(/^\/+/, ''));
      if (await serveStatic(res, f)) return;
      res.statusCode = 404; res.end('Not found'); return;
    }

    // static routing ( / -> homepage, mirrors the Vercel rewrite )
    let rel = pathname === '/' ? '/Accueil.dc.html' : pathname;
    if (rel === '/admin' || rel === '/admin/') rel = '/admin/index.html';
    if (rel.endsWith('/')) rel += 'index.html';
    const filePath = path.join(ROOT, rel);
    if (!filePath.startsWith(ROOT)) { res.statusCode = 403; res.end('Forbidden'); return; }
    if (await serveStatic(res, filePath)) return;
    // Clean-URL fallback (mirrors Vercel rewrites): /mentions-legales -> mentions-legales.html
    if (!path.extname(filePath) && await serveStatic(res, filePath + '.html')) return;

    // Branded 404 (mirrors Vercel serving /404.html for unmatched routes)
    res.statusCode = 404;
    try {
      const notFound = await fs.readFile(path.join(ROOT, '404.html'));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(notFound);
    } catch {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not found');
    }
  } catch (e) {
    console.error('dev-server error:', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n  L'Éclat des Flots — dev server`);
  console.log(`  Public : http://localhost:${PORT}/`);
  console.log(`  Admin  : http://localhost:${PORT}/admin`);
  if (/^(1|true|yes|on)$/i.test(process.env.ADMIN_PREVIEW_MODE || '')) {
    console.log(`  Mode   : \x1b[33mPREVIEW — zero persistence (nothing is saved)\x1b[0m`);
  }
  console.log(`  Store  : ${process.env.KV_REST_API_URL ? 'Upstash Redis' : 'local .data/db.json'}`);
  console.log(`  Blob   : ${process.env.BLOB_READ_WRITE_TOKEN ? 'Vercel Blob' : 'local .data/uploads'}`);
  if (process.env.ADMIN_UNLOCK_KEY === 'DEV-UNLOCK-KEY-CHANGE-ME') {
    console.log(`  Unlock : DEV key = "DEV-UNLOCK-KEY-CHANGE-ME" (dev only)`);
  }
  console.log('');
});
