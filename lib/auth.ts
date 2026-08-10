/**
 * Simple teacher authentication (Sprint 1 — "แบบง่าย").
 *
 * There is one teacher (อาจารย์สมคิด). Credentials are compared against
 * environment variables; on success we set an HMAC-signed, httpOnly cookie.
 * No secrets are hardcoded.
 *
 *   TEACHER_EMAIL, TEACHER_PASSWORD  — the login credentials
 *   AUTH_SECRET                      — HMAC key for signing the session cookie
 *
 * This is intentionally minimal. A fuller auth story (Google sign-in as shown
 * in the mockup, sessions table, etc.) is out of Sprint 1 scope.
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireEnv } from "@/lib/env";

const COOKIE_NAME = "cc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

/** Constant-time string comparison to avoid leaking timing information. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", requireEnv("AUTH_SECRET"))
    .update(payload)
    .digest("base64url");
}

/** Verify email/password against the environment credentials. */
export function verifyCredentials(email: string, password: string): boolean {
  const expectedEmail = requireEnv("TEACHER_EMAIL");
  const expectedPassword = requireEnv("TEACHER_PASSWORD");
  return (
    safeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase()) &&
    safeEqual(password, expectedPassword)
  );
}

/** Create the signed session cookie for a logged-in teacher. */
export async function createSession(email: string): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = base64urlJson({ email, exp });
  const value = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Clear the session cookie (logout). */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Return the logged-in teacher's email, or null if not authenticated. */
export async function getTeacher(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!safeEqual(signature, sign(payload))) return null;

  try {
    const { email, exp } = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { email: string; exp: number };
    if (Math.floor(Date.now() / 1000) > exp) return null;
    return email;
  } catch {
    return null;
  }
}

/** Guard for teacher-only pages/actions: redirect to /login if not signed in. */
export async function requireTeacher(): Promise<string> {
  const email = await getTeacher();
  if (!email) redirect("/login");
  return email;
}

function base64urlJson(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}
