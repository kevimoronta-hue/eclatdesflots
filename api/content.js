// api/content.js
// GET  (public) -> merged content { defaults + stored overrides } in ONE payload.
// PUT  (admin)  -> validate + persist edited fields, with a small history log.

import { getJSON, setJSON, listPushCapped, listGet } from './_lib/store.js';
import { getSession, checkCsrf } from './_lib/auth.js';
import { json, readJson, logEvent } from './_lib/http.js';
import { DEFAULTS, validateField, isValidKey } from '../cms/schema.js';

const DATA_KEY = 'content:data';
const META_KEY = 'content:meta';
const HIST_KEY = 'content:history';
const MIGRATION_KEY = 'content:migrations';

// One-time content migrations.
// When a hard-coded default is improved but the CMS already persisted the OLD
// default as an override (so it keeps winning), this rewrites that stored value
// to the new one — so the served content updates WITHOUT any manual /admin edit.
// Safeguards: each migration runs at most once (persistent flag), and a value is
// only rewritten when it still equals the exact OLD default, so anything the
// owner has since customised is never touched. After it runs, the field stays
// fully editable from /admin (a later edit wins; the migration never re-fires).
const CONTENT_MIGRATIONS = [
  {
    id: 'heroTitleV1',
    key: 'hero.title',
    from: 'Un savoir-faire français au service de votre embarcation.',
    to: 'Rénovation et entretien de bateaux et péniches, un savoir-faire français.',
  },
];

let migrationsCheckedThisInstance = false;

async function applyContentMigrations() {
  if (migrationsCheckedThisInstance) return;
  let done;
  try { done = (await getJSON(MIGRATION_KEY)) || {}; } catch { return; } // store down: skip silently
  const pending = CONTENT_MIGRATIONS.filter((m) => !done[m.id]);
  if (!pending.length) { migrationsCheckedThisInstance = true; return; }

  const overrides = (await getJSON(DATA_KEY)) || {};
  let dataChanged = false;
  for (const m of pending) {
    if (overrides[m.key] === m.from) { overrides[m.key] = m.to; dataChanged = true; }
    done[m.id] = true;
  }
  if (dataChanged) await setJSON(DATA_KEY, overrides);
  await setJSON(MIGRATION_KEY, done);
  migrationsCheckedThisInstance = true;
}

async function loadMerged() {
  const overrides = (await getJSON(DATA_KEY)) || {};
  const meta = (await getJSON(META_KEY)) || {};
  return { content: { ...DEFAULTS, ...overrides }, meta, overrides };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    await applyContentMigrations();
    const { content, meta } = await loadMerged();
    // Public: allow brief CDN caching but keep it fresh enough that edits appear quickly.
    res.setHeader('Cache-Control', 'no-store');
    return json(res, 200, { content, meta });
  }

  if (req.method === 'PUT') {
    const session = await getSession(req);
    if (!session) return json(res, 401, { error: 'Non authentifié.' });
    if (session.user.mustChangePassword) return json(res, 403, { error: 'Changement de mot de passe requis.' });
    if (!checkCsrf(req)) return json(res, 403, { error: 'Requête invalide.' });

    const body = await readJson(req);
    if (!body || typeof body.updates !== 'object' || !body.updates) {
      return json(res, 400, { error: 'Corps de requête invalide.' });
    }

    const { overrides } = await loadMerged();
    const next = { ...overrides };
    const applied = [];
    const errors = {};

    for (const [key, raw] of Object.entries(body.updates)) {
      if (!isValidKey(key)) { errors[key] = 'Champ inconnu.'; continue; }
      const v = validateField(key, raw);
      if (!v.ok) { errors[key] = v.error; continue; }
      const oldValue = Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : DEFAULTS[key];
      if (v.value === oldValue) continue; // no-op
      next[key] = v.value;
      applied.push({ key, oldValue, newValue: v.value });
    }

    if (Object.keys(errors).length) {
      return json(res, 400, { error: 'Certains champs sont invalides.', fields: errors });
    }

    if (applied.length) {
      await setJSON(DATA_KEY, next);
      const meta = { updatedAt: new Date().toISOString(), updatedBy: session.user.username };
      await setJSON(META_KEY, meta);
      for (const a of applied) {
        await listPushCapped(HIST_KEY, {
          key: a.key, oldValue: a.oldValue, newValue: a.newValue,
          at: meta.updatedAt, by: session.user.username,
        });
      }
      logEvent('content_updated', { by: session.user.username, keys: applied.map((a) => a.key) });
      return json(res, 200, { ok: true, content: { ...DEFAULTS, ...next }, meta, changed: applied.length });
    }

    return json(res, 200, { ok: true, content: { ...DEFAULTS, ...next }, changed: 0 });
  }

  res.setHeader('Allow', 'GET, PUT');
  return json(res, 405, { error: 'Méthode non autorisée.' });
}

// Exposed for the dedicated history endpoint.
export async function readHistory() {
  return listGet(HIST_KEY, 50);
}
