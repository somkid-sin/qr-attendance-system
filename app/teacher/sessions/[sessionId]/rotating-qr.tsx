"use client";

import { useEffect, useRef, useState } from "react";

import { getSessionQrAction } from "@/app/lib/actions";
import { color } from "@/app/ui/theme";

/** Live QR that re-fetches a fresh token right as each 15s window ends (NFR2). */
export function RotatingQr({
  sessionId,
  initialQrDataUrl,
  initialSecondsLeft,
}: {
  sessionId: string;
  initialQrDataUrl: string;
  initialSecondsLeft: number;
}) {
  const [qrDataUrl, setQrDataUrl] = useState(initialQrDataUrl);
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh(delayMs: number) {
      timeoutRef.current = setTimeout(async () => {
        if (cancelled) return;
        try {
          const result = await getSessionQrAction(sessionId);
          if (cancelled) return;
          setQrDataUrl(result.qrDataUrl);
          setSecondsLeft(result.secondsLeft);
          refresh(result.secondsLeft * 1000 + 150);
        } catch {
          // Network hiccup — retry soon rather than leaving a stale QR up.
          if (!cancelled) refresh(3000);
        }
      }, delayMs);
    }

    refresh(initialSecondsLeft * 1000 + 150);
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt={`QR Code สำหรับ session ${sessionId}`}
        width={320}
        height={320}
        style={{ borderRadius: 8, border: `1px solid ${color.border}` }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: color.muted }}>หมดอายุใน</div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: secondsLeft <= 3 ? color.dangerFg : color.text,
          }}
        >
          {secondsLeft}s
        </div>
      </div>
    </>
  );
}
