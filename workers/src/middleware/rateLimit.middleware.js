import { fail } from '../utils/response.js';

/**
 * Simple fixed-window rate limiter backed by KV.
 * Keyed by client IP + route, e.g. to throttle /api/auth/login attempts.
 */
export function rateLimiter({ windowSeconds = 60, maxRequests = 30 } = {}) {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const key = `ratelimit:${c.req.path}:${ip}`;

    const current = await c.env.SESSIONS.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= maxRequests) {
      return fail(c, 'Too many requests. Please try again later.', 429);
    }

    await c.env.SESSIONS.put(key, String(count + 1), { expirationTtl: windowSeconds });
    await next();
  };
}
