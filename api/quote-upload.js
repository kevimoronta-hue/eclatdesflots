// api/quote-upload.js
// Issues short-lived client tokens so the browser can upload photos DIRECTLY to
// Vercel Blob (bypassing the ~4.5 MB serverless request-body limit). Content type
// and per-file size are enforced here at token generation; Blob enforces them on
// upload. No file bytes pass through this function.

import { handleUpload } from '@vercel/blob/client';
import { rateLimit } from './_lib/ratelimit.js';
import { json, readJson, clientIp, logEvent } from './_lib/http.js';

// Vercel nomme le token du store Blob d'après le nom du store (ici eclat_READ_WRITE_TOKEN).
// @vercel/blob lit BLOB_READ_WRITE_TOKEN : on relie tout <store>_READ_WRITE_TOKEN au nom
// standard, sans jamais exposer la valeur ni la coder en dur.
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  const k = Object.keys(process.env).find((n) => /_READ_WRITE_TOKEN$/.test(n) && process.env[n]);
  if (k) process.env.BLOB_READ_WRITE_TOKEN = process.env[k];
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE = 8 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Méthode non autorisée.' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return json(res, 503, { error: "Le stockage des photos n'est pas configuré." });
  }

  const ip = clientIp(req);
  const rl = await rateLimit('quote-upload', ip, { max: 60, windowSec: 600 });
  if (rl.limited) return json(res, 429, { error: 'Trop de requêtes.' });

  const body = await readJson(req);
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED,
        maximumSizeInBytes: MAX_FILE,
        addRandomSuffix: true,
        pathnamePrefix: 'devis-photos',
      }),
      onUploadCompleted: async () => { /* Blob → server webhook (prod only); nothing needed */ },
    });
    return json(res, 200, result);
  } catch (e) {
    logEvent('quote_upload_token_error', { ip, message: e && e.message ? String(e.message).slice(0, 120) : 'unknown' });
    return json(res, 400, { error: "Échec de préparation de l'upload." });
  }
}
