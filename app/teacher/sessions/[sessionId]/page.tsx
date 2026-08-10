import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";

import { optionalEnv } from "@/lib/env";
import { getStaticToken } from "@/lib/token";
import { SUBJECT } from "@/lib/course";
import { badge, card, color } from "@/app/ui/theme";

export const dynamic = "force-dynamic";

/** Split "20260812-N01" → { date: "2026-08-12", section: "N01" }. */
function parseSessionId(sessionId: string): { date: string; section: string } {
  const dash = sessionId.indexOf("-");
  const compact = dash >= 0 ? sessionId.slice(0, dash) : sessionId;
  const section = dash >= 0 ? sessionId.slice(dash + 1) : "";
  const date =
    compact.length === 8
      ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`
      : compact;
  return { date, section };
}

async function baseUrl(): Promise<string> {
  const configured = optionalEnv("NEXT_PUBLIC_APP_URL");
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function SessionQrPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { date, section } = parseSessionId(sessionId);

  // Sprint 1: a single, non-rotating token (rotation is Sprint 2).
  const token = getStaticToken(sessionId);
  const checkinUrl = `${await baseUrl()}/checkin?s=${encodeURIComponent(
    sessionId,
  )}&t=${encodeURIComponent(token)}`;

  const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
    width: 320,
    margin: 1,
    color: { dark: "#1a1c2eff", light: "#ffffffff" },
  });

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt={`QR Code สำหรับ session ${sessionId}`}
          width={320}
          height={320}
          style={{ borderRadius: 8, border: `1px solid ${color.border}` }}
        />
        <div style={{ fontSize: 13, color: color.muted }}>
          Token (คงที่สำหรับ Sprint 1):{" "}
          <code style={{ fontSize: 13, color: color.text }}>{token}</code>
        </div>
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
        หมายเหตุ: Sprint 1 แสดง QR แบบ token คงที่ ยังไม่หมุนทุก 15 วินาที และยัง
        ไม่มีหน้าสแกนของนักศึกษา (เป็นงาน Sprint 2)
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
