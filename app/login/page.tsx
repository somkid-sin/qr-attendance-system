import { redirect } from "next/navigation";

import { getTeacher } from "@/lib/auth";
import { color } from "@/app/ui/theme";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Already signed in → skip the login screen.
  if (await getTeacher()) redirect("/teacher/sessions/new");

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
          padding: 36,
          display: "flex",
          flexDirection: "column",
          gap: 22,
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

        <div style={{ textAlign: "center", marginTop: -8 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>
            เข้าสู่ระบบสำหรับอาจารย์
          </div>
          <div style={{ fontSize: 13.5, color: color.muted, marginTop: 4 }}>
            ระบบเช็คชื่อเข้าเรียน SIT0013
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
