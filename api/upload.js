// api/upload.js
// POST (admin) raw image bytes -> stores to Blob/local, returns a public URL.
// The admin sends the file as the raw request body with the image Content-Type.
// No multipart parser needed (keeps it serverless-friendly and dependency-light).

import { getSession, checkCsrf } from './_lib/auth.js';
import { json, readRawBody, logEvent, clientIp, previewMode } from './_lib/http.js';
import { putImage, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from './_lib/blob.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Méthode non autorisée.' });
  }

  const session = await getSession(req);
  if (!session) return json(res, 401, { error: 'Non authentifié.' });
  // mustChangePassword ne bloque plus l'accès au dashboard (session valide suffit).
  if (!checkCsrf(req)) return json(res, 403, { error: 'Requête invalide.' });

  const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return json(res, 415, { error: 'Format non supporté (JPG, PNG ou WEBP uniquement).' });
  }

  let buffer;
  try {
    const body = await readRawBody(req, MAX_IMAGE_BYTES + 1024);
    buffer = body.buffer;
  } catch (e) {
    if (e && e.message === 'PAYLOAD_TOO_LARGE') {
      return json(res, 413, { error: 'Image trop lourde (8 Mo maximum).' });
    }
    return json(res, 400, { error: 'Lecture du fichier impossible.' });
  }

  if (!buffer || buffer.length === 0) return json(res, 400, { error: 'Fichier vide.' });
  if (buffer.length > MAX_IMAGE_BYTES) return json(res, 413, { error: 'Image trop lourde (8 Mo maximum).' });

  // Preview mode: echo the image back as a data: URL so the preview renders,
  // but never store it anywhere.
  if (previewMode()) {
    const url = `data:${contentType};base64,${buffer.toString('base64')}`;
    return json(res, 200, { ok: true, url, preview: true });
  }

  try {
    const url = await putImage(buffer, contentType);
    logEvent('image_uploaded', { by: session.user.username, ip: clientIp(req), bytes: buffer.length });
    return json(res, 200, { ok: true, url });
  } catch (e) {
    logEvent('image_upload_error', { message: e && e.message ? e.message : 'unknown' });
    return json(res, 500, { error: 'Échec du stockage de l’image.' });
  }
}
