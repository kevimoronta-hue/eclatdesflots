// tests/quote-flow.mjs — validation + send-path tests for POST /api/quote.
// Start the server with QUOTE_DEV_OUTBOX=true so the success path writes to
// .data/outbox instead of sending a real email. Run: node tests/quote-flow.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:5173';
const OUTBOX = path.join(process.cwd(), '.data', 'outbox');
let ipc = 0, pass = 0, fail = 0;

async function post(payload, sameIp) {
  const headers = { 'Content-Type': 'application/json' };
  headers['X-Forwarded-For'] = sameIp || `10.1.0.${(ipc++ % 250) + 1}`;
  const res = await fetch(BASE + '/api/quote', { method: 'POST', headers, body: JSON.stringify(payload) });
  let data = {}; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
async function outboxCount() { try { return (await fs.readdir(OUTBOX)).length; } catch { return 0; } }
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else { fail++; console.log(`  \x1b[31m✗ ${name}\x1b[0m${extra !== undefined ? '  ' + JSON.stringify(extra) : ''}`); }
}

const VALID = {
  name: 'Jean Test', email: 'jean@example.com', phone: '06 63 68 41 47', phoneCountry: 'FR',
  boatType: 'Péniche', boatTypeOther: '', message: 'Bonjour, je souhaite un devis pour ma coque.', company: '', photos: [],
};

async function main() {
  await fs.rm(path.join(process.cwd(), '.data'), { recursive: true, force: true });

  console.log('\nValidation (server-side)');
  let r = await post({});
  check('A. all empty → 400 + field errors', r.status === 400 && r.data.fields && r.data.fields.name && r.data.fields.email, r.data);
  r = await post({ ...VALID, message: '' });
  check('B. missing message → 400', r.status === 400 && r.data.fields && r.data.fields.message, r.data);
  r = await post({ ...VALID, email: 'not-an-email' });
  check('C. invalid email → 400', r.status === 400 && r.data.fields && r.data.fields.email, r.data);
  r = await post({ ...VALID, phone: '' });
  check('D. empty phone → 400', r.status === 400 && r.data.fields && r.data.fields.phone, r.data);
  r = await post({ ...VALID, phone: '12' });
  check('D2. invalid (too short) phone → 400', r.status === 400 && r.data.fields && r.data.fields.phone, r.data);
  r = await post({ ...VALID, phone: '06 63 68 41 47', phoneCountry: 'US' });
  check('D3. FR number under US country → 400', r.status === 400 && r.data.fields && r.data.fields.phone, r.data);
  r = await post({ ...VALID, boatType: '' });
  check('E. empty boat type → 400', r.status === 400 && r.data.fields && r.data.fields.boatType, r.data);
  r = await post({ ...VALID, boatType: 'Autre', boatTypeOther: '' });
  check('E2. "Autre" without precision → 400', r.status === 400 && r.data.fields && r.data.fields.boatTypeOther, r.data);

  console.log('\nType d’embarcation → email');
  let bt = await outboxCount();
  r = await post({ ...VALID, boatType: 'Yacht fluvial' });
  let mailOk = false;
  if (r.status === 200) { const fs2 = (await fs.readdir(OUTBOX)).sort(); const m = JSON.parse(await fs.readFile(path.join(OUTBOX, fs2[fs2.length - 1]), 'utf8')); mailOk = m.text.includes('Yacht fluvial'); }
  check('normal type appears in email ("Yacht fluvial")', r.status === 200 && mailOk && (await outboxCount()) === bt + 1, r.data);
  bt = await outboxCount();
  r = await post({ ...VALID, boatType: 'Autre', boatTypeOther: 'Jet-ski de collection' });
  let autreOk = false;
  if (r.status === 200) { const fs2 = (await fs.readdir(OUTBOX)).sort(); const m = JSON.parse(await fs.readFile(path.join(OUTBOX, fs2[fs2.length - 1]), 'utf8')); autreOk = m.text.includes('Autre — Jet-ski de collection'); }
  check('"Autre" precision appears in email ("Autre — …")', r.status === 200 && autreOk && (await outboxCount()) === bt + 1, r.data);

  console.log('\nInternational phone (validate + normalize E.164)');
  const cases = [
    { c: 'FR', n: '06 63 68 41 47', e164: '+33663684147', intl: '+33 6 63 68 41 47' },
    { c: 'DO', n: '809 234 5678',   e164: '+18092345678' },
    { c: 'US', n: '(213) 373-4253', e164: '+12133734253' },
    { c: 'ES', n: '612 34 56 78',   e164: '+34612345678' },
    { c: 'GB', n: '07911 123456',   e164: '+447911123456' },
  ];
  for (const t of cases) {
    const b = await outboxCount();
    const rr = await post({ ...VALID, phone: t.n, phoneCountry: t.c });
    let e164ok = rr.status === 200 && rr.data.ok === true;
    let mailok = false;
    if (e164ok) {
      const files = (await fs.readdir(OUTBOX)).sort();
      const mail = JSON.parse(await fs.readFile(path.join(OUTBOX, files[files.length - 1]), 'utf8'));
      const wa = 'https://wa.me/' + t.e164.replace(/\D/g, '');
      mailok = mail.html.includes(wa);
      if (t.intl) mailok = mailok && mail.text.includes(t.intl);
    }
    check(`${t.c} ${t.n} → E.164 ${t.e164}, wa.me link in email`, e164ok && mailok && (await outboxCount()) === b + 1, rr.data);
  }

  console.log('\nPhotos (server revalidation)');
  r = await post({ ...VALID, photos: [{ url: 'https://evil.example.com/x.jpg', size: 1000, type: 'image/jpeg' }] });
  check('G. disallowed photo host → 400', r.status === 400 && /autoris/i.test(r.data.error || ''), r.data);
  r = await post({ ...VALID, photos: [{ url: 'https://abc.public.blob.vercel-storage.com/x.jpg', size: 9 * 1024 * 1024, type: 'image/jpeg' }] });
  check('F. oversized photo (>8Mo) → 400', r.status === 400 && /8\s*Mo/i.test(r.data.error || ''), r.data);
  r = await post({ ...VALID, photos: [{ url: 'https://abc.public.blob.vercel-storage.com/x.exe', size: 1000, type: 'application/x-msdownload' }] });
  check('G2. disallowed photo type → 400', r.status === 400, r.data);

  console.log('\nSuccess path (dev outbox)');
  let before = await outboxCount();
  r = await post({ ...VALID });
  check('H. valid text-only → 200 ok', r.status === 200 && r.data.ok === true, r.data);
  let after = await outboxCount();
  check('I. email composed to recipient (outbox +1)', after === before + 1, { before, after });
  // verify recipient + reply-to in the composed email
  if (after > before) {
    const files = (await fs.readdir(OUTBOX)).sort();
    const mail = JSON.parse(await fs.readFile(path.join(OUTBOX, files[files.length - 1]), 'utf8'));
    check('I2. recipient = contact@eclatdesflots.fr', mail.to === 'contact@eclatdesflots.fr', mail.to);
    check('J. reply-to = prospect email', mail.replyTo === VALID.email, mail.replyTo);
    check('J2. subject correct', /Nouvelle demande de devis/.test(mail.subject), mail.subject);
  }

  console.log('\nValid with allowed Blob photo');
  before = await outboxCount();
  r = await post({ ...VALID, photos: [{ url: 'https://abc.public.blob.vercel-storage.com/devis-photos/x.jpg', size: 500000, name: 'coque.jpg', type: 'image/jpeg' }] });
  check('valid + blob photo link → 200 ok', r.status === 200 && r.data.ok === true, r.data);
  check('outbox +1 with photo', (await outboxCount()) === before + 1);

  console.log('\nHoneypot');
  before = await outboxCount();
  r = await post({ ...VALID, company: 'spam-bot' });
  check('honeypot → 200 but NOT sent (no outbox increase)', r.status === 200 && (await outboxCount()) === before, r.data);

  console.log('\nRate limit (same IP)');
  let got429 = false;
  for (let i = 0; i < 7; i++) { const rr = await post({ ...VALID }, '198.51.100.7'); if (rr.status === 429) got429 = true; }
  check('L2. burst same IP eventually 429', got429 === true);

  console.log(`\n${fail === 0 ? '\x1b[32m' : '\x1b[31m'}${pass} passed, ${fail} failed\x1b[0m\n`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
