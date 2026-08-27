/* i18n.js — bilingual layer (FR default / EN) for L'Éclat des Flots
 * ------------------------------------------------------------------
 * DESIGN GOALS
 *  - The French site is the source of truth. Its hard-coded HTML is never
 *    touched when the visitor stays in French: this file does nothing at all.
 *  - English is served on the dedicated `/en` route (Vercel rewrites it to
 *    index.html). Language is carried by the URL, remembered in localStorage,
 *    and a switch is just a normal navigation/reload — no fragile in-place DOM
 *    juggling, no half-translated states.
 *  - We reuse the existing `data-cms="text:<key>"` bindings as translation
 *    keys, so most of the page needs no extra markup. The handful of strings
 *    that have no CMS binding carry `data-i18n*` attributes instead.
 *  - CMS hydration (/api/content, French) is skipped in English so it can
 *    never overwrite the translated copy.
 *
 * The design (layout, colours, glass, animations) is strictly unchanged:
 * only user-facing text, a few aria-labels/placeholders and the SEO head
 * are swapped.
 */
(function () {
  'use strict';

  // ---- Language detection --------------------------------------------------
  var path = location.pathname || '/';
  var isEnPath = /^\/en(\/|$)/.test(path);
  var isHomeRoot = path === '/' || path === '/index.html' || path === '/en' || path === '/en/';

  function readStored() {
    try { return localStorage.getItem('edf_lang'); } catch (e) { return null; }
  }
  function queryLang() {
    try { return new URLSearchParams(location.search).get('lang'); } catch (e) { return null; }
  }

  var lang = 'fr';
  if (isEnPath) {
    lang = 'en';
  } else {
    var q = queryLang();
    if (q === 'en') lang = 'en';
    else if (q === 'fr') lang = 'fr';
    else if ((path === '/' || path === '/index.html') && readStored() === 'en') {
      // Returning visitor who chose English: keep them there.
      try { localStorage.setItem('edf_lang', 'en'); } catch (e) {}
      location.replace('/en');
      return; // navigation takes over
    }
  }

  // ---- Dictionary ----------------------------------------------------------
  // `cms`  : keyed by the existing data-cms text keys (English values only —
  //          French stays in the DOM). `ui` : keyed by data-i18n attributes.
  var EN = {
    head: {
      title: "L'Éclat des Flots | Boat and Barge Renovation",
      description: "L'Éclat des Flots renovates, maintains and repairs boats, barges and inland waterway vessels: hull, paint, surface treatment and full refits, in dry dock or afloat.",
      ogDescription: "L'Éclat des Flots renovates, maintains and repairs boats, barges and inland waterway vessels: hull, paint, surface treatment and full refits, in dry dock or afloat.",
      twitterDescription: "L'Éclat des Flots renovates, maintains and repairs boats and barges: hull, paint and surface treatment, in dry dock or afloat.",
      url: "https://eclatdesflots.fr/en",
      locale: "en_GB"
    },
    cms: {
      'cta.devisLabel': 'Request a quote',
      'cta.rdvLabel': 'Book a meeting',
      'cta.title': "Send us a few photos. We'll tell you what really needs doing.",
      'cta.subtitle': 'A project manager replies within 24 business hours.',
      'hero.title': 'Boat and barge renovation and maintenance, French craftsmanship.',
      'hero.subtitle': 'Expertise, surface treatment and complete renovation for barges, floating homes, passenger boats, commercial vessels and pontoons. In dry dock or afloat.',
      'hero.ctaSecondary': 'See our work',
      'clients.heading': 'Trusted by',
      'stats.1.title': 'Diagnosis',
      'stats.1.sub': 'in full before pricing',
      'stats.2.title': 'Dry dock',
      'stats.2.sub': 'or work afloat',
      'stats.3.title': 'Skilled team',
      'stats.3.sub': 'professional-grade products',
      'stats.4.title': 'Quote in 72 h',
      'stats.4.sub': 'itemised line by line',
      'services.title': 'Three services, one standard',
      'services.subtitle': 'A single point of contact, a firm schedule, a handover file on delivery.',
      'services.1.title': 'Survey & diagnosis',
      'services.1.desc': 'On-board visit, assessment of the hull below and above the waterline, measurements and annotated photographs. You know what needs doing and what can wait.',
      'services.2.title': 'Painting & surface treatment',
      'services.2.desc': 'Routine upkeep or a full repaint, using professional systems suited to the inland waterway environment.',
      'services.3.title': 'Complete renovation',
      'services.3.desc': 'Stripping, anti-corrosion treatment, restoration of the hull below and above the waterline. Carried out in dry dock or afloat to suit your operations.',
      'embarcations.title': 'We work on every type of inland waterway vessel',
      'embarcations.1.label': 'Barges',
      'embarcations.2.label': 'Floating homes',
      'embarcations.3.label': 'Passenger boats',
      'embarcations.4.label': 'Commercial vessels',
      'embarcations.5.label': 'Pontoons',
      'methode.title': 'How a project unfolds',
      'methode.subtitle': 'Five steps, always the same, from the first survey to return to service.',
      'methode.1.title': 'Inspection & diagnosis',
      'methode.1.desc': 'We assess the condition of your vessel to identify the areas to treat and define the work required.',
      'methode.2.title': 'Surface preparation',
      'methode.2.desc': 'Stripping, cleaning, sanding and anti-corrosion treatment of the hull below and above the waterline, to prepare the substrates perfectly.',
      'methode.3.title': 'Coating application',
      'methode.3.desc': 'Application of the appropriate protection systems: epoxy, polyurethane, anti-rust and antifouling paints.',
      'methode.4.title': 'Inspection & finishing',
      'methode.4.desc': 'Every stage is checked to guarantee a durable, even finish that meets the demands of the inland waterway environment.',
      'methode.5.title': 'Handover',
      'methode.5.desc': 'The project is completed and the vessel is returned to service, ready to sail.',
      'realisations.title': 'Work that holds up to a close look',
      'project1.title': 'Hull renovation — Steel river yacht',
      'project2.title': 'Deck coating renovation',
      'project3.title': 'Renovation of the “Libellule”',
      'temoignages.title': 'Satisfaction, first and last',
      'temoignages.subtitle': 'Shipowners, operators and private owners tell the story of their project. Unfiltered.',
      'review1.text': '“Really clean work. The boat has been given a second life.”',
      'review2.text': '“Very happy with the finish. The result is even better than I pictured.”',
      'review3.text': '“A dependable team, responsive and above all very attentive to detail.”',
      'review4.text': '“The deck is unrecognisable. Careful work from start to handover.”',
      'review5.text': '“A beautiful renovation. You can feel the quality of the work straight away.”',
      'review6.text': '“Our boat really needed some care. The result is superb.”',
      'review7.text': '“Excellent work on the hull. Clean, professional and perfectly executed.”',
      'review8.text': '“They gave the boat all its character back. Very pleased with the result.”',
      'review9.text': '“Great advice and flawless work. Thanks to the whole team.”',
      'review10.text': '“The before/after difference is striking. Exactly the result we wanted.”',
      'review11.text': '“A project carried out with great care. The finish is truly excellent.”',
      'review12.text': '“A great experience from start to finish. The boat looks magnificent.”',
      'review13.text': '“Professional work, and results to match. I’d trust them with my boat again.”',
      'review14.text': '“A very well-executed renovation, with real attention to detail.”',
      'review15.text': '“The result speaks for itself. We’re delighted with this renovation.”',
      'devis.title': 'A few photos are all it takes to start',
      'devis.intro': 'Tell us the type of vessel, its current condition and your timeline. A project manager gets back to you within 72 hours with a detailed quote, no obligation.',
      'form.submitLabel': 'Send request',
      'faq.title': 'Frequently asked questions',
      'faq.subtitle': 'What people ask us before signing. Another question? Call us — we answer directly.',
      'faq.1.q': 'How long is the boat out of service?',
      'faq.1.a': 'It depends on the scope: two to five days for routine maintenance afloat, three to six weeks for a full strip-down with an epoxy system in dry dock. The duration is committed in the quote, with a relaunch date.',
      'faq.2.q': 'Do you work afloat or only in dry dock?',
      'faq.2.a': 'Both. Topsides, superstructures and maintenance touch-ups are done afloat. Stripping the underwater hull and antifouling require a dry dock: we arrange the haul-out and build it into the schedule.',
      'faq.3.q': 'Which products do you use?',
      'faq.3.a': 'Professional systems suited to fresh water: anti-rust primers, two-part epoxy, polyurethane topcoats and antifouling. The technical data sheets for the products applied are included in the handover file.',
      'faq.4.q': 'Which areas do you cover?',
      'faq.4.a': 'Île-de-France and the Seine–Oise–Marne basin for routine work, and the Seine–Nord Europe network for planned projects. Beyond that, travel is assessed case by case and priced in the quote.',
      'faq.5.q': 'Can you bid for public contracts?',
      'faq.5.a': 'Yes. We provide the company registration (KBIS), insurance certificates, references for comparable projects and a technical proposal. We can also bid as part of a consortium when the lot exceeds our scope.',
      'footer.copyright': '© 2026 L\'Éclat des Flots',
      'footer.legal1': 'Legal notice',
      'footer.legal2': 'Privacy policy'
    },
    ui: {
      'nav.services': 'Services',
      'nav.embarcations': 'Vessels',
      'nav.methode': 'Method',
      'nav.realisations': 'Work',
      'nav.contact': 'Contact',
      'nav.faq': 'FAQ',
      'nav.burgerOpen': 'Open menu',
      'video.label': 'Video — dry-dock project',
      'video.playpause': 'Play / pause',
      'video.play': 'Play video',
      'video.progress': 'Progress',
      'video.mute': 'Mute',
      'video.volume': 'Volume',
      'video.fullscreen': 'Fullscreen',
      'tag.epoxy': 'Epoxy',
      'tag.polyurethane': 'Polyurethane',
      'tag.antirust': 'Anti-rust',
      'tag.antifouling': 'Antifouling',
      'jotun.caption': 'Professional Jotun paints',
      'ba.before': 'Before',
      'ba.after': 'After',
      'ba.compare': 'Compare before and after',
      'project1.meta': 'Dry dock · 2025',
      'stars.label': '5 out of 5 stars',
      'form.name.label': 'Name',
      'form.name.ph': 'Your name',
      'form.tel.label': 'Phone / WhatsApp',
      'form.tel.country': 'Country code (France by default)',
      'form.tel.choose': 'Choose a country',
      'form.tel.searchPh': 'Search a country or dialing code…',
      'form.tel.searchAl': 'Search a country',
      'form.email.label': 'Email',
      'form.email.ph': 'you@example.com',
      'form.type.label': 'Type of vessel',
      'form.type.placeholder': 'Select a type…',
      'boat.peniche': 'Barge',
      'boat.fluvial': 'River boat',
      'boat.yachtFluvial': 'River yacht',
      'boat.yacht': 'Yacht',
      'boat.vedette': 'Motor launch',
      'boat.passagers': 'Passenger boat',
      'boat.plaisance': 'Leisure boat',
      'boat.commerce': 'Commercial boat',
      'boat.service': 'Service boat',
      'boat.travail': 'Workboat',
      'boat.transport': 'Transport boat',
      'boat.restaurant': 'Restaurant boat',
      'boat.evenementiel': 'Event boat',
      'boat.hotel': 'Hotel boat',
      'boat.barge': 'Barge',
      'boat.chaland': 'Lighter',
      'boat.remorqueur': 'Tug',
      'boat.navette': 'River shuttle',
      'boat.ferry': 'Ferry',
      'boat.moteur': 'Motorboat',
      'boat.voilier': 'Sailboat',
      'boat.catamaran': 'Catamaran',
      'boat.autre': 'Other',
      'form.typeOther.label': 'Please specify your type of vessel',
      'form.typeOther.ph': 'Your type of vessel',
      'form.need.label': 'Your needs',
      'form.need.ph': 'Current condition, preferred timeline',
      'form.photos.label': 'Photos of the boat',
      'form.photos.optional': '— optional',
      'form.photos.cta': '+ Add photos',
      'form.photos.hint': 'JPG, PNG, WEBP or HEIC · 8 MB max per photo · 40 MB total',
      'form.photos.al': 'Add photos of your boat',
      'contact.phone': 'Phone',
      'contact.email': 'Email',
      'rdv.dialog': 'Book a meeting',
      'rdv.title': 'Book a meeting',
      'rdv.text': 'Talk directly with Rachel about your project.',
      'rdv.whatsapp': 'Message Rachel on WhatsApp',
      'rdv.email': 'Email Rachel',
      'rdv.close': 'Close',
      'footer.whatsapp': "Message L'Éclat des Flots on WhatsApp",
      'footer.email': 'Email',
      'footer.col.services': 'Services',
      'footer.services.expertise': 'Survey',
      'footer.services.peinture': 'Painting',
      'footer.services.renovation': 'Renovation',
      'footer.col.embarcations': 'Vessels',
      'footer.emb.peniches': 'Barges',
      'footer.emb.passagers': 'Passenger boats',
      'footer.emb.pontons': 'Pontoons',
      'footer.col.contact': 'Contact'
    }
  };

  // Dynamic strings used by the inline form script. Both languages are kept
  // so `t()` can return the active language and the French text stays the
  // default if this file ever fails to load.
  var JS = {
    fr: {
      photoFormat: 'Formats acceptés : JPG, PNG, WEBP ou HEIC.',
      photoTooBig: '« {name} » dépasse 8 Mo et n’a pas été ajouté.',
      photoTotal: 'Limite totale de 40 Mo atteinte — cette photo n’a pas été ajoutée.',
      errName: 'Le nom est obligatoire.',
      errEmailReq: 'L’e-mail est obligatoire.',
      errEmailInvalid: 'E-mail invalide.',
      errType: 'Le type d’embarcation est obligatoire.',
      errMessage: 'Le message est obligatoire.',
      errPhoneReq: 'Le numéro WhatsApp est obligatoire.',
      errPhoneInvalid: 'Veuillez saisir un numéro WhatsApp valide.',
      errTypeOther: 'Veuillez préciser votre type d’embarcation.',
      wait: 'Merci de patienter un instant avant l’envoi.',
      sending: 'Envoi en cours',
      sendingLong: 'Envoi de votre demande…',
      sentTitle: 'Demande envoyée',
      sentText: 'Votre demande a bien été transmise.',
      redirect: 'Vous allez être redirigé vers la page d’accueil…',
      partialText: 'Certaines photos n’ont cependant pas pu être transmises. Vous pouvez nous les envoyer par WhatsApp ou e-mail.',
      backToForm: 'Revenir au formulaire',
      failTitle: 'Échec de l’envoi',
      failNetwork: 'Problème de connexion. Vos informations sont conservées.',
      failGeneric: 'Votre demande n’a pas pu être envoyée.',
      retry: 'Réessayer',
      noCountry: 'Aucun pays trouvé.'
    },
    en: {
      photoFormat: 'Accepted formats: JPG, PNG, WEBP or HEIC.',
      photoTooBig: '“{name}” is over 8 MB and was not added.',
      photoTotal: '40 MB total limit reached — this photo was not added.',
      errName: 'Name is required.',
      errEmailReq: 'Email is required.',
      errEmailInvalid: 'Invalid email.',
      errType: 'Type of vessel is required.',
      errMessage: 'A message is required.',
      errPhoneReq: 'WhatsApp number is required.',
      errPhoneInvalid: 'Please enter a valid WhatsApp number.',
      errTypeOther: 'Please specify your type of vessel.',
      wait: 'Please wait a moment before sending.',
      sending: 'Sending',
      sendingLong: 'Sending your request…',
      sentTitle: 'Request sent',
      sentText: 'Your request has been sent.',
      redirect: 'You’ll be redirected to the home page…',
      partialText: 'Some photos could not be sent, though. You can send them to us by WhatsApp or email.',
      backToForm: 'Back to the form',
      failTitle: 'Sending failed',
      failNetwork: 'Connection problem. Your details have been kept.',
      failGeneric: 'Your request could not be sent.',
      retry: 'Try again',
      noCountry: 'No country found.'
    }
  };

  // ---- Public surface (used by the inline form script) ---------------------
  window.__EDF = {
    lang: lang,
    home: lang === 'en' ? '/en' : '/',
    // Active-language string for the inline form script.
    t: function (key) {
      var d = JS[lang] || JS.fr;
      return (d && d[key] != null) ? d[key] : (JS.fr[key] != null ? JS.fr[key] : '');
    },
    // Locale used for Intl (country names + sorting) in the phone selector.
    locale: lang === 'en' ? 'en' : 'fr'
  };

  // Tell cms-hydrate.js to stay out of the way in English.
  window.__EDF_SKIP_CMS = (lang === 'en');

  // Language switch: mark the active button and remember the choice on click.
  // Runs in both languages so the preference persists across visits.
  function wireLangSwitch() {
    document.querySelectorAll('[data-lang-btn]').forEach(function (a) {
      if (a.__edfWired) return; a.__edfWired = true;
      var v = a.getAttribute('data-lang-btn');
      a.classList.toggle('is-active', v === lang);
      if (v === lang) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      a.addEventListener('click', function () { try { localStorage.setItem('edf_lang', v); } catch (e) {} });
    });
  }
  // Exposed so the design-canvas component can call it from componentDidMount —
  // i.e. AFTER React has committed the DOM. Mutating React-managed nodes before
  // that fights the runtime's reconciliation (removeChild/insertBefore errors).
  // The load-event failsafe covers the case where the component never mounts.
  window.__EDF.wireLangSwitch = wireLangSwitch;
  window.addEventListener('load', wireLangSwitch);

  if (lang !== 'en') return; // French: only the language switch is needed.

  // ---- English boot: avoid a flash of French while the DOM parses ----------
  var docEl = document.documentElement;
  docEl.setAttribute('lang', 'en');
  try {
    var s = document.createElement('style');
    s.setAttribute('data-edf-i18n', '');
    s.textContent = 'html.edf-i18n-boot body{visibility:hidden!important}';
    (document.head || docEl).appendChild(s);
    docEl.classList.add('edf-i18n-boot');
  } catch (e) {}

  function reveal() { docEl.classList.remove('edf-i18n-boot'); }

  // ---- Apply translations --------------------------------------------------
  function setText(el, v) { if (v != null && el.textContent !== v) el.textContent = v; }
  function setAttr(el, a, v) { if (v != null && el.getAttribute(a) !== v) el.setAttribute(a, v); }

  function applyHead() {
    var h = EN.head;
    try { document.title = h.title; } catch (e) {}
    var setMeta = function (sel, attr, val) {
      var m = document.querySelector(sel); if (m) m.setAttribute(attr, val);
    };
    setMeta('meta[name="description"]', 'content', h.description);
    setMeta('meta[property="og:title"]', 'content', h.title);
    setMeta('meta[property="og:description"]', 'content', h.ogDescription);
    setMeta('meta[property="og:url"]', 'content', h.url);
    setMeta('meta[property="og:locale"]', 'content', h.locale);
    setMeta('meta[name="twitter:title"]', 'content', h.title);
    setMeta('meta[name="twitter:description"]', 'content', h.twitterDescription);
    var can = document.querySelector('link[rel="canonical"]');
    if (can) can.setAttribute('href', h.url);
  }

  function applyBody() {
    // 1) data-cms text bindings -> reuse the key namespace for English.
    var cmsNodes = document.querySelectorAll('[data-cms]');
    for (var i = 0; i < cmsNodes.length; i++) {
      var el = cmsNodes[i];
      var spec = el.getAttribute('data-cms') || '';
      var sep = spec.indexOf(':');
      if (sep < 0) continue;
      var binding = spec.slice(0, sep), key = spec.slice(sep + 1);
      if (binding === 'text') {
        setText(el, EN.cms[key]);
      } else if (binding === 'stars') {
        setAttr(el, 'aria-label', EN.ui['stars.label']);
      }
      // src/href/tel/mailto/whatsapp are language-independent: left untouched.
    }

    // 2) data-i18n* attributes for everything without a CMS binding.
    var t = function (k) { return EN.ui[k]; };
    document.querySelectorAll('[data-i18n]').forEach(function (el) { setText(el, t(el.getAttribute('data-i18n'))); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { setAttr(el, 'placeholder', t(el.getAttribute('data-i18n-ph'))); });
    document.querySelectorAll('[data-i18n-al]').forEach(function (el) { setAttr(el, 'aria-label', t(el.getAttribute('data-i18n-al'))); });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) { setAttr(el, 'title', t(el.getAttribute('data-i18n-title'))); });

    // 3) Keep internal navigation inside English.
    var rw = function (sel, href) { var a = document.querySelector(sel); if (a) a.setAttribute('href', href); };
    rw('a[data-cms="text:footer.legal1"]', '/en/legal-notice');
    rw('a[data-cms="text:footer.legal2"]', '/en/privacy-policy');
  }

  var applied = false;
  function applyI18n() {
    if (applied) return; applied = true;
    try { applyHead(); } catch (e) {}
    try { applyBody(); } catch (e) {}
    try { wireLangSwitch(); } catch (e) {}
    reveal();
  }

  // The <head> is outside the React root, so title/meta are safe to set as soon
  // as the DOM is parsed — good for SEO and the browser-tab label.
  function headOnly() { try { applyHead(); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', headOnly);
  else headOnly();

  // Body translations must run AFTER the design-canvas React mount:
  //  - primary path: called from the component's componentDidMount (index.html)
  //  - failsafes: the window 'load' event and a timeout, so English is applied
  //    even if the component never mounts.
  window.__EDF.applyI18n = applyI18n;
  window.addEventListener('load', applyI18n);
  setTimeout(applyI18n, 1500);
  // Never leave the page hidden, whatever happens.
  window.addEventListener('load', reveal);
  setTimeout(reveal, 2500);
})();
