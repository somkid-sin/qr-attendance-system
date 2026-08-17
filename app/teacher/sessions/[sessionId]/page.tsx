import Link from "next/link";

import { renderCurrentQr } from "@/lib/qr";
import { secondsUntilNextWindow } from "@/lib/token";
import { SUBJECT } from "@/lib/course";
import { parseSessionId } from "@/lib/session";
import { badge, card, color } from "@/app/ui/theme";
import { RotatingQr } from "./rotating-qr";

export const dynamic = "force-dynamic";

export default async function SessionQrPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { date, section } = parseSessionId(sessionId);

  // NFR2: token rotates every 15s — this is just the window active right now.
  const { qrDataUrl } = await renderCurrentQr(sessionId);
  const secondsLeft = secondsUntilNextWindow();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 460 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={badge(color.successFg, color.successBg)}>
          สร้าง session สำเร็จ · เปิดรับเช็คอิน
        </span>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 0" }}>
          สแกนเพื่อเช็คอิน
        </h1>
      </div>

      <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
        <RotatingQr
          sessionId={sessionId}
          initialQrDataUrl={qrDataUrl}
          initialSecondsLeft={secondsLeft}
        />
      </div>

      <dl style={{ ...card, margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", rowGap: 10, columnGap: 16, fontSize: 14 }}>
        <Row label="วิชา" value={SUBJECT.code} />
        <Row label="กลุ่มเรียน" value={section} />
        <Row label="วันที่" value={date} />
        <Row label="Session ID" value={sessionId} mono />
      </dl>

      <div
        style={{
          fontSize: 12.5,
          color: color.muted,
          background: color.surface,
          border: `1px solid ${color.border}`,
          borderRadius: 10,
          padding: "10px 12px",
          lineHeight: 1.6,
        }}
      >
        QR หมุน token ใหม่ทุก 15 วินาทีอัตโนมัติ (NFR2) — ให้หน้าจอนี้เปิดค้างไว้
        หน้าห้องระหว่างเช็คชื่อ
      </div>

      <Link
        href="/teacher/sessions/new"
        style={{ fontSize: 13.5, color: color.primary, textDecoration: "none" }}
      >
        ← สร้าง session ใหม่
      </Link>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <>
      <dt style={{ color: color.muted }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          fontWeight: 600,
          fontFamily: mono ? "monospace" : "inherit",
        }}
      >
        {value}
      </dd>
    </>
  );
}
