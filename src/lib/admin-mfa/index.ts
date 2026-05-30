// src/lib/admin-mfa/index.ts
// ============================================================
// 🔐 MFA por email para el área de administración (/hub/admin).
// ------------------------------------------------------------
// NO es un segundo factor del login: es un gate ADICIONAL al entrar
// al admin. El login (NextAuth) queda intacto, por lo que un fallo
// aquí nunca te bloquea de tu cuenta — solo del panel admin.
//
// Parte Node (este archivo): genera OTP y firma la cookie con
// node:crypto. La parte EDGE-SAFE (verificación de cookie con Web
// Crypto, usada por middleware.ts) vive en ./edge.ts.
// ============================================================

import crypto from "crypto";
import {
  ADMIN_MFA_SESSION_MS,
  mfaSigningSecret,
  parseMfaCookie,
} from "./edge";

// Re-export de lo compartido para que los call sites Node tengan una
// sola entrada (`@/lib/admin-mfa`).
export {
  ADMIN_MFA_COOKIE,
  ADMIN_OTP_TTL_MS,
  ADMIN_MFA_SESSION_MS,
  ADMIN_OTP_MAX_ATTEMPTS,
  adminMfaBypassEnabled,
  verifyAdminMfaCookieEdge,
} from "./edge";

/** Genera un código numérico de 6 dígitos criptográficamente aleatorio. */
export function generateAdminOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Construye el valor firmado de la cookie MFA: `${userId}.${exp}.${hmac}`.
 * El HMAC ata userId+exp al secreto del servidor (no falsificable).
 */
export function buildAdminMfaCookieValue(userId: string): string {
  const exp = Date.now() + ADMIN_MFA_SESSION_MS;
  const payload = `${userId}.${exp}`;
  const sig = crypto
    .createHmac("sha256", mfaSigningSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

/**
 * Verifica la cookie MFA (Node runtime, node:crypto). Para Edge usar
 * verifyAdminMfaCookieEdge de ./edge.
 */
export function verifyAdminMfaCookie(
  cookieValue: string | undefined,
  userId: string,
): boolean {
  const parsed = parseMfaCookie(cookieValue, userId);
  if (!parsed) return false;

  const expected = crypto
    .createHmac("sha256", mfaSigningSecret())
    .update(`${parsed.cookieUserId}.${parsed.expStr}`)
    .digest("hex");

  const a = Buffer.from(parsed.sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}
