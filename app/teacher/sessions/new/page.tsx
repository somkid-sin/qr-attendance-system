import { getSections, PERIODS, SUBJECT } from "@/lib/course";
import { formatDateTime } from "@/lib/session";
import { color } from "@/app/ui/theme";
import { CreateSessionForm } from "./create-session-form";

export default function NewSessionPage() {
  const sections = getSections();
  // Default the date field to today (Asia/Bangkok).
  const today = formatDateTime().slice(0, 10);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 460 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
        สร้าง Session เช็คชื่อ
      </h1>
      <p style={{ fontSize: 14, color: color.muted, margin: "0 0 18px" }}>
        เลือกกลุ่มเรียน วันที่ และคาบ สำหรับวิชา {SUBJECT.code} — ระบบจะบันทึกลง
        Google Sheets และแสดง QR Code สำหรับเช็คอิน
      </p>

      <CreateSessionForm sections={sections} periods={PERIODS} today={today} />
    </div>
  );
}
