"use server";

import { redirect } from "next/navigation";

import {
  createSession as createAuthSession,
  destroySession,
  requireTeacher,
  verifyCredentials,
} from "@/lib/auth";
import { isValidPeriod, isValidSection } from "@/lib/course";
import { appendRow, sessionIdExists } from "@/lib/sheets";
import {
  buildSessionId,
  formatDateTime,
  isValidDateIso,
  sessionToRow,
} from "@/lib/session";

export interface LoginState {
  error?: string;
}

/** UC1 precondition: teacher login (Sprint 1, simple). */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  try {
    if (!verifyCredentials(email, password)) {
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
    await createAuthSession(email);
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message.startsWith("Missing required")
          ? "ระบบยังไม่ได้ตั้งค่า credential (ดู .env.example)"
          : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่",
    };
  }

  redirect("/teacher/sessions/new");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export interface CreateSessionState {
  error?: string;
  duplicateId?: string;
}

/**
 * UC1 / FR1: create a check-in session for a specific section + date + period,
 * and write it to the "sessions" tab per docs/design/data-dictionary.md.
 */
export async function createSessionAction(
  _prev: CreateSessionState,
  formData: FormData,
): Promise<CreateSessionState> {
  await requireTeacher();

  const section = String(formData.get("section") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const period = String(formData.get("period") ?? "").trim();

  if (!isValidSection(section)) {
    return { error: "กรุณาเลือกกลุ่มเรียน (section) ให้ถูกต้อง" };
  }
  if (!isValidDateIso(date)) {
    return { error: "กรุณาเลือกวันที่ให้ถูกต้อง" };
  }
  if (!isValidPeriod(period)) {
    return { error: "กรุณาเลือกคาบเรียนให้ถูกต้อง" };
  }

  const sessionId = buildSessionId(date, section);

  try {
    // UC1 exception: creating a session that already exists → warn & confirm.
    if (await sessionIdExists(sessionId)) {
      return { duplicateId: sessionId };
    }

    const openedAt = formatDateTime();
    await appendRow(
      "sessions",
      sessionToRow({
        session_id: sessionId,
        date,
        period,
        status: "open",
        opened_at: openedAt,
        closed_at: "",
      }),
    );
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message.startsWith("Missing required")
          ? "ระบบยังไม่ได้ตั้งค่า Google Sheets credential (ดู .env.example)"
          : "บันทึก session ลง Google Sheets ไม่สำเร็จ กรุณาลองใหม่",
    };
  }

  redirect(`/teacher/sessions/${sessionId}`);
}
