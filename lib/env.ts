/**
 * Central access to environment variables.
 *
 * Secrets (Google credentials, MASTER_SECRET, auth secret, teacher password)
 * are ONLY read from the environment — never hardcoded in source.
 * See docs/design/architecture-decisions.md (ADR2) and the Sprint 1 brief.
 */

/** Read a required env var, throwing a clear error if it is missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `ตั้งค่าใน .env.local (ดู .env.example) — ห้าม hardcode secret ลงโค้ด`,
    );
  }
  return value;
}

/** Read an optional env var with a fallback. */
export function optionalEnv(name: string, fallback = ""): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : fallback;
}
