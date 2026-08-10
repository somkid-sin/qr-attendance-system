/**
 * Course + section configuration.
 *
 * The system serves a SINGLE subject (SIT0013) but MULTIPLE sections
 * (กลุ่มเรียน). Creating a session must specify which section it belongs to,
 * so `session_id` encodes the section (see lib/session.ts).
 *
 * These are configuration values, NOT secrets, so they may live in source.
 * Sections can be overridden without a code change via the COURSE_SECTIONS
 * env var (comma-separated, e.g. "N01,N02,N03").
 */
import { optionalEnv } from "@/lib/env";

export const SUBJECT = {
  code: "SIT0013",
  name: optionalEnv("COURSE_NAME", "SIT0013"),
} as const;

/** Available sections (กลุ่มเรียน) for SIT0013. */
export function getSections(): string[] {
  const raw = optionalEnv("COURSE_SECTIONS", "N01,N02");
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Class periods (คาบเรียน) — the time ranges that match ตารางสอน.
 * Stored verbatim in the `period` column of the sessions sheet.
 */
export const PERIODS: string[] = ["08:30-12:30", "13:30-16:30"];

export function isValidSection(section: string): boolean {
  return getSections().includes(section);
}

export function isValidPeriod(period: string): boolean {
  return PERIODS.includes(period);
}
