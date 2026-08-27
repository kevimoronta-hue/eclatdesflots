/* cms-hydrate.js
 * PUBLIC-SIDE content hydration.
 * Fetches the merged CMS content once (/api/content) and applies it to elements
 * tagged with data-cms="binding:key". If the request fails or a value is missing,
 * the hard-coded HTML content is kept as-is — the page never breaks, shows no
 * undefined/null, and works even when opened as a static file with no backend.
 *
 * Bindings:
 *   text:<key>   -> element.textContent
 *   src:<key>    -> element.src (images)
 *   tel:<key>    -> element.href = 'tel:' + digits
 *   whatsapp:<key> -> element.href = 'https://wa.me/' + digits
 *   mailto:<key> -> element.href = 'mailto:' + value
 *   href:<key>   -> element.href = value
 */
(function () {
  'use strict';

  function apply(content) {
    if (!content || typeof content !== 'object') return;
    var nodes = document.querySelectorAll('[data-cms]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var spec = el.getAttribute('data-cms') || '';
      var sep = spec.indexOf(':');
      if (sep < 0) continue;
      var binding = spec.slice(0, sep);
      var key = spec.slice(sep + 1);
      var value = content[key];
      if (value == null || value === '') continue; // fallback: keep existing DOM

      try {
        if (binding === 'text') {
          if (el.textContent !== value) el.textContent = value;
        } else if (binding === 'src') {
          if (el.getAttribute('src') !== value) el.setAttribute('src', value);
        } else if (binding === 'tel') {
          el.setAttribute('href', 'tel:' + String(value).replace(/[^\d+]/g, ''));
        } else if (binding === 'mailto') {
          el.setAttribute('href', 'mailto:' + value);
        } else if (binding === 'href') {
          el.setAttribute('href', value);
        } else if (binding === 'whatsapp') {
          el.setAttribute('href', 'https://wa.me/' + String(value).replace(/\D/g, ''));
        } else if (binding === 'stars') {
          var n = parseInt(value, 10);
          if (isNaN(n)) continue;
          if (n < 0) n = 0; if (n > 5) n = 5;
          var svgs = el.querySelectorAll('svg');
          for (var s = 0; s < svgs.length; s++) {
            if (s < n) svgs[s].classList.remove('is-empty');
            else svgs[s].classList.add('is-empty');
          }
          el.setAttribute('aria-label', n + ' étoiles sur 5');
        }
      } catch (e) { /* keep fallback on any error */ }
    }
  }

  function hydrate() {
    // Same-origin only; ignore when opened via file:// (no backend available).
    if (location.protocol === 'file:') return;
    // English is served by the static i18n dictionary (i18n.js). Skipping the
    // French CMS here prevents it from overwriting the translated copy.
    if (window.__EDF_SKIP_CMS) return;
    fetch('/api/content', { headers: { Accept: 'application/json' }, credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data && data.content) apply(data.content); })
      .catch(function () { /* silent fallback to hard-coded content */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
})();
