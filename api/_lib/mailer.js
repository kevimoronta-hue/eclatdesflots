// api/_lib/mailer.js
// Sends the quote request email via Resend (REST API — no SDK dependency).
// The recipient is fixed server-side (never from the client). The prospect's
// email is used only as Reply-To. Never logs secrets or message content.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { isProd } from './http.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildBodies(d) {
  const when = d.dateLabel;
  const photosText = d.photos.length
    ? d.photos.map((p, i) => `  - Photo ${i + 1} : ${p.url}`).join('\n')
    : '  Aucune photo jointe.';
  const waDigits = String(d.phoneE164 || '').replace(/[^\d]/g, '');
  const text =
`NOUVELLE DEMANDE DE DEVIS — L'Éclat des Flots

Nom :
${d.name}

Téléphone / WhatsApp :
${d.phoneIntl}

Email :
${d.email}

Type d'embarcation :
${d.boatType}

Message / besoin :
${d.message}

Photos du bateau :
${photosText}

Date :
${when}
`;

  const photosHtml = d.photos.length
    ? '<ul style="margin:6px 0 0;padding-left:18px">' +
      d.photos.map((p, i) => `<li><a href="${esc(p.url)}">Voir photo ${i + 1}</a>${p.name ? ' — ' + esc(p.name) : ''}</li>`).join('') +
      '</ul>'
    : '<p style="margin:6px 0 0;color:#64758a">Aucune photo jointe.</p>';

  const row = (label, value) =>
    `<tr><td style="padding:6px 0;color:#64758a;font-size:13px;vertical-align:top;width:170px">${label}</td>` +
    `<td style="padding:6px 0;color:#0f2136;font-size:14px;white-space:pre-wrap">${esc(value)}</td></tr>`;

  const phoneCell = waDigits
    ? `<a href="https://wa.me/${waDigits}" style="color:#0B3A67">${esc(d.phoneIntl)}</a>`
    : esc(d.phoneIntl);
  const html =
`<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:620px;margin:0 auto">
  <h2 style="font-size:17px;color:#0B3A67;margin:0 0 16px">Nouvelle demande de devis</h2>
  <table style="width:100%;border-collapse:collapse">
    ${row('Nom', d.name)}
    <tr><td style="padding:6px 0;color:#64758a;font-size:13px;vertical-align:top;width:170px">Téléphone / WhatsApp</td><td style="padding:6px 0;color:#0f2136;font-size:14px">${phoneCell}</td></tr>
    ${row('Email', d.email)}
    ${row("Type d'embarcation", d.boatType)}
    ${row('Message / besoin', d.message)}
    <tr><td style="padding:6px 0;color:#64758a;font-size:13px;vertical-align:top">Photos du bateau</td>
        <td style="padding:6px 0">${photosHtml}</td></tr>
    ${row('Date', when)}
  </table>
</div>`;

  return { text, html };
}

// Returns { ok: true, dev?: boolean }. Throws on misconfiguration or send failure.
export async function sendQuoteEmail(d) {
  const to = (process.env.CONTACT_EMAIL || 'contact@leclatdesflots.fr').trim();
  const from = (process.env.QUOTE_FROM_EMAIL || '').trim();
  const subject = "Nouvelle demande de devis — L'Éclat des Flots";
  const { text, html } = buildBodies(d);
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev-only outbox for local testing — must be explicitly enabled, and never
    // available in production. Writes the composed email to disk (nothing sent).
    if (!isProd() && /^(1|true|yes|on)$/i.test(process.env.QUOTE_DEV_OUTBOX || '')) {
      const dir = path.join(process.cwd(), '.data', 'outbox');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, `${d.stamp}.json`), JSON.stringify({ to, from, subject, replyTo: d.email, text, html }, null, 2));
      return { ok: true, dev: true };
    }
    const err = new Error('EMAIL_NOT_CONFIGURED');
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }

  if (!from) { const e = new Error('FROM_NOT_CONFIGURED'); e.code = 'FROM_NOT_CONFIGURED'; throw e; }

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: d.email, subject, text, html }),
  });

  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()).slice(0, 300); } catch {}
    const e = new Error(`RESEND_ERROR ${res.status}`);
    e.code = 'RESEND_ERROR';
    e.detail = detail; // safe: Resend error, no secret
    throw e;
  }
  return { ok: true };
}
