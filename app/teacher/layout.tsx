import Link from "next/link";

import { logoutAction } from "@/app/lib/actions";
import { SUBJECT } from "@/lib/course";
import { requireTeacher } from "@/lib/auth";
import { color } from "@/app/ui/theme";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireTeacher();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          background: color.surface,
          borderBottom: `1px solid ${color.border}`,
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: color.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            C
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>ClassCheck</span>
            <span style={{ fontSize: 12.5, color: color.muted }}>
              {SUBJECT.code}
            </span>
          </div>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link
            href="/teacher/sessions/new"
            style={{ fontSize: 13.5, fontWeight: 600, color: color.text, textDecoration: "none" }}
          >
            สร้าง session
          </Link>
          <Link
            href="/teacher/reports"
            style={{ fontSize: 13.5, fontWeight: 600, color: color.text, textDecoration: "none" }}
          >
            รายงาน
          </Link>
        </nav>

        <form action={logoutAction}>
          <button
            type="submit"
            style={{
              background: "none",
              border: `1px solid ${color.border}`,
              color: color.muted,
              fontSize: 13.5,
              fontWeight: 600,
              padding: "8px 14px",
              cursor: "pointer",
              fontFamily: "inherit",
              borderRadius: 8,
            }}
          >
            ออกจากระบบ
          </button>
        </form>
      </header>

      <main style={{ flex: 1, padding: "28px 32px", width: "100%", maxWidth: 900, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
