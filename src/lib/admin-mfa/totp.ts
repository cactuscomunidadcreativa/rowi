// src/lib/admin-mfa/totp.ts
// ============================================================
// 🔐 TOTP (app autenticadora) para el MFA del panel admin.
// Reemplaza el email-OTP: el secreto vive cifrado en User.mfaTotpSecret
// y se valida contra el código de 6 dígitos de la app del usuario.
// Solo Node runtime (speakeasy/qrcode usan node:crypto) — NO importar
// desde Edge.
// ============================================================

import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { encryptValue, decryptValue } from "@/lib/config/systemConfig";

const ISSUER = "Rowi Admin";

/** Genera un secreto TOTP nuevo (base32). */
export function generateTotpSecret(accountName: string): {
  base32: string;
  otpauthUrl: string;
} {
  const secret = speakeasy.generateSecret({
    name: `${ISSUER} (${accountName})`,
    issuer: ISSUER,
  });
  return {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url || "",
  };
}

/** Cifra el secreto base32 para guardarlo en reposo. */
export function encryptTotpSecret(secret: string): string {
  return encryptValue(secret);
}

/** Descifra el secreto guardado. */
export function decryptTotpSecret(encrypted: string): string {
  return decryptValue(encrypted);
}

/** Genera el QR (data-URL PNG) a partir del otpauth:// URI. */
export async function buildQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

/**
 * Valida un código de 6 dígitos contra el secreto base32. window:1 acepta
 * el step anterior/siguiente (±30s) para cubrir desfases de reloj.
 */
export function verifyTotpCode(code: string, base32Secret: string): boolean {
  try {
    return speakeasy.totp.verify({
      secret: base32Secret,
      encoding: "base32",
      token: code,
      window: 1,
    });
  } catch {
    return false;
  }
}
