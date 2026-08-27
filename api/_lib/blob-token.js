// api/_lib/blob-token.js
// Sélectionne le token du store Vercel Blob PUBLIC, en EXCLUANT explicitement l'ancien
// store PRIVÉ (eclat_READ_WRITE_TOKEN). Priorité au nom standard BLOB_READ_WRITE_TOKEN ;
// sinon toute variable *_READ_WRITE_TOKEN NON VIDE autre que le store privé connu.
// Aucune valeur codée en dur ni exposée : lecture via process.env côté serveur uniquement.

const PRIVATE_STORE_VAR = 'eclat_READ_WRITE_TOKEN'; // ancien store PRIVÉ — jamais utilisé

function pickBlobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find(
    (n) => /_READ_WRITE_TOKEN$/i.test(n) && n !== PRIVATE_STORE_VAR && process.env[n]
  );
  return key ? process.env[key] : '';
}

const BLOB_TOKEN = pickBlobToken();

// @vercel/blob lit process.env.BLOB_READ_WRITE_TOKEN par défaut : on le force sur le store
// PUBLIC choisi pour que handleUpload() / put() l'utilisent (et jamais l'ancien store privé).
if (BLOB_TOKEN) process.env.BLOB_READ_WRITE_TOKEN = BLOB_TOKEN;

export { BLOB_TOKEN };
export const HAS_BLOB = Boolean(BLOB_TOKEN);
