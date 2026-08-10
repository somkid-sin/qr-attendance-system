/**
 * Stateless token derivation — TOTP-style (RFC 6238), per ADR2.
 *
 *   session_secret = HMAC(MASTER_SECRET, session_id)
 *   token          = HMAC(session_secret, window)   → truncated
 *
 * MASTER_SECRET lives ONLY in an environment variable and never leaves the
 * server (never written to Google Sheets). This keeps token verification
 * stateless, which is required on Vercel serverless (NFR3).
 *
 * Sprint 1 note: the QR shows a STATIC token (window = "static"). Rotating the
 * token every 15 s is Sprint 2 work — the windowing helpers below are already
 * in place so Sprint 2 only needs to swap `getStaticToken` for a time-windowed
 * call; the derivation itself does not change.
 */
import crypto from "node:crypto";

import { requireEnv } from "@/lib/env";

/** Token rotation window in seconds (NFR2). Used by Sprint 2 rotation. */
export const WINDOW_SECONDS = 15;

function hmac(key: string | Buffer, message: string): Buffer {
  return crypto.createHmac("sha256", key).update(message).digest();
}

/** Per-session secret derived from the master secret. Server-side only. */
export function deriveSessionSecret(sessionId: string): Buffer {
  const master = requireEnv("MASTER_SECRET");
  return hmac(master, sessionId);
}

/** Derive an opaque token for a given window value. */
export function deriveToken(sessionId: string, window: string): string {
  const secret = deriveSessionSecret(sessionId);
  // Truncate to 12 bytes → 16 base64url chars: short enough for a QR,
  // long enough to be unguessable.
  return hmac(secret, window).subarray(0, 12).toString("base64url");
}

/** Current time window index (floor(now / WINDOW_SECONDS)). For Sprint 2. */
export function currentWindow(now: number = Date.now()): number {
  return Math.floor(now / 1000 / WINDOW_SECONDS);
}

/**
 * Sprint 1: a single non-rotating token for the session.
 * Sprint 2 will replace callers with `deriveToken(sessionId, String(currentWindow()))`
 * plus a ±1 window check on the scan side.
 */
export function getStaticToken(sessionId: string): string {
  return deriveToken(sessionId, "static");
}
