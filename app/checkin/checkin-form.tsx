"use client";

import { useActionState } from "react";

import { checkinAction, type CheckinState } from "@/app/lib/actions";
import { badge, color, input, label, primaryButton } from "@/app/ui/theme";

const initialState: CheckinState = {};

export function CheckinForm({
  sessionId,
  token,
}: {
  sessionId: string;
  token: string;
}) {
  const [state, action, pending] = useActionState(checkinAction, initialState);

  if (state.status === "success" || state.status === "already") {
    const isAlready = state.status === "already";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", textAlign: "center", padding: "12px 0" }}>
        <span
          style={badge(
            isAlready ? "oklch(0.58 0.15 70)" : color.successFg,
            isAlready ? "oklch(0.95 0.04 70)" : color.successBg,
          )}
        >
          {isAlready ? "เช็คชื่อไปแล้ว" : "เช็คชื่อสำเร็จ"}
        </span>
        {state.studentName ? (
          <div style={{ fontSize: 15, fontWeight: 600 }}>{state.studentName}</div>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="token" value={token} />

      <label style={label}>
        รหัสนักศึกษา
        <input
          type="text"
          name="student_id"
          inputMode="numeric"
          placeholder="6804681001001"
          maxLength={13}
          required
          style={input}
        />
      </label>

      {state.status === "error" && state.message ? (
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
          {state.message}
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
        {pending ? "กำลังเช็คชื่อ…" : "ยืนยันเช็คชื่อ"}
      </button>
    </form>
  );
}
