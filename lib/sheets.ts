/**
 * Minimal Google Sheets client backed by a service account.
 *
 * Dependency-free: we sign a JWT with the service-account private key
 * (RS256, via node:crypto), exchange it for an OAuth access token, then call
 * the Sheets REST API. This avoids pulling in the heavy `googleapis` package.
 *
 * Credentials come ONLY from environment variables (NFR4 / Sprint 1 brief):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY            (PEM; literal "\n" is un-escaped automatically)
 *   GOOGLE_SHEETS_ID
 */
import crypto from "node:crypto";

import { requireEnv } from "@/lib/env";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

// Cache the access token across warm invocations to avoid re-minting each call.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const clientEmail = requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: SHEETS_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(claims),
  )}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKey);
  const assertion = `${unsigned}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google token exchange failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function sheetsFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await getAccessToken();
  const spreadsheetId = requireEnv("GOOGLE_SHEETS_ID");
  const res = await fetch(`${SHEETS_API}/${spreadsheetId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google Sheets API error (${res.status}): ${detail}`);
  }
  return res;
}

/** Append one row to the named sheet/tab. */
export async function appendRow(
  sheetName: string,
  values: (string | number)[],
): Promise<void> {
  const range = encodeURIComponent(`${sheetName}!A1`);
  await sheetsFetch(
    `/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ values: [values] }),
    },
  );
}

/** Read all values from the named sheet/tab (empty array if the tab is empty). */
export async function getRows(sheetName: string): Promise<string[][]> {
  const range = encodeURIComponent(sheetName);
  const res = await sheetsFetch(`/values/${range}`);
  const data = (await res.json()) as { values?: string[][] };
  return data.values ?? [];
}

/**
 * Look up a session_id in column A of the sessions sheet.
 * Returns true if a row with that id already exists (used for the
 * duplicate-session check in UC1's exception flow).
 */
export async function sessionIdExists(sessionId: string): Promise<boolean> {
  const rows = await getRows("sessions");
  // Skip the header row (row 0) if present.
  return rows.slice(1).some((row) => row[0] === sessionId);
}
