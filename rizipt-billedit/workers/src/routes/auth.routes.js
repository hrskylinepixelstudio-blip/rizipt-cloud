import { Hono } from 'hono';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js';
import * as authService from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { ok, fail } from '../utils/response.js';

const auth = new Hono();

auth.post('/register', async (c) => {
  const body = registerSchema.parse(await c.req.json());
  const result = await authService.registerCompanyAndAdmin(c.env.DB, c.env, body);
  return ok(c, result, 201);
});

auth.post('/login', async (c) => {
  const body = loginSchema.parse(await c.req.json());
  const requestMeta = {
    userAgent: c.req.header('User-Agent') ?? null,
    ip: c.req.header('CF-Connecting-IP') ?? null,
  };
  const result = await authService.login(c.env.DB, c.env, body, requestMeta);
  return ok(c, result);
});

auth.post('/refresh', async (c) => {
  const { refreshToken } = refreshSchema.parse(await c.req.json());
  const result = await authService.refresh(c.env.DB, c.env, refreshToken);
  return ok(c, result);
});

auth.post('/logout', async (c) => {
  const { refreshToken } = refreshSchema.parse(await c.req.json());
  await authService.logout(c.env.DB, refreshToken);
  return ok(c, { message: 'Logged out successfully' });
});

auth.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  const user = await c.env.DB.prepare(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.company_id,
            r.name AS role_name, r.display_name AS role_display_name,
            co.name AS company_name, co.subscription_plan, co.subscription_status
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN companies co ON co.id = u.company_id
     WHERE u.id = ? AND u.deleted_at IS NULL`
  )
    .bind(userId)
    .first();

  if (!user) return fail(c, 'User not found', 404);
  return ok(c, user);
});

export default auth;
