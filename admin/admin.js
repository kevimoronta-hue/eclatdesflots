/* admin/admin.js — back-office SPA (vanilla JS, no framework, no localStorage tokens) */
(function () {
  'use strict';

  var root = document.getElementById('root');
  var toastEl = document.getElementById('toast');

  var state = { schema: null, content: null, meta: null, pending: {} };

  /* ------------------------------ helpers ------------------------------ */
  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = {};
    var mutating = opts.method && opts.method !== 'GET';
    if (mutating) headers['X-CSRF-Token'] = getCookie('admin_csrf');
    var body = opts.body;
    if (opts.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.json); }
    if (opts.uploadType) headers['Content-Type'] = opts.uploadType;
    return fetch(path, {
      method: opts.method || 'GET',
      headers: headers,
      body: body,
      credentials: 'same-origin',
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        return { status: r.status, ok: r.ok, data: data };
      });
    });
  }

  function toast(msg, isErr) {
    toastEl.textContent = msg;
    toastEl.className = 'toast show' + (isErr ? ' err' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.className = 'toast'; }, 2600);
  }

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function clear() { root.innerHTML = ''; }

  /* --------------------- password rules live check --------------------- */
  var RULES = [
    { t: 'Au moins 10 caractères', f: function (p) { return p.length >= 10; } },
    { t: 'Une minuscule', f: function (p) { return /[a-z]/.test(p); } },
    { t: 'Une majuscule', f: function (p) { return /[A-Z]/.test(p); } },
    { t: 'Un chiffre', f: function (p) { return /[0-9]/.test(p); } },
    { t: 'Un caractère spécial', f: function (p) { return /[^A-Za-z0-9]/.test(p); } },
  ];
  function rulesList(getVal) {
    var ul = el('ul', { class: 'rules' });
    RULES.forEach(function (r) { ul.appendChild(el('li', { text: r.t })); });
    function update() {
      var v = getVal();
      Array.prototype.forEach.call(ul.children, function (li, i) { li.className = RULES[i].f(v) ? 'ok' : ''; });
    }
    return { node: ul, update: update };
  }

  /* ------------------------------ screens ------------------------------ */

  function showPreviewBanner() {
    if (document.getElementById('preview-banner')) return;
    var bar = el('div', { id: 'preview-banner', class: 'preview-banner' }, [
      '● MODE PREVIEW — aucune modification ne sera enregistrée',
    ]);
    document.body.appendChild(bar);
    document.body.classList.add('has-preview-banner');
  }

  function boot() {
    api('/api/auth/session').then(function (res) {
      var d = res.data || {};
      if (d.preview) showPreviewBanner();
      state.mustChangePassword = !!(d.authenticated && d.mustChangePassword);
      if (d.authenticated) return loadDashboard();
      if (d.locked) return showLocked();
      return showLogin();
    }).catch(function () { showLogin(); });
  }

  function showLogin(prefillMsg) {
    clear();
    var user = el('input', { type: 'text', id: 'u', autocomplete: 'username', value: 'admin' });
    var pass = el('input', { type: 'password', id: 'p', autocomplete: 'current-password' });
    var msg = el('p', { class: 'msg' + (prefillMsg ? ' err' : ''), text: prefillMsg || '' });
    var btn = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, ['Se connecter']);

    function submit(e) {
      e.preventDefault();
      msg.className = 'msg'; msg.textContent = '';
      btn.disabled = true;
      api('/api/auth/login', { method: 'POST', json: { username: user.value.trim(), password: pass.value } })
        .then(function (res) {
          btn.disabled = false;
          if (res.data && res.data.locked) return showLocked();
          if (!res.ok) { msg.className = 'msg err'; msg.textContent = (res.data && res.data.error) || 'Connexion impossible.'; return; }
          state.mustChangePassword = !!res.data.mustChangePassword;
          loadDashboard();
        }).catch(function () { btn.disabled = false; msg.className = 'msg err'; msg.textContent = 'Erreur réseau.'; });
    }

    var form = el('form', { onsubmit: submit }, [
      el('div', { class: 'auth-logo' }, [el('img', { src: '/assets/logo-nav.png', alt: "L'Éclat des Flots" })]),
      el('h1', { text: 'Administration' }),
      el('p', { class: 'sub', text: 'Connectez-vous pour gérer le contenu du site.' }),
      el('div', { class: 'field' }, [el('label', { text: 'Identifiant' }), user]),
      el('div', { class: 'field' }, [el('label', { text: 'Mot de passe' }), pass]),
      btn, msg,
    ]);
    root.appendChild(el('div', { class: 'auth-wrap' }, [el('div', { class: 'auth-card' }, [form])]));
    pass.focus();
  }

  function showLocked() {
    clear();
    var key = el('input', { type: 'password', id: 'k', autocomplete: 'off' });
    var msg = el('p', { class: 'msg' });
    var btn = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, ['Débloquer l’accès']);

    function submit(e) {
      e.preventDefault();
      msg.className = 'msg'; msg.textContent = '';
      btn.disabled = true;
      api('/api/auth/unlock', { method: 'POST', json: { key: key.value } })
        .then(function (res) {
          btn.disabled = false;
          if (res.ok && res.data.ok) { showLogin('Accès débloqué. Vous pouvez vous reconnecter.'); return; }
          msg.className = 'msg err'; msg.textContent = (res.data && res.data.error) || 'Clé invalide.';
        }).catch(function () { btn.disabled = false; msg.className = 'msg err'; msg.textContent = 'Erreur réseau.'; });
    }

    var form = el('form', { onsubmit: submit }, [
      el('span', { class: 'locked-badge', text: 'Accès verrouillé' }),
      el('h1', { text: 'Accès administrateur verrouillé' }),
      el('p', { class: 'sub', text: 'Trop de tentatives de connexion. Saisissez la clé de récupération pour rétablir l’accès.' }),
      el('div', { class: 'field' }, [el('label', { text: 'Clé de déblocage' }), key]),
      btn, msg,
    ]);
    root.appendChild(el('div', { class: 'auth-wrap' }, [el('div', { class: 'auth-card' }, [form])]));
    key.focus();
  }

  function showForceChange() {
    clear();
    var oldp = el('input', { type: 'password', autocomplete: 'current-password' });
    var np = el('input', { type: 'password', autocomplete: 'new-password' });
    var cf = el('input', { type: 'password', autocomplete: 'new-password' });
    var rules = rulesList(function () { return np.value; });
    np.addEventListener('input', rules.update);
    var msg = el('p', { class: 'msg' });
    var btn = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, ['Enregistrer le nouveau mot de passe']);

    function submit(e) {
      e.preventDefault();
      msg.className = 'msg'; msg.textContent = '';
      btn.disabled = true;
      api('/api/auth/change-password', { method: 'POST', json: { oldPassword: oldp.value, newPassword: np.value, confirm: cf.value } })
        .then(function (res) {
          btn.disabled = false;
          if (res.ok && res.data.ok) { toast('Mot de passe mis à jour.'); loadDashboard(); return; }
          msg.className = 'msg err'; msg.textContent = (res.data && res.data.error) || 'Impossible de changer le mot de passe.';
        }).catch(function () { btn.disabled = false; msg.className = 'msg err'; msg.textContent = 'Erreur réseau.'; });
    }

    var form = el('form', { onsubmit: submit }, [
      el('p', { class: 'brand', text: "L'Éclat des Flots" }),
      el('h1', { text: 'Changer le mot de passe' }),
      el('p', { class: 'sub', text: 'Pour votre sécurité, définissez un nouveau mot de passe avant d’accéder au tableau de bord.' }),
      el('div', { class: 'field' }, [el('label', { text: 'Ancien mot de passe' }), oldp]),
      el('div', { class: 'field' }, [el('label', { text: 'Nouveau mot de passe' }), np]),
      rules.node,
      el('div', { class: 'field', style: 'margin-top:12px' }, [el('label', { text: 'Confirmer le nouveau mot de passe' }), cf]),
      btn, msg,
    ]);
    root.appendChild(el('div', { class: 'auth-wrap' }, [el('div', { class: 'auth-card' }, [form])]));
    rules.update();
    oldp.focus();
  }

  /* ----------------------------- dashboard ----------------------------- */

  function loadDashboard() {
    Promise.all([api('/api/schema'), api('/api/content')]).then(function (r) {
      if (r[0].status === 403) return showLogin();
      if (!r[0].ok) return showLogin();
      state.schema = r[0].data.sections;
      state.content = r[1].data.content;
      state.meta = r[1].data.meta || {};
      state.pending = {};
      renderShell('content');
    }).catch(function () { showLogin(); });
  }

  var activeView = 'content';

  function renderShell(view) {
    activeView = view;
    clear();
    var navItems = [
      { id: 'content', label: 'Contenus' },
      { id: 'history', label: 'Historique' },
      { id: 'security', label: 'Sécurité' },
    ];
    var nav = el('nav', { class: 'nav' }, navItems.map(function (it) {
      return el('button', { class: it.id === view ? 'active' : '', onclick: function () { renderShell(it.id); } }, [it.label]);
    }));
    var logoutBtn = el('button', { class: 'btn btn-logout', onclick: doLogout }, ['Se déconnecter']);
    var sidebar = el('aside', { class: 'sidebar' }, [
      el('div', { class: 'logo' }, [el('img', { src: '/assets/logo-footer.png', alt: "L'Éclat des Flots" })]),
      nav,
      el('div', { class: 'foot' }, [logoutBtn]),
    ]);
    var main = el('main', { class: 'main', id: 'main' });
    root.appendChild(el('div', { class: 'app' }, [sidebar, main]));

    // Rappel discret tant que le mot de passe initial « admin » est en place.
    // Non bloquant : l'admin accède au dashboard et peut définir son mot de passe
    // quand il le souhaite depuis l'onglet Sécurité.
    if (state.mustChangePassword && view !== 'security') {
      main.appendChild(el('div', {
        style: 'display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 18px;padding:12px 16px;border:1px solid #E4C36B;background:#FDF6E3;border-radius:10px;font-size:13.5px;color:#6B5514',
      }, [
        el('span', { text: 'Mot de passe initial utilisé. Pensez à définir votre mot de passe personnel.' }),
        el('button', { class: 'btn btn-primary', style: 'flex:none', onclick: function () { renderShell('security'); } }, ['Changer le mot de passe']),
      ]));
    }

    if (view === 'content') renderContent(main);
    else if (view === 'history') renderHistory(main);
    else if (view === 'security') renderSecurity(main);
  }

  function doLogout() {
    api('/api/auth/logout', { method: 'POST' }).then(function () { showLogin('Vous êtes déconnecté.'); });
  }

  /* --------------------------- content editor -------------------------- */

  function renderContent(main) {
    var head = el('div', { class: 'main-head' }, [
      el('h2', { text: 'Contenus du site' }),
      el('div', { class: 'meta', text: state.meta && state.meta.updatedAt ? ('Dernière modification : ' + fmtDate(state.meta.updatedAt) + (state.meta.updatedBy ? ' · ' + state.meta.updatedBy : '')) : 'Aucune modification enregistrée.' }),
    ]);
    main.appendChild(el('p', { class: 'content-hint', text: 'Cliquez sur une section pour la déplier. Chaque section s’enregistre indépendamment.' }));
    main.appendChild(head);

    state.schema.forEach(function (section, i) {
      main.appendChild(renderSectionCard(section, i === 0));
    });
  }

  function renderSectionCard(section, openFirst) {
    var inputs = {}; // key -> element (for text/select) ; image uses state.pending
    var card = el('div', { class: 'card section-card' + (openFirst ? ' open' : '') });
    var count = section.fields.length;
    var header = el('button', { class: 'section-head', type: 'button' }, [
      el('span', { class: 'section-chevron', text: '▸' }),
      el('span', { class: 'section-title', text: section.label }),
      el('span', { class: 'section-count', text: count + ' champ' + (count > 1 ? 's' : '') }),
    ]);
    header.addEventListener('click', function () { card.classList.toggle('open'); });
    card.appendChild(header);
    var body = el('div', { class: 'section-body' });
    card.appendChild(body);

    section.fields.forEach(function (f) {
      var val = valueOf(f.key);
      var fieldWrap = el('div', { class: 'field' }, [el('label', { text: f.label })]);
      if (f.type === 'image') {
        var prev = el('img', { class: 'img-prev', alt: '' });
        prev.src = val;
        var replaceBtn = el('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { pickImage(f, prev); } }, ['Remplacer']);
        var resetBtn = el('button', { type: 'button', class: 'btn btn-ghost', onclick: function () {
          confirmModal('Rétablir l’image par défaut ?', 'L’image d’origine du projet sera restaurée après enregistrement.', function () {
            state.pending[f.key] = f.default; prev.src = f.default; toast('Image réinitialisée (à enregistrer).');
          });
        } }, ['Image par défaut']);
        fieldWrap.appendChild(el('div', { class: 'img-field' }, [
          prev,
          el('div', { class: 'img-controls' }, [
            el('div', { class: 'img-actions' }, [replaceBtn, resetBtn]),
            el('p', { class: 'hint', text: 'JPG, PNG ou WEBP · 8 Mo max.' }),
          ]),
        ]));
      } else if (f.type === 'multiline') {
        var ta = el('textarea', {}); ta.value = val; inputs[f.key] = ta;
        fieldWrap.appendChild(ta);
      } else if (f.type === 'stars') {
        var sel = el('select', {});
        for (var sv = 1; sv <= 5; sv++) {
          var opt = el('option', { value: String(sv) }, [sv + ' étoile' + (sv > 1 ? 's' : '')]);
          if (String(val) === String(sv)) opt.selected = true;
          sel.appendChild(opt);
        }
        inputs[f.key] = sel;
        fieldWrap.appendChild(sel);
      } else {
        var typeAttr = f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : f.type === 'tel' ? 'tel' : 'text';
        var inp = el('input', { type: typeAttr }); inp.value = val; inputs[f.key] = inp;
        fieldWrap.appendChild(inp);
      }
      body.appendChild(fieldWrap);
    });

    var msg = el('p', { class: 'msg' });
    var saveBtn = el('button', { class: 'btn btn-primary', type: 'button' }, ['Enregistrer']);
    var resetSection = el('button', { class: 'btn btn-ghost', type: 'button' }, ['Réinitialiser la section']);

    saveBtn.addEventListener('click', function () {
      var updates = collectUpdates(section, inputs);
      var keys = Object.keys(updates);
      if (!keys.length) { toast('Aucune modification.'); return; }
      var imageChanged = section.fields.some(function (f) { return f.type === 'image' && updates.hasOwnProperty(f.key); });
      var doSave = function () { saveUpdates(updates, saveBtn, msg); };
      if (imageChanged) confirmModal('Confirmer les modifications d’images ?', 'Les images sélectionnées remplaceront celles actuellement en ligne.', doSave);
      else doSave();
    });

    resetSection.addEventListener('click', function () {
      confirmModal('Réinitialiser cette section ?', 'Tous les champs de « ' + section.label + ' » reviendront au contenu d’origine.', function () {
        var updates = {};
        section.fields.forEach(function (f) { if (valueOf(f.key) !== f.default) updates[f.key] = f.default; });
        if (!Object.keys(updates).length) { toast('Déjà au contenu d’origine.'); return; }
        saveUpdates(updates, resetSection, msg, true);
      });
    });

    body.appendChild(el('div', { class: 'section-actions' }, [saveBtn, resetSection, msg]));
    return card;
  }

  function valueOf(key) {
    if (state.pending.hasOwnProperty(key)) return state.pending[key];
    return state.content[key];
  }

  function collectUpdates(section, inputs) {
    var updates = {};
    section.fields.forEach(function (f) {
      var current = state.content[f.key];
      var next;
      if (f.type === 'image') { if (!state.pending.hasOwnProperty(f.key)) return; next = state.pending[f.key]; }
      else next = inputs[f.key].value;
      if (next !== current) updates[f.key] = next;
    });
    return updates;
  }

  function saveUpdates(updates, btn, msg, isReset) {
    btn.disabled = true; msg.className = 'msg'; msg.textContent = '';
    api('/api/content', { method: 'PUT', json: { updates: updates } }).then(function (res) {
      btn.disabled = false;
      if (res.status === 403) { showLogin(); return; }
      if (!res.ok) {
        msg.className = 'msg err';
        msg.textContent = (res.data && res.data.error) || 'Enregistrement impossible.';
        if (res.data && res.data.fields) {
          var first = Object.keys(res.data.fields)[0];
          if (first) msg.textContent += ' (' + res.data.fields[first] + ')';
        }
        return;
      }
      state.content = res.data.content;
      state.meta = res.data.meta || state.meta;
      // clear pending for saved keys
      Object.keys(updates).forEach(function (k) { delete state.pending[k]; });
      toast(isReset ? 'Section réinitialisée.' : 'Modifications enregistrées.');
      renderShell('content');
    }).catch(function () { btn.disabled = false; msg.className = 'msg err'; msg.textContent = 'Erreur réseau.'; });
  }

  function pickImage(field, prevImg) {
    var input = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      document.body.removeChild(input);
      if (!file) return;
      if (['image/jpeg', 'image/png', 'image/webp'].indexOf(file.type) < 0) { toast('Format non supporté (JPG, PNG, WEBP).', true); return; }
      if (file.size > 8 * 1024 * 1024) { toast('Image trop lourde (8 Mo max).', true); return; }
      toast('Envoi de l’image…');
      api('/api/upload', { method: 'POST', body: file, uploadType: file.type }).then(function (res) {
        if (res.status === 403) { showLogin(); return; }
        if (!res.ok || !res.data.url) { toast((res.data && res.data.error) || 'Échec de l’upload.', true); return; }
        state.pending[field.key] = res.data.url;
        prevImg.src = res.data.url;
        toast('Image prête — cliquez sur Enregistrer.');
      }).catch(function () { toast('Erreur réseau lors de l’upload.', true); });
    });
    input.click();
  }

  /* ------------------------------ history ------------------------------ */

  function renderHistory(main) {
    main.appendChild(el('div', { class: 'main-head' }, [el('h2', { text: 'Historique des modifications' })]));
    var card = el('div', { class: 'card' });
    card.appendChild(el('p', { class: 'card-sub', text: 'Dernières modifications de contenu (50 max).' }));
    var listWrap = el('ul', { class: 'hist', style: 'list-style:none;margin:0;padding:0' });
    card.appendChild(listWrap);
    main.appendChild(card);
    api('/api/history').then(function (res) {
      if (!res.ok) { listWrap.appendChild(el('li', { text: 'Historique indisponible.' })); return; }
      var entries = res.data.entries || [];
      if (!entries.length) { listWrap.appendChild(el('li', { text: 'Aucune modification pour le moment.' })); return; }
      entries.forEach(function (h) {
        listWrap.appendChild(el('li', {}, [
          el('div', {}, [el('span', { class: 'k', text: h.key }), ' — ', el('span', { class: 'when', text: fmtDate(h.at) + (h.by ? ' · ' + h.by : '') })]),
          el('div', { class: 'when', text: truncate(h.oldValue) + '  →  ' + truncate(h.newValue) }),
        ]));
      });
    });
  }

  /* ------------------------------ security ----------------------------- */

  function renderSecurity(main) {
    main.appendChild(el('div', { class: 'main-head' }, [el('h2', { text: 'Sécurité' })]));
    var card = el('div', { class: 'card' });
    card.appendChild(el('h3', { text: 'Changer le mot de passe' }));
    card.appendChild(el('p', { class: 'card-sub', text: 'Choisissez un mot de passe robuste. Vous pouvez aussi déconnecter les autres sessions.' }));

    var oldp = el('input', { type: 'password', autocomplete: 'current-password' });
    var np = el('input', { type: 'password', autocomplete: 'new-password' });
    var cf = el('input', { type: 'password', autocomplete: 'new-password' });
    var rules = rulesList(function () { return np.value; });
    np.addEventListener('input', rules.update);
    var invalidate = el('input', { type: 'checkbox' }); invalidate.checked = true;
    var msg = el('p', { class: 'msg' });
    var btn = el('button', { class: 'btn btn-primary', type: 'submit' }, ['Mettre à jour le mot de passe']);

    function submit(e) {
      e.preventDefault();
      msg.className = 'msg'; msg.textContent = ''; btn.disabled = true;
      api('/api/auth/change-password', { method: 'POST', json: {
        oldPassword: oldp.value, newPassword: np.value, confirm: cf.value, invalidateOthers: invalidate.checked,
      } }).then(function (res) {
        btn.disabled = false;
        if (res.ok && res.data.ok) {
          state.mustChangePassword = false; // « admin » n'est plus valide : on retire le rappel
          oldp.value = np.value = cf.value = ''; rules.update();
          msg.className = 'msg ok'; msg.textContent = 'Mot de passe mis à jour.'; toast('Mot de passe mis à jour.');
        } else { msg.className = 'msg err'; msg.textContent = (res.data && res.data.error) || 'Échec.'; }
      }).catch(function () { btn.disabled = false; msg.className = 'msg err'; msg.textContent = 'Erreur réseau.'; });
    }

    var form = el('form', { onsubmit: submit }, [
      el('div', { class: 'field' }, [el('label', { text: 'Ancien mot de passe' }), oldp]),
      el('div', { class: 'field' }, [el('label', { text: 'Nouveau mot de passe' }), np]),
      rules.node,
      el('div', { class: 'field', style: 'margin-top:12px' }, [el('label', { text: 'Confirmer' }), cf]),
      el('label', { style: 'display:flex;gap:8px;align-items:center;font-size:13px;color:var(--muted);margin:6px 0 16px' }, [invalidate, 'Déconnecter les autres sessions ouvertes']),
      btn, msg,
    ]);
    card.appendChild(form);
    main.appendChild(card);
    rules.update();
  }

  /* ------------------------------ modal ------------------------------- */
  function confirmModal(title, body, onYes) {
    var back = el('div', { class: 'modal-back' });
    var yes = el('button', { class: 'btn btn-primary' }, ['Confirmer']);
    var no = el('button', { class: 'btn btn-ghost' }, ['Annuler']);
    no.addEventListener('click', function () { document.body.removeChild(back); });
    yes.addEventListener('click', function () { document.body.removeChild(back); onYes(); });
    back.addEventListener('click', function (e) { if (e.target === back) document.body.removeChild(back); });
    back.appendChild(el('div', { class: 'modal' }, [
      el('h3', { text: title }),
      el('p', { text: body }),
      el('div', { class: 'row' }, [no, yes]),
    ]));
    document.body.appendChild(back);
  }

  /* ------------------------------ utils ------------------------------- */
  function fmtDate(iso) {
    try { var d = new Date(iso); return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (e) { return iso || ''; }
  }
  function truncate(s) { s = String(s == null ? '' : s); return s.length > 60 ? s.slice(0, 57) + '…' : s; }

  boot();
})();
