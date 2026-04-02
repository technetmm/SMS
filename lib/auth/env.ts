function readEnv(name: string) {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveAuthSecret() {
  const authSecret = readEnv("AUTH_SECRET");
  if (authSecret) return authSecret;

  const legacySecret = readEnv("NEXTAUTH_SECRET");
  if (legacySecret) return legacySecret;

  return undefined;
}

export function requireAuthSecret() {
  const secret = resolveAuthSecret();
  if (secret) return secret;

  throw new Error(
    "Missing auth secret. Set AUTH_SECRET (preferred) or NEXTAUTH_SECRET.",
  );
}
