import QRCode from "qrcode";

import { getCurrentToken } from "@/lib/token";
import { baseUrl } from "@/lib/url";

/** Build the check-in URL a student's scan should land on. */
export async function buildCheckinUrl(sessionId: string, token: string): Promise<string> {
  const base = await baseUrl();
  return `${base}/checkin?s=${encodeURIComponent(sessionId)}&t=${encodeURIComponent(token)}`;
}

/** Render a QR code (data URL) encoding the current window's check-in link. */
export async function renderCurrentQr(sessionId: string): Promise<{ qrDataUrl: string; token: string }> {
  const token = getCurrentToken(sessionId);
  const checkinUrl = await buildCheckinUrl(sessionId, token);
  const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
    width: 320,
    margin: 1,
    color: { dark: "#1a1c2eff", light: "#ffffffff" },
  });
  return { qrDataUrl, token };
}
