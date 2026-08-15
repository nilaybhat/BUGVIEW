import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import env from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';

const ALLOWED_MIME = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/svg+xml', 'svg'],
]);

const MAX_DECODED_BYTES = 12 * 1024 * 1024;

const uploadRoot = path.resolve(
  process.cwd(),
  path.dirname(fileURLToPath(import.meta.url)).includes('src')
    ? env.uploadDir
    : env.uploadDir
);

export function uploadsRoot() {
  return uploadRoot;
}

export async function ensureUploadDir() {
  await fs.mkdir(uploadRoot, { recursive: true });
}

export async function storeScreenshot(bugId, { mime, dataUrl, annotations }) {
  if (!mime || !dataUrl) return null;
  const ext = ALLOWED_MIME.get(mime);
  if (!ext) throw ApiError.badRequest(`Unsupported screenshot mime: ${mime}`);
  const prefix = dataUrl.indexOf(',');
  if (prefix < 0 || !/^data:[a-z/+.-]+;base64,/i.test(dataUrl.slice(0, 64))) {
    throw ApiError.badRequest('Invalid data URL for screenshot');
  }
  const buffer = Buffer.from(dataUrl.slice(prefix + 1), 'base64');
  if (buffer.length === 0) throw ApiError.badRequest('Empty screenshot payload');
  if (buffer.length > MAX_DECODED_BYTES) {
    throw ApiError.badRequest('Screenshot exceeds size limit');
  }
  await ensureUploadDir();
  const filename = `${bugId}.${ext}`;
  await fs.writeFile(path.join(uploadRoot, filename), buffer);
  logger.info(`Screenshot stored: ${filename} (${buffer.length} bytes)`);
  return {
    mime,
    filename,
    sizeBytes: buffer.length,
    annotations: Array.isArray(annotations) ? annotations.slice(0, 200) : [],
  };
}

export function resolveScreenshotPath(filename) {
  const base = path.basename(filename);
  if (base !== filename || /\.\./.test(base)) {
    throw ApiError.badRequest('Invalid filename');
  }
  return path.join(uploadRoot, base);
}
