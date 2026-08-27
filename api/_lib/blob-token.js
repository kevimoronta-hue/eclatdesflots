// api/_lib/blob-token.js
// Sélectionne EXPLICITEMENT le token du store Vercel Blob PUBLIC.
// En Production, Vercel expose deux tokens Blob (deux stores connectés) :
//   - BLOB_READ_WRITE_TOKEN         -> nouveau store PUBLIC (nom standard Vercel)
//   - eclat_READ_WRITE_TOKEN        -> ancien store PRIVÉ  (volontairement IGNORÉ)
// On prend le token du store PUBLIC (nom standard, éventuellement un futur
// eclat_public_READ_WRITE_TOKEN) et on n'utilise JAMAIS eclat_READ_WRITE_TOKEN.
// Aucune valeur codée en dur ni exposée : lecture via process.env côté serveur uniquement.

const BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ||          // store PUBLIC (nom standard présent en prod)
  process.env.eclat_public_READ_WRITE_TOKEN ||  // si le store public est un jour nommé ainsi
  '';

// @vercel/blob lit process.env.BLOB_READ_WRITE_TOKEN par défaut : on s'assure qu'il pointe
// bien le store PUBLIC choisi (et jamais l'ancien store privé).
if (BLOB_TOKEN) process.env.BLOB_READ_WRITE_TOKEN = BLOB_TOKEN;

export { BLOB_TOKEN };
export const HAS_BLOB = Boolean(BLOB_TOKEN);
