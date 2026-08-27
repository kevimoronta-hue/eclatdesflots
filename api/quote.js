// api/quote.js
// POST /api/quote — public quote-request endpoint.
// Receives JSON: text fields + photo URLs (photos are uploaded directly to Blob
// by the browser, so no large payload passes through this function). Revalidates
// everything server-side, then emails contact@leclatdesflots.fr via Resend.
// Success is returned ONLY if the email actually went out.

import { parsePhoneNumber } from 'libphonenumber-js/max';
import { rateLimit } from './_lib/ratelimit.js';
import { json, readJson, clientIp, logEvent } from './_lib/http.js';
import { sendQuoteEmail } from './_lib/mailer.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = { name: 200, email: 200, phone: 40, boatType: 200, message: 5000 };
const MAX_PHOTOS = 12;
const MAX_FILE = 8 * 1024 * 1024;
const MAX_TOTAL = 40 * 1024 * 1024;
const ALLOWED_TYPES = /^image\/(jpeg|png|webp|heic|heif)$/i;

function str(v) { return typeof v === 'string' ? v.trim() : ''; }

// Only accept photo URLs we actually produced (Vercel Blob, or dev /uploads).
function isAllowedPhotoUrl(u) {
  if (typeof u !== 'string') return false;
  if (u.startsWith('/uploads/')) return true; // dev adapter
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && /\.public\.blob\.vercel-storage\.com$/i.test(url.hostname);
  } catch { return false; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Méthode non autorisée.' });
  }

  const ip = clientIp(req);
  const rl = await rateLimit('quote', ip, { max: 5, windowSec: 600 });
  if (rl.limited) {
    logEvent('quote_ratelimited', { ip });
    return json(res, 429, { error: 'Trop de demandes. Réessayez dans quelques minutes.' });
  }

  const body = await readJson(req);
  if (!body || typeof body !== 'object') return json(res, 400, { error: 'Requête invalide.' });

  // Honeypot: bots fill hidden fields. Silently accept without sending.
  if (str(body.company)) {
    logEvent('quote_honeypot', { ip });
    return json(res, 200, { ok: true });
  }

  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone);
  const phoneCountry = str(body.phoneCountry).toUpperCase();
  const boatType = str(body.boatType);
  const boatTypeOther = str(body.boatTypeOther);
  const message = str(body.message);

  const fields = {};
  if (!name) fields.name = 'Le nom est obligatoire.';
  else if (name.length > MAX.name) fields.name = 'Nom trop long.';
  if (!email) fields.email = "L'e-mail est obligatoire.";
  else if (email.length > MAX.email || !EMAIL_RE.test(email)) fields.email = 'E-mail invalide.';

  // Country-aware phone validation + normalization (libphonenumber, authoritative).
  let phoneE164 = '', phoneIntl = '';
  if (!phone) fields.phone = 'Le téléphone est obligatoire.';
  else if (phone.length > MAX.phone) fields.phone = 'Téléphone invalide.';
  else {
    try {
      const pn = parsePhoneNumber(phone, /^[A-Z]{2}$/.test(phoneCountry) ? phoneCountry : undefined);
      if (!pn || !pn.isValid()) fields.phone = 'Veuillez saisir un numéro WhatsApp valide.';
      else { phoneE164 = pn.number; phoneIntl = pn.formatInternational(); }
    } catch { fields.phone = 'Veuillez saisir un numéro WhatsApp valide.'; }
  }

  if (!boatType) fields.boatType = "Le type d'embarcation est obligatoire.";
  else if (boatType.length > MAX.boatType) fields.boatType = 'Texte trop long.';
  if (boatType === 'Autre') {
    if (!boatTypeOther) fields.boatTypeOther = 'Veuillez préciser votre type d’embarcation.';
    else if (boatTypeOther.length > MAX.boatType) fields.boatTypeOther = 'Texte trop long.';
  }
  const boatDisplay = boatType === 'Autre' ? ('Autre — ' + boatTypeOther) : boatType;
  if (!message) fields.message = 'Le message est obligatoire.';
  else if (message.length > MAX.message) fields.message = 'Message trop long.';

  // Photos are OPTIONAL, but if present must be valid Blob URLs within limits.
  let photos = Array.isArray(body.photos) ? body.photos : [];
  if (photos.length > MAX_PHOTOS) return json(res, 400, { error: `Maximum ${MAX_PHOTOS} photos.` });
  let totalSize = 0;
  const cleanPhotos = [];
  for (const p of photos) {
    if (!p || !isAllowedPhotoUrl(p.url)) return json(res, 400, { error: 'Photo non autorisée.' });
    const size = Number(p.size) || 0;
    if (size > MAX_FILE) return json(res, 400, { error: 'Une photo dépasse 8 Mo.' });
    if (p.type && !ALLOWED_TYPES.test(String(p.type))) return json(res, 400, { error: 'Format de photo non supporté.' });
    totalSize += size;
    cleanPhotos.push({ url: p.url, name: String(p.name || '').slice(0, 200) });
  }
  if (totalSize > MAX_TOTAL) return json(res, 400, { error: 'Total des photos supérieur à 40 Mo.' });

  if (Object.keys(fields).length) {
    return json(res, 400, { error: 'Certains champs sont invalides.', fields });
  }

  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  let dateLabel;
  try { dateLabel = now.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }); }
  catch { dateLabel = now.toISOString(); }

  try {
    const result = await sendQuoteEmail({ name, email, phoneE164, phoneIntl, boatType: boatDisplay, message, photos: cleanPhotos, dateLabel, stamp });
    logEvent('quote_sent', { ip, photos: cleanPhotos.length, dev: !!result.dev });
    return json(res, 200, { ok: true });
  } catch (e) {
    const code = e && e.code ? e.code : 'SEND_ERROR';
    logEvent('quote_send_failed', { ip, code });
    if (code === 'EMAIL_NOT_CONFIGURED' || code === 'FROM_NOT_CONFIGURED') {
      return json(res, 503, { error: "Le service d'envoi n'est pas encore configuré." });
    }
    return json(res, 502, { error: "L'envoi a échoué. Merci de réessayer ou de nous appeler." });
  }
}
