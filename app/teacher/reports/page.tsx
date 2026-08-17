import { redirect } from "next/navigation";

import { getAllSessions } from "@/lib/sheets";
import { card, color } from "@/app/ui/theme";

export const dynamic = "force-dynamic";

/** UC3: pick a session to report on. Defaults to the most recent one. */
export default async function ReportsIndexPage() {
  let sessions;
  try {
    sessions = await getAllSessions();
  } catch (err) {
    console.error("ReportsIndexPage failed:", err);
    return (
      <div style={{ ...card, maxWidth: 460, fontSize: 14, color: color.dangerFg, background: color.dangerBg }}>
        ดึงข้อมูล session จาก Google Sheets ไม่สำเร็จ กรุณาลองใหม่
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={{ ...card, maxWidth: 460, fontSize: 14, color: color.muted }}>
        ยังไม่มี session ในระบบ — สร้าง session ก่อนถึงจะดูรายงานได้
      </div>
    );
  }

  redirect(`/teacher/reports/${sessions[0].session_id}`);
}
