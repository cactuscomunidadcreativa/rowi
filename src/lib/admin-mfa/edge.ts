// src/lib/admin-mfa/edge.ts
// ============================================================
// 🔐 Parte EDGE-SAFE del MFA de admin. NO importa node:crypto —
// solo Web Crypto (crypto.subtle), disponible en el Edge runtime
// donde corre middleware.ts. El resto (envío de email, firma de la
// cookie con node:crypto) vive en ./index.ts (Node runtime).
// ============================================================

export const ADMIN_MFA_COOKIE = "rowi_admin_mfa";
export const ADMIN_OTP_TTL_MS = 10 * 60 * 1000; // 10 min
export const ADMIN_MFA_SESSION_MS = 8 * 60 * 60 * 1000; // 8 h
export const ADMIN_OTP_MAX_ATTEMPTS = 5;

/** ¿El bypass de emergencia está activo? */
export function adminMfaBypassEnabled(): boolean {
  return process.env.ADMIN_MFA_BYPASS === "true";
}

/** Secreto para firmar/verificar la cookie de sesión MFA.
 *  Fail-closed: si no hay secreto configurado lanzamos en vez de caer a un
 *  valor predecible (un fallback hardcoded haría trivial forjar la cookie y
 *  bypassear el MFA admin). NEXTAUTH_SECRET ya es obligatorio para la app. */
export function mfaSigningSecret(): string {
  const secret = process.env.ADMIN_MFA_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "🔐 CRITICAL: ADMIN_MFA_SECRET or NEXTAUTH_SECRET must be set to sign the admin MFA cookie. Refusing to use a predictable fallback.",
    );
  }
  return secret;
}

/** Parseo + validaciones comunes (formato, usuario, expiración). */
export function parseMfaCookie(
  cookieValue: string | undefined,
  userId: string,
): { cookieUserId: string; expStr: string; sig: string } | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return null;
  const [cookieUserId, expStr, sig] = parts;
  if (cookieUserId !== userId) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  return { cookieUserId, expStr, sig };
}

/**
 * Verifica la cookie MFA con Web Crypto (Edge-compatible). Async.
 * Úsala en middleware.ts.
 */
export async function verifyAdminMfaCookieEdge(
  cookieValue: string | undefined,
  userId: string,
): Promise<boolean> {
  const parsed = parseMfaCookie(cookieValue, userId);
  if (!parsed) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(mfaSigningSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(`${parsed.cookieUserId}.${parsed.expStr}`),
  );
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparación en tiempo constante (sin Buffer en Edge).
  if (expected.length !== parsed.sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ parsed.sig.charCodeAt(i);
  }
  return diff === 0;
}
