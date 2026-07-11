import { SignJWT, jwtVerify } from 'jose';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getSecretKey(secret) {
  return new TextEncoder().encode(secret);
}

/**
 * Signs a short-lived access token carrying user identity + tenant + role claims.
 */
export async function signAccessToken(payload, secret) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .setIssuer('rizipt-cloud')
    .sign(getSecretKey(secret));
}

/**
 * Signs a long-lived refresh token. Only carries the user id + a random jti;
 * the jti is also stored (hashed) in the refresh_tokens table so it can be revoked.
 */
export async function signRefreshToken(payload, secret) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL_SECONDS}s`)
    .setIssuer('rizipt-cloud')
    .sign(getSecretKey(secret));
}

export async function verifyToken(token, secret) {
  const { payload } = await jwtVerify(token, getSecretKey(secret), {
    issuer: 'rizipt-cloud',
  });
  return payload;
}

export const TOKEN_TTL = {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
};
