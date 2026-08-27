// api/_lib/blob-token.js
// Sélectionne EXPLICITEMENT le token du store Vercel Blob PUBLIC via son nom de variable,
// eclat_public_READ_WRITE_TOKEN. On IGNORE volontairement eclat_READ_WRITE_TOKEN (ancien
// store PRIVÉ) et on n'utilise plus « le premier *_READ_WRITE_TOKEN trouvé ».
// Aucune valeur n'est codée en dur ni exposée : lecture uniquement via process.env (serveur).

const BLOB_TOKEN = process.env.eclat_public_READ_WRITE_TOKEN || '';

// @vercel/blob lit process.env.BLOB_READ_WRITE_TOKEN par défaut : on le force sur le store
// PUBLIC pour que handleUpload() / put() utilisent bien ce store (et jamais le privé).
if (BLOB_TOKEN) process.env.BLOB_READ_WRITE_TOKEN = BLOB_TOKEN;

export { BLOB_TOKEN };
export const HAS_BLOB = Boolean(BLOB_TOKEN);
