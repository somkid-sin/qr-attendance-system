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

/**
 * How long a displayed token stays acceptable after it was shown (product
 * decision, 2569-08-16): real students need more than one 15s window to
 * scan, type their 13-digit id, and submit. The QR still visually rotates
 * every 15s per NFR2 — only the server-side acceptance window widened, so a
 * screenshotted QR is still only useful for this many seconds, not
 * indefinitely.
 */
export const CHECKIN_TOLERANCE_SECONDS = 180;

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

/** The current window's token for a session — what the rotating QR encodes. */
export function getCurrentToken(sessionId: string, now: number = Date.now()): string {
  return deriveToken(sessionId, String(currentWindow(now)));
}

/** Seconds remaining until the current window rotates. */
export function secondsUntilNextWindow(now: number = Date.now()): number {
  const elapsed = (now / 1000) % WINDOW_SECONDS;
  return Math.ceil(WINDOW_SECONDS - elapsed);
}

/**
 * Verify a scanned token against a range of recent windows: up to
 * CHECKIN_TOLERANCE_SECONDS in the past (time to scan, type, and submit),
 * plus one window forward (ADR2: clock skew between server and QR render).
 */
export function verifyToken(
  sessionId: string,
  token: string,
  now: number = Date.now(),
): boolean {
  const window = currentWindow(now);
  const windowsBack = Math.ceil(CHECKIN_TOLERANCE_SECONDS / WINDOW_SECONDS);
  for (let w = window - windowsBack; w <= window + 1; w++) {
    if (deriveToken(sessionId, String(w)) === token) return true;
  }
  return false;
}
