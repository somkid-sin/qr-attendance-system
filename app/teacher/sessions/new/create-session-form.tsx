"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  createSessionAction,
  type CreateSessionState,
} from "@/app/lib/actions";
import { card, color, input, label, primaryButton } from "@/app/ui/theme";

const initialState: CreateSessionState = {};

export function CreateSessionForm({
  sections,
  periods,
  today,
}: {
  sections: string[];
  periods: string[];
  today: string;
}) {
  const [state, action, pending] = useActionState(
    createSessionAction,
    initialState,
  );

  return (
    <form action={action} style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
      <label style={label}>
        กลุ่มเรียน (section)
        <select name="section" required style={{ ...input, appearance: "auto" }}>
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label style={label}>
        วันที่
        <input type="date" name="date" required defaultValue={today} style={input} />
      </label>

      <label style={label}>
        คาบเรียน
        <select name="period" required style={{ ...input, appearance: "auto" }}>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      {state.error ? (
        <div
          role="alert"
          style={{
            fontSize: 13.5,
            color: color.dangerFg,
            background: color.dangerBg,
            borderRadius: 8,
            padding: "9px 12px",
          }}
        >
          {state.error}
        </div>
      ) : null}

      {state.duplicateId ? (
        <div
          role="alert"
          style={{
            fontSize: 13.5,
            color: "oklch(0.45 0.1 70)",
            background: "oklch(0.95 0.04 70)",
            borderRadius: 8,
            padding: "11px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span>
            มี session สำหรับกลุ่ม/วันนี้อยู่แล้ว ({state.duplicateId}) —
            ต้องการเปิด session เดิมหรือไม่?
          </span>
          <Link
            href={`/teacher/sessions/${state.duplicateId}`}
            style={{
              ...primaryButton,
              textAlign: "center",
              textDecoration: "none",
              padding: "9px 14px",
              fontSize: 14,
            }}
          >
            ไปที่ session เดิม
          </Link>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        style={{
          ...primaryButton,
          marginTop: 4,
          padding: 12,
          fontSize: 15,
          opacity: pending ? 0.7 : 1,
          cursor: pending ? "wait" : "pointer",
        }}
      >
        {pending ? "กำลังสร้าง…" : "สร้าง session และแสดง QR"}
      </button>
    </form>
  );
}
