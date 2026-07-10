/**
 * Generates a prefixed unique ID, e.g. id('usr') -> "usr_a1b2c3d4e5f6..."
 * Uses crypto.randomUUID() (native in Workers) stripped of dashes.
 */
export function id(prefix) {
  const raw = crypto.randomUUID().replace(/-/g, '');
  return prefix ? `${prefix}_${raw}` : raw;
}

export function hashToken(token) {
  // Simple SHA-256 hash for storing refresh token identifiers at rest.
  return crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(token))
    .then((buf) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    );
}
