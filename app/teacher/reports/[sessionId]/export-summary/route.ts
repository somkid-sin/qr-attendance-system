import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { requireTeacher } from "@/lib/auth";
import {
  getAllSessions,
  getAllStudents,
  getAttendanceBySession,
  getSession,
} from "@/lib/sheets";
import { parseSessionId } from "@/lib/session";
import { SUBJECT } from "@/lib/course";

export const dynamic = "force-dynamic";

/**
 * Term-wide มา/ขาด matrix for one section: every session that section has
 * ever had as a column, one row per student. `sessionId` only supplies
 * which section to summarize (via its section suffix) — the export itself
 * spans all sessions for that section, not just this one.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  await requireTeacher();
  const { sessionId } = await params;

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: `ไม่พบ session ${sessionId}` }, { status: 404 });
  }
  const { section } = parseSessionId(sessionId);

  const [allSessions, students, attendanceBySession] = await Promise.all([
    getAllSessions(),
    getAllStudents(),
    getAttendanceBySession(),
  ]);

  const sectionSessions = allSessions
    .filter((s) => parseSessionId(s.session_id).section === section)
    .sort((a, b) => a.session_id.localeCompare(b.session_id)); // chronological, left to right

  const roster = students.filter((s) => s.section === section);
  const totalSessions = sectionSessions.length;

  const headerRow = [
    "#",
    "รหัสนักศึกษา",
    "ชื่อ-สกุล",
    ...sectionSessions.map((s) => s.date),
    "มา (ครั้ง)",
    "ทั้งหมด (ครั้ง)",
    "% เข้าเรียน",
  ];

  const dataRows = roster.map((s, i) => {
    let presentCount = 0;
    const cells = sectionSessions.map((sess) => {
      const present = attendanceBySession.get(sess.session_id)?.has(s.studentId) ?? false;
      if (present) presentCount++;
      return present ? "มา" : "ขาด";
    });
    const pct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
    return [i + 1, s.studentId, s.fullName, ...cells, presentCount, totalSessions, `${pct}%`];
  });

  const rows: (string | number)[][] = [
    [`สรุปการเข้าเรียนทั้งเทอม — ${SUBJECT.code} กลุ่ม ${section}`],
    [`จำนวนครั้งที่เปิดเรียน: ${totalSessions}`, `จำนวนนักศึกษา: ${roster.length}`],
    [],
    headerRow,
    ...dataRows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 28 },
    ...sectionSessions.map(() => ({ wch: 10 })),
    { wch: 10 },
    { wch: 11 },
    { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "สรุปทั้งเทอม");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const filename = `${SUBJECT.code}-${section}-term-summary.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
