import { id, hashToken } from '../utils/id.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyToken, TOKEN_TTL } from '../utils/jwt.js';

const APIError = class extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
};

/**
 * Registers a brand new company (tenant) along with its first
 * "company_admin" user. This is the self-signup flow.
 */
export async function registerCompanyAndAdmin(db, env, { companyName, fullName, email, phone, password }) {
  const existing = await db
    .prepare('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL')
    .bind(email)
    .first();

  if (existing) {
    throw new APIError('An account with this email already exists', 409);
  }

  const companyId = id('co');
  const userId = id('usr');
  const passwordHash = await hashPassword(password);
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  await db.batch([
    db
      .prepare(
        `INSERT INTO companies (id, name, invoice_prefix, subscription_plan, subscription_status, trial_ends_at, created_by)
         VALUES (?, ?, 'INV', 'trial', 'active', ?, ?)`
      )
      .bind(companyId, companyName, trialEndsAt, userId),
    db
      .prepare(
        `INSERT INTO users (id, company_id, role_id, full_name, email, phone, password_hash, created_by)
         VALUES (?, ?, 'role_company_admin', ?, ?, ?, ?, ?)`
      )
      .bind(userId, companyId, fullName, email, phone ?? null, passwordHash, userId),
    // Sensible defaults so a new company has at least one warehouse & unit to bill against
    db
      .prepare(`INSERT INTO warehouses (id, company_id, name, is_default, created_by) VALUES (?, ?, 'Main Store', 1, ?)`)
      .bind(id('wh'), companyId, userId),
  ]);

  return issueTokenPair(db, env, { userId, companyId, roleName: 'company_admin' });
}

export async function login(db, env, { email, password }, requestMeta = {}) {
  const user = await db
    .prepare(
      `SELECT u.id, u.company_id, u.password_hash, u.is_active, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.email = ? AND u.deleted_at IS NULL`
    )
    .bind(email)
    .first();

  if (!user || !user.is_active) {
    throw new APIError('Invalid email or password', 401);
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new APIError('Invalid email or password', 401);
  }

  await db
    .prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?')
    .bind(user.id)
    .run();

  return issueTokenPair(
    db,
    env,
    { userId: user.id, companyId: user.company_id, roleName: user.role_name },
    requestMeta
  );
}

export async function refresh(db, env, refreshToken) {
  let payload;
  try {
    payload = await verifyToken(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new APIError('Invalid or expired refresh token', 401);
  }

  const tokenHash = await hashToken(refreshToken);
  const stored = await db
    .prepare('SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ?')
    .bind(tokenHash)
    .first();

  if (!stored || stored.revoked_at || new Date(stored.expires_at) < new Date()) {
    throw new APIError('Refresh token is no longer valid', 401);
  }

  const user = await db
    .prepare(
      `SELECT u.id, u.company_id, u.is_active, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.deleted_at IS NULL`
    )
    .bind(payload.sub)
    .first();

  if (!user || !user.is_active) {
    throw new APIError('User account is no longer active', 401);
  }

  // Rotate: revoke old refresh token, issue a new pair
  await db.prepare('UPDATE refresh_tokens SET revoked_at = datetime(\'now\') WHERE id = ?').bind(stored.id).run();

  return issueTokenPair(db, env, { userId: user.id, companyId: user.company_id, roleName: user.role_name });
}

export async function logout(db, refreshToken) {
  const tokenHash = await hashToken(refreshToken);
  await db
    .prepare('UPDATE refresh_tokens SET revoked_at = datetime(\'now\') WHERE token_hash = ? AND revoked_at IS NULL')
    .bind(tokenHash)
    .run();
}

async function issueTokenPair(db, env, { userId, companyId, roleName }, requestMeta = {}) {
  const accessToken = await signAccessToken({ sub: userId, companyId, roleName }, env.JWT_ACCESS_SECRET);
  const refreshTokenValue = await signRefreshToken({ sub: userId }, env.JWT_REFRESH_SECRET);

  const tokenHash = await hashToken(refreshTokenValue);
  const expiresAt = new Date(Date.now() + TOKEN_TTL.REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();

  await db
    .prepare(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id('rtk'), userId, tokenHash, expiresAt, requestMeta.userAgent ?? null, requestMeta.ip ?? null)
    .run();

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    user: { id: userId, companyId, roleName },
  };
}

export { APIError };
