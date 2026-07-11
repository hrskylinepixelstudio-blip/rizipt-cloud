import { Hono } from 'hono';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { ok, fail } from '../utils/response.js';
import { id } from '../utils/id.js';

const upload = new Hono();

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * POST /api/uploads/logo
 * multipart/form-data with a single "file" field.
 * Stores the file in R2 and saves the public URL on companies.logo_url.
 */
upload.post('/logo', requireAuth, requireRole('company_admin', 'super_admin'), async (c) => {
  const companyId = c.get('companyId');
  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return fail(c, 'No file provided', 422);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return fail(c, 'Unsupported file type. Use PNG, JPG, WEBP, or SVG.', 422);
  }
  if (file.size > MAX_SIZE_BYTES) {
    return fail(c, 'File too large. Maximum size is 2MB.', 422);
  }

  const extension = file.type.split('/')[1].replace('svg+xml', 'svg');
  const objectKey = `logos/${companyId}/${id('logo')}.${extension}`;

  await c.env.STORAGE.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  // Public URL assumes an R2 custom domain or public bucket dev URL is configured.
  // See docs/DEPLOYMENT.md for connecting a public bucket domain.
  const publicUrl = c.env.R2_PUBLIC_BASE_URL
    ? `${c.env.R2_PUBLIC_BASE_URL}/${objectKey}`
    : `/api/uploads/file/${objectKey}`;

  await c.env.DB.prepare(
    `UPDATE companies SET logo_url = ?, updated_at = datetime('now'), updated_by = ? WHERE id = ?`
  )
    .bind(publicUrl, c.get('userId'), companyId)
    .run();

  return ok(c, { url: publicUrl });
});

/**
 * GET /api/uploads/file/*
 * Fallback file server for when no R2 public custom domain is configured yet.
 * Not recommended for production traffic at scale - configure a custom domain instead.
 */
upload.get('/file/*', async (c) => {
  const key = c.req.path.replace('/api/uploads/file/', '');
  const object = await c.env.STORAGE.get(key);
  if (!object) return fail(c, 'File not found', 404);

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

export default upload;
