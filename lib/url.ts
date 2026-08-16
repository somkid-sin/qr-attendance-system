import { headers } from "next/headers";

import { optionalEnv } from "@/lib/env";

/** Absolute base URL of the running app, derived from the request host. */
export async function baseUrl(): Promise<string> {
  const configured = optionalEnv("NEXT_PUBLIC_APP_URL");
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
