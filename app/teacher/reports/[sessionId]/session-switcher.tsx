"use client";

import { useRouter } from "next/navigation";

import { input } from "@/app/ui/theme";

export function SessionSwitcher({
  sessions,
  currentSessionId,
}: {
  sessions: { sessionId: string; label: string }[];
  currentSessionId: string;
}) {
  const router = useRouter();

  return (
    <select
      value={currentSessionId}
      onChange={(e) => router.push(`/teacher/reports/${e.target.value}`)}
      style={{ ...input, appearance: "auto", width: "auto", minWidth: 280 }}
    >
      {sessions.map((s) => (
        <option key={s.sessionId} value={s.sessionId}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
