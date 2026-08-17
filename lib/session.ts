/**
 * Session helpers — building `session_id` and formatting datetimes to match
 * the schema in docs/design/data-dictionary.md (Sheet 2: sessions).
 */

/**
 * Build a session_id from a date and section.
 *
 * Format: `YYYYMMDD-<section>` — e.g. ("2026-08-12", "N01") -> "20260812-N01".
 * This matches the example in data-dictionary.md and encodes the section
 * (กลุ่มเรียน) into the primary key, so the sessions sheet keeps its 6-column
 * schema unchanged while still distinguishing sections on the same day.
 */
export function buildSessionId(dateIso: string, section: string): string {
  const compact = dateIso.replaceAll("-", "");
  return `${compact}-${section}`;
}

/** Split "20260812-N01" → { date: "2026-08-12", section: "N01" }. */
export function parseSessionId(sessionId: string): { date: string; section: string } {
  const dash = sessionId.indexOf("-");
  const compact = dash >= 0 ? sessionId.slice(0, dash) : sessionId;
  const section = dash >= 0 ? sessionId.slice(dash + 1) : "";
  const date =
    compact.length === 8
      ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`
      : compact;
  return { date, section };
}

/** True for a "YYYY-MM-DD" string that is a real calendar date. */
export function isValidDateIso(dateIso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return false;
  const d = new Date(`${dateIso}T00:00:00`);
  return !Number.isNaN(d.getTime());
}

/**
 * Format a Date as "YYYY-MM-DD HH:mm:ss" in Asia/Bangkok — the format used
 * by the `opened_at` / `closed_at` columns and by `date` (date part only).
 * Uses server time as the source of truth (see data-dictionary.md).
 */
export function formatDateTime(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  // sv-SE renders as "2026-08-12 08:30:15" already.
  return parts;
}

/** A single session row as stored in the sheet (schema column order A–F). */
export interface SessionRow {
  session_id: string;
  date: string;
  period: string;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string;
}

/** Column order for the sessions sheet — must match data-dictionary.md. */
export function sessionToRow(s: SessionRow): string[] {
  return [s.session_id, s.date, s.period, s.status, s.opened_at, s.closed_at];
}
