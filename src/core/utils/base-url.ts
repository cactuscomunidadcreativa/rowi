// src/lib/base-url.ts
export function getBaseUrl() {
  // Prefer env var (útil en Vercel), si no: en server usa localhost, en client usa origin
  const env = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
  if (env) return env;
  if (typeof window === "undefined") return "http://localhost:3000";
  return window.location.origin;
}
