// api/_lib/blob.js
// Image storage abstraction:
//   - Vercel Blob (prod)  -> durable object storage, NOT the ephemeral filesystem.
//   - Local folder (dev)  -> `.data/uploads`, served by the dev server at /uploads.
// Binary files are never stored in the database.

import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const HAS_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const ALLOWED_IMAGE_TYPES = Object.keys(EXT_BY_TYPE);
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export function extensionForType(type) {
  return EXT_BY_TYPE[type] || 'bin';
}

// Stores an image buffer and returns a public URL string.
export async function putImage(buffer, contentType) {
  const ext = extensionForType(contentType);
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

  if (HAS_BLOB) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`site-content/${name}`, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  // Dev fallback.
  const dir = path.join(process.cwd(), '.data', 'uploads');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buffer);
  return `/uploads/${name}`;
}
