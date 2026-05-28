// src/lib/base-url.ts

const PROD_FALLBACK = "https://www.rowiia.com";

/**
 * Vercel's internal deploy hostnames (e.g. rowi.vercel.app) must never be used
 * for outbound links or internal self-fetches: emails would point users at a
 * host they can't reach, auth cookies scoped to www.rowiia.com wouldn't match,
 * and services like Slack/Resend reject them. Reject everywhere so a dirty env
 * var or proxy header can't poison the canonical URL.
 */
function isVercelHost(value: string): boolean {
  return value.toLowerCase().includes("vercel.app");
}

export function getBaseUrl() {
  // Prefer env var (útil en Vercel), si no: en server usa localhost, en client usa origin
  const env = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
  if (env && !isVercelHost(env)) return env;
  if (typeof window === "undefined") return "http://localhost:3000";
  return window.location.origin;
}

type HeadersLike = { get(name: string): string | null };
type RequestLike = { headers: HeadersLike; nextUrl?: { origin?: string } };

/**
 * Canonical base URL for server-rendered emails and other outbound links.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_APP_URL (preferred, set in Vercel)
 *   2. NEXT_PUBLIC_BASE_URL / BASE_URL (legacy)
 *   3. req x-forwarded-host + x-forwarded-proto (Vercel proxy)
 *   4. req.nextUrl.origin (Next 13+ runtime)
 *   5. PROD_FALLBACK — never localhost. Emails must always link to a
 *      real host because users open them outside the dev environment.
 */
export function getServerAppBaseUrl(req?: RequestLike): string {
  const env =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL;
  if (env && !isVercelHost(env)) return env.replace(/\/$/, "");

  if (req?.headers) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    if (host && !host.startsWith("localhost") && !isVercelHost(host)) {
      return `${proto}://${host}`;
    }
  }

  if (
    req?.nextUrl?.origin &&
    !req.nextUrl.origin.startsWith("http://localhost") &&
    !isVercelHost(req.nextUrl.origin)
  ) {
    return req.nextUrl.origin;
  }

  return PROD_FALLBACK;
}
