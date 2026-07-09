import { verifyToken } from '../utils/jwt.js';
import { fail } from '../utils/response.js';

/**
 * Requires a valid access token. On success, attaches:
 *   c.set('userId', ...)
 *   c.set('companyId', ...)
 *   c.set('roleName', ...)
 * to the request context for downstream handlers.
 */
export async function requireAuth(c, next) {
  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return fail(c, 'Authentication required', 401);
  }

  try {
    const payload = await verifyToken(token, c.env.JWT_ACCESS_SECRET);
    c.set('userId', payload.sub);
    c.set('companyId', payload.companyId ?? null);
    c.set('roleName', payload.roleName);
    await next();
  } catch (err) {
    return fail(c, 'Invalid or expired token', 401);
  }
}

/**
 * Restricts a route to a set of allowed role names.
 * Usage: app.get('/x', requireAuth, requireRole('company_admin', 'manager'), handler)
 */
export function requireRole(...allowedRoles) {
  return async (c, next) => {
    const roleName = c.get('roleName');
    if (!allowedRoles.includes(roleName)) {
      return fail(c, 'Insufficient permissions', 403);
    }
    await next();
  };
}
