// cms/schema.js
// Single source of truth for ALL editable content (defaults + labels + grouping).
// Used server-side (fallback + validation) and by the admin UI (labels + sections).
// The public page never imports this; it only reads the merged /api/content payload
// and falls back to the hard-coded HTML when a value is missing.
//
// Field types -> admin control:
//   'text'      -> <input>            binding: text | tel | mailto | href
//   'multiline' -> <textarea>         binding: text
//   'image'     -> preview + Replace  binding: src
//   'stars'     -> 1..5 select        binding: stars
//
// binding tells cms-hydrate.js how to apply the value in the DOM.

const REVIEWS = [
  { name: 'Laurent M.',    avatar: 'assets/avis-laurent-m.jpg',     text: '« Un travail vraiment propre. Le bateau a retrouvé une seconde jeunesse. »' },
  { name: 'Philippe D.',   avatar: 'assets/avis-philippe-d.jpg',    text: '« Très satisfait des finitions. Le résultat est encore mieux que ce que j’imaginais. »' },
  { name: 'Sophie L.',     avatar: 'assets/avis-sophie-l.jpg',      text: '« Une équipe sérieuse, disponible et surtout très attentive aux détails. »' },
  { name: 'Jean-Pierre R.',avatar: 'assets/avis-jean-pierre-r.jpg', text: '« Le pont est méconnaissable. Travail soigné du début jusqu’à la livraison. »' },
  { name: 'Nicolas B.',    avatar: 'assets/avis-nicolas-b.jpg',     text: '« Très belle rénovation. On sent immédiatement la qualité du travail réalisé. »' },
  { name: 'Catherine V.',  avatar: 'assets/avis-catherine-v.jpg',   text: '« Notre bateau avait vraiment besoin d’attention. Le résultat est superbe. »' },
  { name: 'François G.',   avatar: 'assets/avis-francois-g.jpg',    text: '« Excellent travail sur la coque. Propre, sérieux et parfaitement exécuté. »' },
  { name: 'Marc T.',       avatar: 'assets/avis-marc-t.jpg',        text: '« Ils ont redonné tout son caractère au bateau. Très satisfait du résultat. »' },
  { name: 'Isabelle C.',   avatar: 'assets/avis-isabelle-c.jpg',    text: '« De très bons conseils et une réalisation impeccable. Merci à toute l’équipe. »' },
  { name: 'Thierry P.',    avatar: 'assets/avis-thierry-p.jpg',     text: '« La différence avant/après est impressionnante. Exactement le résultat que nous voulions. »' },
  { name: 'Éric F.',       avatar: 'assets/avis-eric-f.jpg',        text: '« Un chantier réalisé avec beaucoup de soin. Les finitions sont vraiment réussies. »' },
  { name: 'Nathalie A.',   avatar: 'assets/avis-nathalie-a.jpg',    text: '« Très bonne expérience du début à la fin. Le bateau est magnifique. »' },
  { name: 'Olivier S.',    avatar: 'assets/avis-olivier-s.jpg',     text: '« Travail sérieux et résultat à la hauteur. Je leur confierais à nouveau mon bateau. »' },
  { name: 'Alain J.',      avatar: 'assets/avis-alain-j.jpg',       text: '« Une rénovation très bien exécutée, avec une vraie attention portée aux détails. »' },
  { name: 'Claire R.',     avatar: 'assets/avis-claire-r.jpg',      text: '« Le résultat parle de lui-même. Nous sommes vraiment ravis de cette rénovation. »' },
];

function reviewFields() {
  const out = [];
  REVIEWS.forEach((r, i) => {
    const n = i + 1;
    out.push({ key: `review${n}.text`,   label: `Avis ${n} — Texte`,   type: 'multiline', binding: 'text', default: r.text });
    out.push({ key: `review${n}.name`,   label: `Avis ${n} — Nom`,     type: 'text',      binding: 'text', default: r.name });
    out.push({ key: `review${n}.avatar`, label: `Avis ${n} — Avatar`,  type: 'image',     binding: 'src',  default: r.avatar });
    out.push({ key: `review${n}.stars`,  label: `Avis ${n} — Étoiles`, type: 'stars',     binding: 'stars', default: '5' });
  });
  return out;
}

export const SECTIONS = [
  {
    id: 'general', label: 'Boutons & CTA', fields: [
      { key: 'cta.devisLabel', label: 'Libellé « Demander un devis » (global)', type: 'text', binding: 'text', default: 'Demander un devis' },
      { key: 'cta.rdvLabel', label: 'Libellé « Prendre rendez-vous »', type: 'text', binding: 'text', default: 'Prendre rendez-vous' },
      { key: 'form.submitLabel', label: 'Libellé bouton d’envoi du formulaire', type: 'text', binding: 'text', default: 'Envoyer la demande' },
    ],
  },
  {
    id: 'accueil', label: 'Accueil — Héro', fields: [
      { key: 'hero.title', label: 'Titre principal', type: 'text', binding: 'text', default: 'Un savoir-faire français au service de votre embarcation.' },
      { key: 'hero.subtitle', label: 'Sous-titre', type: 'multiline', binding: 'text', default: "Expertise, traitement de surface et rénovation complète péniches, logements flottants, bateaux à passagers, navires de commerce et pontons. En cale sèche comme à flot." },
      { key: 'hero.ctaSecondary', label: 'Bouton secondaire', type: 'text', binding: 'text', default: 'Voir nos réalisations' },
      { key: 'hero.image', label: 'Image de fond du héro', type: 'image', binding: 'src', default: 'assets/hero-cale-seche.webp' },
      { key: 'clients.heading', label: 'Bandeau logos — intitulé', type: 'text', binding: 'text', default: 'Ils nous font confiance' },
    ],
  },
  {
    id: 'stats', label: 'Bandeau chiffres', fields: [
      { key: 'stats.1.title', label: 'Bloc 1 — Titre', type: 'text', binding: 'text', default: 'Diagnostic' },
      { key: 'stats.1.sub', label: 'Bloc 1 — Sous-texte', type: 'text', binding: 'text', default: 'complet avant chiffrage' },
      { key: 'stats.2.title', label: 'Bloc 2 — Titre', type: 'text', binding: 'text', default: 'Cale sèche' },
      { key: 'stats.2.sub', label: 'Bloc 2 — Sous-texte', type: 'text', binding: 'text', default: 'ou intervention à flot' },
      { key: 'stats.3.title', label: 'Bloc 3 — Titre', type: 'text', binding: 'text', default: 'Équipe qualifiée' },
      { key: 'stats.3.sub', label: 'Bloc 3 — Sous-texte', type: 'text', binding: 'text', default: 'produits professionnels' },
      { key: 'stats.4.title', label: 'Bloc 4 — Titre', type: 'text', binding: 'text', default: 'Devis 72 h' },
      { key: 'stats.4.sub', label: 'Bloc 4 — Sous-texte', type: 'text', binding: 'text', default: 'détaillé poste par poste' },
    ],
  },
  {
    id: 'services', label: 'Services', fields: [
      { key: 'services.title', label: 'Titre de section', type: 'text', binding: 'text', default: 'Trois interventions, un seul standard' },
      { key: 'services.subtitle', label: 'Sous-titre', type: 'multiline', binding: 'text', default: 'Un interlocuteur unique, un planning ferme, un dossier de réception à la livraison.' },
      { key: 'services.1.title', label: 'Service 1 — Titre', type: 'text', binding: 'text', default: 'Expertise & diagnostic' },
      { key: 'services.1.desc', label: 'Service 1 — Description', type: 'multiline', binding: 'text', default: "Visite à bord, relevé de l'état des œuvres vives et mortes, mesures et photographies annotées. Vous savez ce qui est nécessaire et ce qui peut attendre." },
      { key: 'services.2.title', label: 'Service 2 — Titre', type: 'text', binding: 'text', default: 'Peinture & traitement de surface' },
      { key: 'services.2.desc', label: 'Service 2 — Description', type: 'multiline', binding: 'text', default: 'Entretien courant ou neuvage, avec des systèmes professionnels adaptés au milieu fluvial.' },
      { key: 'services.3.title', label: 'Service 3 — Titre', type: 'text', binding: 'text', default: 'Rénovation complète' },
      { key: 'services.3.desc', label: 'Service 3 — Description', type: 'multiline', binding: 'text', default: 'Décapage, traitement anticorrosion, remise en état des œuvres vives et des œuvres mortes. Chantier mené en cale sèche ou à flot selon votre exploitation.' },
    ],
  },
  {
    id: 'embarcations', label: 'Embarcations', fields: [
      { key: 'embarcations.title', label: 'Titre de section', type: 'text', binding: 'text', default: "Nous intervenons sur tous types d'embarcations fluviales" },
      { key: 'embarcations.1.label', label: 'Carte 1 — Libellé', type: 'text', binding: 'text', default: 'Péniches' },
      { key: 'embarcations.1.image', label: 'Carte 1 — Image', type: 'image', binding: 'src', default: 'assets/peniche.jpg' },
      { key: 'embarcations.2.label', label: 'Carte 2 — Libellé', type: 'text', binding: 'text', default: 'Logements flottants' },
      { key: 'embarcations.2.image', label: 'Carte 2 — Image', type: 'image', binding: 'src', default: 'assets/logement-flottant.jpg' },
      { key: 'embarcations.3.label', label: 'Carte 3 — Libellé', type: 'text', binding: 'text', default: 'Bateaux à passagers' },
      { key: 'embarcations.3.image', label: 'Carte 3 — Image', type: 'image', binding: 'src', default: 'assets/bateau-passagers.jpg' },
      { key: 'embarcations.4.label', label: 'Carte 4 — Libellé', type: 'text', binding: 'text', default: 'Navires de commerce' },
      { key: 'embarcations.4.image', label: 'Carte 4 — Image', type: 'image', binding: 'src', default: 'assets/navire-commerce.jpg' },
      { key: 'embarcations.5.label', label: 'Carte 5 — Libellé', type: 'text', binding: 'text', default: 'Pontons' },
      { key: 'embarcations.5.image', label: 'Carte 5 — Image', type: 'image', binding: 'src', default: 'assets/ponton.jpg' },
    ],
  },
  {
    id: 'methode', label: 'Méthode', fields: [
      { key: 'methode.title', label: 'Titre de section', type: 'text', binding: 'text', default: 'Le déroulement d’un chantier' },
      { key: 'methode.subtitle', label: 'Sous-titre', type: 'multiline', binding: 'text', default: 'Cinq étapes, toujours les mêmes, du premier relevé à la remise en service.' },
      { key: 'methode.1.title', label: 'Étape 1 — Titre', type: 'text', binding: 'text', default: 'Inspection & diagnostic' },
      { key: 'methode.1.desc', label: 'Étape 1 — Description', type: 'multiline', binding: 'text', default: 'Nous analysons l’état de votre embarcation afin d’identifier les zones à traiter et de définir les interventions nécessaires.' },
      { key: 'methode.2.title', label: 'Étape 2 — Titre', type: 'text', binding: 'text', default: 'Préparation des surfaces' },
      { key: 'methode.2.desc', label: 'Étape 2 — Description', type: 'multiline', binding: 'text', default: 'Décapage, nettoyage, ponçage et traitement anticorrosion des œuvres vives et des œuvres mortes, pour préparer parfaitement les supports.' },
      { key: 'methode.3.title', label: 'Étape 3 — Titre', type: 'text', binding: 'text', default: 'Application des revêtements' },
      { key: 'methode.3.desc', label: 'Étape 3 — Description', type: 'multiline', binding: 'text', default: 'Application des systèmes de protection adaptés : peintures époxy, polyuréthane, antirouille et antifouling.' },
      { key: 'methode.4.title', label: 'Étape 4 — Titre', type: 'text', binding: 'text', default: 'Contrôle & finitions' },
      { key: 'methode.4.desc', label: 'Étape 4 — Description', type: 'multiline', binding: 'text', default: 'Chaque intervention est contrôlée afin de garantir une finition durable, homogène et conforme aux exigences du milieu fluvial.' },
      { key: 'methode.5.title', label: 'Étape 5 — Titre', type: 'text', binding: 'text', default: 'Livraison' },
      { key: 'methode.5.desc', label: 'Étape 5 — Description', type: 'multiline', binding: 'text', default: 'Le chantier est finalisé et l’embarcation est remise en service, prête à naviguer.' },
    ],
  },
  {
    id: 'realisations', label: 'Réalisations (Avant / Après)', fields: [
      { key: 'realisations.title', label: 'Titre de section', type: 'text', binding: 'text', default: 'Des chantiers que l’on peut regarder de près' },
      { key: 'project1.title', label: 'Projet 1 — Titre', type: 'text', binding: 'text', default: 'Rénovation de coque — Yacht fluvial en acier' },
      { key: 'project1.beforeImage', label: 'Projet 1 — Photo avant', type: 'image', binding: 'src', default: 'assets/bretagne-coque-avant-43.webp' },
      { key: 'project1.afterImage', label: 'Projet 1 — Photo après', type: 'image', binding: 'src', default: 'assets/bretagne-coque-apres-43.webp' },
      { key: 'project2.title', label: 'Projet 2 — Titre', type: 'text', binding: 'text', default: 'Rénovation du revêtement de pont' },
      { key: 'project2.beforeImage', label: 'Projet 2 — Photo avant', type: 'image', binding: 'src', default: 'assets/pont-revetement-avant-w.webp' },
      { key: 'project2.afterImage', label: 'Projet 2 — Photo après', type: 'image', binding: 'src', default: 'assets/pont-revetement-apres-w.webp' },
      { key: 'project3.title', label: 'Projet 3 — Titre', type: 'text', binding: 'text', default: 'Rénovation de la « Libellule »' },
      { key: 'project3.beforeImage', label: 'Projet 3 — Photo avant', type: 'image', binding: 'src', default: 'assets/libellule-avant-w.webp' },
      { key: 'project3.afterImage', label: 'Projet 3 — Photo après', type: 'image', binding: 'src', default: 'assets/libellule-apres-w.webp' },
    ],
  },
  {
    id: 'temoignages', label: 'Avis clients', fields: [
      { key: 'temoignages.title', label: 'Titre de section', type: 'text', binding: 'text', default: 'La satisfaction comme mot d’ordre' },
      { key: 'temoignages.subtitle', label: 'Sous-titre', type: 'multiline', binding: 'text', default: 'Armateurs, exploitants et propriétaires racontent leur chantier. Sans filtre.' },
      ...reviewFields(),
    ],
  },
  {
    id: 'devis', label: 'Devis & Contact', fields: [
      { key: 'devis.title', label: 'Titre de section', type: 'text', binding: 'text', default: 'Quelques photos suffisent pour commencer' },
      { key: 'devis.intro', label: 'Paragraphe d’introduction', type: 'multiline', binding: 'text', default: "Indiquez le type d'embarcation, l'état actuel et votre échéance. Un chef de projet revient vers vous sous 72 heures avec un chiffrage détaillé, sans engagement." },
      { key: 'contact.phone', label: 'Téléphone (héro + footer)', type: 'text', binding: 'tel', default: '+33 6 63 68 41 47' },
      { key: 'contact.email', label: 'E-mail (héro + footer)', type: 'text', binding: 'mailto', default: 'contact@eclatdesflots.fr' },
      { key: 'contact.linkedin', label: 'LinkedIn (héro + footer)', type: 'text', binding: 'href', default: 'https://www.linkedin.com/in/rachel-prudent-651209226?utm_source=share_via&utm_content=profile&utm_medium=member_ios' },
    ],
  },
  {
    id: 'faq', label: 'Questions fréquentes', fields: [
      { key: 'faq.title', label: 'Titre de section', type: 'text', binding: 'text', default: 'Questions fréquentes' },
      { key: 'faq.subtitle', label: 'Sous-titre', type: 'multiline', binding: 'text', default: "Ce que l'on nous demande avant de signer. Une autre question ? Appelez-nous, on répond directement." },
      { key: 'faq.1.q', label: 'Question 1', type: 'text', binding: 'text', default: 'Combien de temps le bateau reste-t-il immobilisé ?' },
      { key: 'faq.1.a', label: 'Réponse 1', type: 'multiline', binding: 'text', default: "Cela dépend du périmètre : deux à cinq jours pour un entretien courant à flot, trois à six semaines pour un décapage complet avec système époxy en cale sèche. La durée est engagée dans le devis, avec une date de remise à l'eau." },
      { key: 'faq.2.q', label: 'Question 2', type: 'text', binding: 'text', default: 'Intervenez-vous à flot ou uniquement en cale sèche ?' },
      { key: 'faq.2.a', label: 'Réponse 2', type: 'multiline', binding: 'text', default: "Les deux. Œuvres mortes, superstructures et retouches d'entretien se traitent à flot. Le décapage des œuvres vives et l'antifouling exigent une cale sèche : nous organisons le passage et l'intégrons au planning." },
      { key: 'faq.3.q', label: 'Question 3', type: 'text', binding: 'text', default: 'Quels produits utilisez-vous ?' },
      { key: 'faq.3.a', label: 'Réponse 3', type: 'multiline', binding: 'text', default: "Des systèmes professionnels adaptés à l'eau douce : primaires antirouille, époxy bi-composant, finitions polyuréthane et antifouling. Les fiches techniques des produits appliqués sont remises dans le dossier de réception." },
      { key: 'faq.4.q', label: 'Question 4', type: 'text', binding: 'text', default: 'Sur quelles zones géographiques intervenez-vous ?' },
      { key: 'faq.4.a', label: 'Réponse 4', type: 'multiline', binding: 'text', default: 'Île-de-France et bassin Seine-Oise-Marne en intervention courante, réseau Seine-Nord Europe pour les chantiers planifiés. Au-delà, le déplacement est étudié au cas par cas et chiffré dans le devis.' },
      { key: 'faq.5.q', label: 'Question 5', type: 'text', binding: 'text', default: 'Pouvez-vous répondre à un marché public ?' },
      { key: 'faq.5.a', label: 'Réponse 5', type: 'multiline', binding: 'text', default: "Oui. Nous fournissons KBIS, attestations d'assurance, références de chantiers comparables et mémoire technique. Nous répondons également en groupement lorsque le lot dépasse notre périmètre." },
    ],
  },
  {
    id: 'cta', label: 'Bandeau final', fields: [
      { key: 'cta.title', label: 'Titre', type: 'multiline', binding: 'text', default: 'Envoyez-nous quelques photos. Nous vous dirons ce qui est vraiment nécessaire.' },
      { key: 'cta.subtitle', label: 'Sous-titre', type: 'text', binding: 'text', default: "Réponse d'un chef de projet sous 24 heures ouvrées." },
    ],
  },
  {
    id: 'footer', label: 'Pied de page', fields: [
      { key: 'footer.copyright', label: 'Mention de copyright', type: 'text', binding: 'text', default: '© 2026 L’Éclat des Flots' },
      { key: 'footer.legal1', label: 'Lien 1 (bas de page)', type: 'text', binding: 'text', default: 'Mentions légales' },
      { key: 'footer.legal2', label: 'Lien 2 (bas de page)', type: 'text', binding: 'text', default: 'Politique de confidentialité' },
    ],
  },
];

// Flat lookups.
export const FIELDS = SECTIONS.flatMap((s) => s.fields);
export const FIELD_MAP = Object.fromEntries(FIELDS.map((f) => [f.key, f]));
export const DEFAULTS = Object.fromEntries(FIELDS.map((f) => [f.key, f.default]));
export const CRITICAL_KEYS = new Set(FIELDS.map((f) => f.key));

export function isValidKey(key) {
  return Object.prototype.hasOwnProperty.call(FIELD_MAP, key);
}

// Server-side validation/coercion for a single field. Never trusts the client.
export function validateField(key, raw) {
  const field = FIELD_MAP[key];
  if (!field) return { ok: false, error: 'Champ inconnu.' };
  if (typeof raw !== 'string') return { ok: false, error: 'Valeur invalide.' };
  const value = raw.trim();

  if (field.type === 'image') {
    const isData = /^data:image\//i.test(value);
    const okPath = /^assets\//.test(value) || /^\/uploads\//.test(value) || /^https:\/\//i.test(value) || isData;
    if (!okPath) return { ok: false, error: 'URL d’image invalide.' };
    if (!isData && value.length > 2048) return { ok: false, error: 'URL trop longue.' };
    return { ok: true, value };
  }
  if (field.type === 'stars') {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1 || n > 5) return { ok: false, error: 'Nombre d’étoiles invalide (1 à 5).' };
    return { ok: true, value: String(n) };
  }
  if (field.binding === 'mailto') {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { ok: false, error: 'E-mail invalide.' };
    return { ok: true, value };
  }
  if (field.binding === 'href') {
    if (value && !/^https?:\/\//i.test(value)) return { ok: false, error: 'URL invalide (doit commencer par https://).' };
    return { ok: true, value };
  }
  // Ordinary text: strip angle brackets so no HTML/script markup can be injected.
  // (The public page also renders these via textContent, never innerHTML.)
  const clean = value.replace(/[<>]/g, '');
  const max = field.type === 'multiline' ? 2000 : 300;
  if (clean.length > max) return { ok: false, error: `Texte trop long (max ${max}).` };
  return { ok: true, value: clean };
}
