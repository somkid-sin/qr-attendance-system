/**
 * Shared style tokens mirroring the ClassCheck mockup
 * (docs/design/mockups/source/ClassCheck.dc.html). Kept as plain objects so
 * both server and client components can use them with inline styles.
 */
import type { CSSProperties } from "react";

export const color = {
  bg: "oklch(0.97 0.004 255)",
  surface: "oklch(1 0 0)",
  text: "oklch(0.22 0.01 255)",
  muted: "oklch(0.48 0.01 255)",
  border: "oklch(0.9 0.008 255)",
  primary: "oklch(0.47 0.14 255)",
  primaryHover: "oklch(0.4 0.14 255)",
  successFg: "oklch(0.5 0.14 150)",
  successBg: "oklch(0.95 0.03 150)",
  dangerFg: "oklch(0.55 0.18 25)",
  dangerBg: "oklch(0.95 0.03 25)",
} as const;

export const card: CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: 14,
  padding: 26,
};

export const primaryButton: CSSProperties = {
  padding: "12px 22px",
  borderRadius: 9,
  border: "none",
  background: color.primary,
  color: "white",
  fontWeight: 600,
  fontSize: 15,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const input: CSSProperties = {
  padding: "11px 13px",
  borderRadius: 8,
  border: "1px solid oklch(0.87 0.008 255)",
  fontSize: 15,
  fontFamily: "inherit",
  width: "100%",
  background: "white",
  color: color.text,
};

export const label: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13.5,
  fontWeight: 600,
  color: "oklch(0.4 0.01 255)",
};

export const badge = (fg: string, bg: string): CSSProperties => ({
  display: "inline-flex",
  padding: "5px 11px",
  borderRadius: 999,
  background: bg,
  color: fg,
  fontSize: 12.5,
  fontWeight: 600,
  width: "fit-content",
});
