import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { requireTeacher } from "@/lib/auth";
import { getAllStudents, getAttendanceStudentIds, getSession } from "@/lib/sheets";
import { parseSessionId } from "@/lib/session";
import { SUBJECT } from "@/lib/course";

export const dynamic = "force-dynamic";

/** UC3/FR6: export the mา/ขาด report for one session as an .xlsx file. */
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
  const students = await getAllStudents();
  const roster = students.filter((s) => s.section === section);
  const presentIds = await getAttendanceStudentIds(sessionId);
  const presentCount = roster.filter((s) => presentIds.has(s.studentId)).length;

  const rows: (string | number)[][] = [
    [`รายงานสรุปมา/ขาด — ${SUBJECT.code}`],
    [
      `กลุ่มเรียน: ${section}`,
      `วันที่: ${session.date}`,
      `คาบ: ${session.period}`,
      `มาเรียน: ${presentCount}/${roster.length}`,
    ],
    [],
    ["#", "รหัสนักศึกษา", "ชื่อ-สกุล", "สถานะ"],
    ...roster.map((s, i) => [
      i + 1,
      s.studentId,
      s.fullName,
      presentIds.has(s.studentId) ? "มา" : "ขาด",
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = [{ wch: 5 }, { wch: 16 }, { wch: 28 }, { wch: 8 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "สรุปผล");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const filename = `${SUBJECT.code}-${sessionId}-attendance.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
