import Link from "next/link";
import { notFound } from "next/navigation";

import { closeSessionAction } from "@/app/lib/actions";
import { renderCurrentQr } from "@/lib/qr";
import { getSession } from "@/lib/sheets";
import { secondsUntilNextWindow } from "@/lib/token";
import { SUBJECT } from "@/lib/course";
import { parseSessionId } from "@/lib/session";
import { badge, card, color, primaryButton } from "@/app/ui/theme";
import { RotatingQr } from "./rotating-qr";

export const dynamic = "force-dynamic";

export default async function SessionQrPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { date, section } = parseSessionId(sessionId);

  const session = await getSession(sessionId);
  if (!session) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 460 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={badge(
            session.status === "open" ? color.successFg : color.muted,
            session.status === "open" ? color.successBg : "oklch(0.94 0.004 255)",
          )}
        >
          {session.status === "open" ? "เปิดรับเช็คอิน" : "ปิดรับเช็คอินแล้ว"}
        </span>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 0" }}>
          {session.status === "open" ? "สแกนเพื่อเช็คอิน" : "session นี้ปิดแล้ว"}
        </h1>
      </div>

      {session.status === "open" ? (
        <OpenSessionView sessionId={sessionId} />
      ) : (
        <div
          style={{
            ...card,
            fontSize: 14,
            color: color.muted,
            lineHeight: 1.7,
          }}
        >
          session นี้ปิดรับเช็คชื่อแล้วเมื่อ {session.closed_at || "—"} ดูสรุปผล
          มา/ขาดได้ที่หน้ารายงาน
        </div>
      )}

      <dl style={{ ...card, margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", rowGap: 10, columnGap: 16, fontSize: 14 }}>
        <Row label="วิชา" value={SUBJECT.code} />
        <Row label="กลุ่มเรียน" value={section} />
        <Row label="วันที่" value={date} />
        <Row label="Session ID" value={sessionId} mono />
      </dl>

      {session.status === "open" ? (
        <form action={closeSessionAction.bind(null, sessionId)}>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 9,
              border: `1.5px solid ${color.dangerFg}`,
              background: "white",
              color: color.dangerFg,
              fontWeight: 600,
              fontSize: 14.5,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ปิดคลาสเช็คอิน
          </button>
        </form>
      ) : (
        <Link
          href={`/teacher/reports/${sessionId}`}
          style={{ ...primaryButton, textAlign: "center", textDecoration: "none", display: "block" }}
        >
          ดูรายงานสรุปมา/ขาด
        </Link>
      )}

      <Link
        href="/teacher/sessions/new"
        style={{ fontSize: 13.5, color: color.primary, textDecoration: "none" }}
      >
        ← สร้าง session ใหม่
      </Link>
    </div>
  );
}

async function OpenSessionView({ sessionId }: { sessionId: string }) {
  // NFR2: token rotates every 15s — this is just the window active right now.
  const { qrDataUrl } = await renderCurrentQr(sessionId);
  const secondsLeft = secondsUntilNextWindow();

  return (
    <>
      <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
        <RotatingQr
          sessionId={sessionId}
          initialQrDataUrl={qrDataUrl}
          initialSecondsLeft={secondsLeft}
        />
      </div>

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
    </>
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
