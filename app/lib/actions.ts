"use server";

import { redirect } from "next/navigation";

import {
  createSession as createAuthSession,
  destroySession,
  requireTeacher,
  verifyCredentials,
} from "@/lib/auth";
import { isValidPeriod, isValidSection } from "@/lib/course";
import {
  appendRow,
  attendanceExists,
  findStudent,
  getSession,
  sessionIdExists,
} from "@/lib/sheets";
import {
  buildSessionId,
  formatDateTime,
  isValidDateIso,
  parseSessionId,
  sessionToRow,
} from "@/lib/session";
import { renderCurrentQr } from "@/lib/qr";
import { secondsUntilNextWindow, verifyToken } from "@/lib/token";
import { isValidStudentId } from "@/lib/student";

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
    console.error("loginAction failed:", err);
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
    console.error("createSessionAction failed:", err);
    return {
      error:
        err instanceof Error && err.message.startsWith("Missing required")
          ? "ระบบยังไม่ได้ตั้งค่า Google Sheets credential (ดู .env.example)"
          : "บันทึก session ลง Google Sheets ไม่สำเร็จ กรุณาลองใหม่",
    };
  }

  redirect(`/teacher/sessions/${sessionId}`);
}

export interface SessionQrResult {
  qrDataUrl: string;
  secondsLeft: number;
}

/**
 * FR2 / NFR2: teacher-only — returns a freshly rendered QR for the session's
 * current 15s token window, plus how long until it rotates again. Polled by
 * the teacher's own screen; requires auth so the rotation itself can't be
 * used as a way to mint fresh tokens without being the one showing the QR.
 */
export async function getSessionQrAction(sessionId: string): Promise<SessionQrResult> {
  await requireTeacher();
  const { qrDataUrl } = await renderCurrentQr(sessionId);
  return { qrDataUrl, secondsLeft: secondsUntilNextWindow() };
}

export interface CheckinState {
  status?: "success" | "already" | "error";
  message?: string;
  studentName?: string;
}

/**
 * UC2 / FR3-FR5 / FR8: student check-in. No auth — anyone with a valid,
 * unexpired token for an open session and a real student_id can check in.
 */
export async function checkinAction(
  _prev: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const studentId = String(formData.get("student_id") ?? "").trim();

  if (!sessionId || !token) {
    return { status: "error", message: "ลิงก์เช็คอินไม่ถูกต้อง กรุณาสแกน QR ใหม่" };
  }
  if (!isValidStudentId(studentId)) {
    return { status: "error", message: "กรุณากรอกรหัสนักศึกษาให้ถูกต้อง (13 หลัก)" };
  }
  if (!verifyToken(sessionId, token)) {
    return { status: "error", message: "QR หมดอายุ ลองสแกนใหม่" };
  }

  try {
    const session = await getSession(sessionId);
    if (!session || session.status !== "open") {
      return { status: "error", message: "session นี้ปิดรับเช็คชื่อแล้ว" };
    }

    const student = await findStudent(studentId);
    if (student === null) {
      return { status: "error", message: "ไม่พบรหัสนักศึกษานี้ในรายวิชา" };
    }

    const { section } = parseSessionId(sessionId);
    if (student.section !== section) {
      return {
        status: "error",
        message: `รหัสนักศึกษานี้อยู่กลุ่มเรียน ${student.section} ไม่ใช่กลุ่ม ${section} ของ session นี้`,
      };
    }

    if (await attendanceExists(studentId, sessionId)) {
      return { status: "already", message: "เช็คชื่อไปแล้ว", studentName: student.fullName };
    }

    await appendRow("attendance_log", [
      studentId,
      sessionId,
      formatDateTime(),
      "present",
    ]);

    return { status: "success", message: "เช็คชื่อสำเร็จ", studentName: student.fullName };
  } catch (err) {
    console.error("checkinAction failed:", err);
    return {
      status: "error",
      message:
        err instanceof Error && err.message.startsWith("Missing required")
          ? "ระบบยังไม่พร้อมใช้งาน กรุณาแจ้งอาจารย์"
          : "เช็คชื่อไม่สำเร็จ กรุณาลองใหม่",
    };
  }
}
