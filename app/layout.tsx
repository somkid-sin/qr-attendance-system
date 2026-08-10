import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ClassCheck — ระบบเช็คชื่อเข้าชั้นเรียนด้วย QR Code",
  description: "ระบบเช็คชื่อเข้าเรียน SIT0013 ผ่าน QR Code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
