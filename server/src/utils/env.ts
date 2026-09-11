/**
 * Environment helpers with production fail-fast behavior.
 *
 * Development/test keep flexible fallbacks (localhost CORS, in-memory DB,
 * dev JWT secret). Production MUST provide explicit secrets and URLs —
 * missing or obviously-weak values throw at startup/request time instead
 * of silently running insecure.
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

const DEV_JWT_FALLBACK = "dev-only-insecure-secret-change-me";

/** Values that must never be accepted as a production JWT secret. */
const WEAK_SECRETS = new Set(
  [
    DEV_JWT_FALLBACK,
    "secret",
    "password",
    "changeme",
    "change-me",
    "test",
    "testing",
    "password123",
    "jwtsecret",
    "jwt_secret",
  ].map((s) => s.toLowerCase())
);

/**
 * Resolve the JWT signing secret. Throws in production when the secret is
 * missing or obviously insecure. Never logs the secret itself.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (isProduction()) {
      throw new Error("[FATAL] JWT_SECRET is not set. Refusing to start in production without an explicit secret.");
    }
    return DEV_JWT_FALLBACK;
  }
  if (isProduction() && (secret.length < 32 || WEAK_SECRETS.has(secret.toLowerCase()))) {
    throw new Error(
      "[FATAL] JWT_SECRET is missing or too weak for production (minimum 32 random characters). Refusing to start."
    );
  }
  return secret;
}

/**
 * Require an env var in production; return its value (or a dev default).
 * Throws in production when missing.
 */
export function requireEnv(name: string, devDefault = ""): string {
  const value = process.env[name] ?? "";
  if (!value && isProduction()) {
    throw new Error(`[FATAL] ${name} is not set. Refusing to start in production without it.`);
  }
  return value || devDefault;
}
