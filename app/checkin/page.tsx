import { color } from "@/app/ui/theme";
import { CheckinForm } from "./checkin-form";

export const dynamic = "force-dynamic";

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; t?: string }>;
}) {
  const { s, t } = await searchParams;
  const sessionId = s ?? "";
  const token = t ?? "";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: color.surface,
          border: `1px solid ${color.border}`,
          borderRadius: 16,
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: color.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            C
          </div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>ClassCheck</span>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>เช็คชื่อเข้าเรียน</div>
          <div style={{ fontSize: 13.5, color: color.muted, marginTop: 4 }}>
            กรอกรหัสนักศึกษาเพื่อยืนยันการเข้าเรียน
          </div>
        </div>

        {sessionId && token ? (
          <CheckinForm sessionId={sessionId} token={token} />
        ) : (
          <div
            role="alert"
            style={{
              fontSize: 13.5,
              color: color.dangerFg,
              background: color.dangerBg,
              borderRadius: 8,
              padding: "11px 12px",
              textAlign: "center",
            }}
          >
            ลิงก์เช็คอินไม่ถูกต้อง กรุณาสแกน QR ใหม่จากหน้าห้อง
          </div>
        )}
      </div>
    </div>
  );
}
