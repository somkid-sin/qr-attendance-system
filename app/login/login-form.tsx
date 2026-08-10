"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/lib/actions";
import { color, input, label, primaryButton } from "@/app/ui/theme";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label style={label}>
        อีเมล/รหัสอาจารย์
        <input
          type="text"
          name="email"
          autoComplete="username"
          placeholder="teacher@sru.ac.th"
          required
          style={input}
        />
      </label>
      <label style={label}>
        รหัสผ่าน
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          style={input}
        />
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

      <button
        type="submit"
        disabled={pending}
        style={{
          ...primaryButton,
          marginTop: 6,
          padding: 12,
          opacity: pending ? 0.7 : 1,
          cursor: pending ? "wait" : "pointer",
        }}
      >
        {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
