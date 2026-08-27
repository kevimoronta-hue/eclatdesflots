// api/_lib/blob-token.js
// Token du store Vercel Blob PUBLIC : on utilise EXPLICITEMENT et UNIQUEMENT la variable
// standard process.env.BLOB_READ_WRITE_TOKEN (qui contient le token du NOUVEAU store PUBLIC).
// Aucune recherche automatique d'autres *_READ_WRITE_TOKEN ; l'ancien store privé
// (eclat_READ_WRITE_TOKEN) est totalement ignoré. Aucune valeur en dur ni exposée :
// lecture via process.env côté serveur uniquement.

export const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';
export const HAS_BLOB = Boolean(BLOB_TOKEN);
