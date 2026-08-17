import Link from "next/link";

import {
  getAllSessions,
  getAllStudents,
  getAttendanceStudentIds,
} from "@/lib/sheets";
import { parseSessionId } from "@/lib/session";
import { SUBJECT } from "@/lib/course";
import { badge, card, color } from "@/app/ui/theme";
import { SessionSwitcher } from "./session-switcher";

export const dynamic = "force-dynamic";

function sessionLabel(s: { session_id: string; date: string; period: string; status: string }): string {
  const { section } = parseSessionId(s.session_id);
  const statusLabel = s.status === "closed" ? "ปิดแล้ว" : "เปิดอยู่";
  return `${s.date} · ${section} · ${s.period} (${statusLabel})`;
}

export default async function SessionReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  let allSessions;
  let roster;
  let presentIds;
  try {
    allSessions = await getAllSessions();
    const students = await getAllStudents();
    const { section } = parseSessionId(sessionId);
    roster = students.filter((st) => st.section === section);
    presentIds = await getAttendanceStudentIds(sessionId);
  } catch (err) {
    console.error("SessionReportPage failed:", err);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 460 }}>
        <div style={{ ...card, fontSize: 14, color: color.dangerFg, background: color.dangerBg }}>
          ดึงข้อมูลรายงานจาก Google Sheets ไม่สำเร็จ
        </div>
        <Link
          href={`/teacher/reports/${sessionId}`}
          style={{ ...card, textAlign: "center", fontSize: 14, fontWeight: 600, color: color.primary, textDecoration: "none" }}
        >
          ลองใหม่
        </Link>
      </div>
    );
  }

  const session = allSessions.find((s) => s.session_id === sessionId);
  if (!session) {
    return (
      <div style={{ ...card, maxWidth: 460, fontSize: 14, color: color.muted }}>
        ไม่พบ session {sessionId}
      </div>
    );
  }

  const { date, period } = session;
  const { section } = parseSessionId(sessionId);
  const presentCount = roster.filter((s) => presentIds.has(s.studentId)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 640 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>รายงานสรุปมา/ขาด</h1>
        <p style={{ fontSize: 13.5, color: color.muted, margin: 0 }}>
          {SUBJECT.code} — เลือก session ที่ต้องการดู
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
        <SessionSwitcher
          currentSessionId={sessionId}
          sessions={allSessions.map((s) => ({ sessionId: s.session_id, label: sessionLabel(s) }))}
        />
        <a
          href={`/teacher/reports/${sessionId}/export`}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: `1px solid ${color.border}`,
            background: "white",
            color: color.text,
            fontWeight: 600,
            fontSize: 13.5,
            textDecoration: "none",
          }}
        >
          Export Excel (.xlsx)
        </a>
      </div>

      <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 24 }}>
        <SummaryStat label="กลุ่มเรียน" value={section} />
        <SummaryStat label="วันที่" value={date} />
        <SummaryStat label="คาบ" value={period} />
        <SummaryStat
          label="มาเรียน"
          value={`${presentCount} / ${roster.length}`}
          color={presentCount === roster.length ? color.successFg : color.text}
        />
      </div>

      {roster.length === 0 ? (
        <div style={{ ...card, fontSize: 14, color: color.muted }}>
          ไม่มีนักศึกษากลุ่ม {section} ใน master list
        </div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "oklch(0.97 0.004 255)", textAlign: "left" }}>
                <Th>#</Th>
                <Th>รหัสนักศึกษา</Th>
                <Th>ชื่อ-สกุล</Th>
                <Th>สถานะ</Th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s, i) => {
                const present = presentIds.has(s.studentId);
                return (
                  <tr key={s.studentId} style={{ borderTop: `1px solid ${color.border}` }}>
                    <Td>{i + 1}</Td>
                    <Td mono>{s.studentId}</Td>
                    <Td>{s.fullName}</Td>
                    <Td>
                      <span style={badge(present ? color.successFg : color.dangerFg, present ? color.successBg : color.dangerBg)}>
                        {present ? "มา" : "ขาด"}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value, color: valueColor }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 12.5, color: color.muted }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: valueColor ?? color.text }}>{value}</span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "10px 16px", fontSize: 12.5, fontWeight: 600, color: color.muted }}>{children}</th>;
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td style={{ padding: "10px 16px", fontFamily: mono ? "monospace" : "inherit" }}>{children}</td>
  );
}
