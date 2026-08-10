#!/usr/bin/env node
/**
 * Seed / set up the Google Sheet for testing.
 *
 * - Ensures the three tabs from docs/design/data-dictionary.md exist
 *   (students, sessions, attendance_log) with a header row each.
 * - Inserts a set of test students into the `students` master list (FR7).
 *
 * Idempotent: re-running won't duplicate tabs, headers, or existing students.
 *
 * Usage (needs Google creds in .env.local — see .env.example):
 *   node scripts/seed-sheets.mjs
 *   npm run seed
 *
 * This is a standalone script with its own tiny Sheets client so it runs under
 * plain `node` without a build step. It reads the SAME env vars the app uses.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// ---- test data -----------------------------------------------------------

/** Test students (student_id = 13 digits, full_name) per data-dictionary. */
const TEST_STUDENTS = [
  ["6804681001001", "นายณัฐวุฒิ ราชฤทธิ์"],
  ["6804681001002", "นางสาวปาริชาติ ศรีสุข"],
  ["6804681001003", "นายธนกร วงศ์เจริญ"],
  ["6804681001004", "นางสาวชนิกานต์ พรหมมา"],
  ["6804681001005", "นายอนุชา ทองดี"],
];

/** Tab name -> header row (schema column order from data-dictionary.md). */
const TABS = {
  students: ["student_id", "full_name"],
  sessions: ["session_id", "date", "period", "status", "opened_at", "closed_at"],
  attendance_log: ["student_id", "session_id", "timestamp", "status"],
};

// ---- minimal .env.local loader ------------------------------------------

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    console.error(
      `\n✖ Missing ${name}. เติมค่าใน .env.local ก่อน (ดู .env.example)\n`,
    );
    process.exit(1);
  }
  return v;
}

// ---- tiny Google Sheets client ------------------------------------------

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const b64url = (input) => Buffer.from(input).toString("base64url");

async function getAccessToken() {
  const clientEmail = requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(claims),
  )}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKey);
  const assertion = `${unsigned}.${b64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()).access_token;
}

function makeClient(token, spreadsheetId) {
  async function call(pathPart, init) {
    const res = await fetch(`${SHEETS_API}/${spreadsheetId}${pathPart}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new Error(`Sheets API ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }
  return {
    getMeta: () => call(""),
    getValues: (tab) => call(`/values/${encodeURIComponent(tab)}`),
    append: (tab, rows) =>
      call(
        `/values/${encodeURIComponent(
          `${tab}!A1`,
        )}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { method: "POST", body: JSON.stringify({ values: rows }) },
      ),
    addSheet: (title) =>
      call(":batchUpdate", {
        method: "POST",
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title } } }],
        }),
      }),
  };
}

// ---- seed logic ----------------------------------------------------------

async function main() {
  loadEnvLocal();
  const spreadsheetId = requireEnv("GOOGLE_SHEETS_ID");
  const token = await getAccessToken();
  const sheets = makeClient(token, spreadsheetId);

  const meta = await sheets.getMeta();
  const existingTabs = new Set(
    (meta.sheets ?? []).map((s) => s.properties.title),
  );

  for (const [tab, header] of Object.entries(TABS)) {
    if (!existingTabs.has(tab)) {
      await sheets.addSheet(tab);
      console.log(`+ created tab "${tab}"`);
    }
    const values = (await sheets.getValues(tab)).values ?? [];
    if (values.length === 0) {
      await sheets.append(tab, [header]);
      console.log(`  · wrote header for "${tab}"`);
    }
  }

  // Insert only students that aren't present yet (by student_id in column A).
  const studentValues = (await sheets.getValues("students")).values ?? [];
  const existingIds = new Set(studentValues.slice(1).map((r) => r[0]));
  const toAdd = TEST_STUDENTS.filter(([id]) => !existingIds.has(id));
  if (toAdd.length > 0) {
    await sheets.append("students", toAdd);
    console.log(`+ added ${toAdd.length} test student(s)`);
  } else {
    console.log("  · test students already present");
  }

  console.log("\n✓ Seed complete.");
}

main().catch((err) => {
  console.error("\n✖ Seed failed:", err.message, "\n");
  process.exit(1);
});
