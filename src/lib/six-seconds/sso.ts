/**
 * 🔐 Six Seconds SSO Integration for Rowi
 * =========================================
 * Permite a graduados de Six Seconds acceder a Rowi con sus credenciales existentes.
 *
 * Flow:
 * 1. Usuario hace clic en "Entrar con Six Seconds"
 * 2. Redirige al SSO de Six Seconds
 * 3. Six Seconds valida y redirige de vuelta con token JWT
 * 4. Rowi valida el token y crea/vincula el usuario local
 */

import jwt from "jsonwebtoken";
import Cookies from "js-cookie";

// =========================================================
// Configuración
// =========================================================
const SSO_CONFIG = {
  // URLs del SSO de Six Seconds
  ssoSiteUrl: process.env.NEXT_PUBLIC_SIX_SECONDS_SSO_URL || "https://sso.6seconds.org",
  ssoApiUrl: process.env.NEXT_PUBLIC_SIX_SECONDS_API_URL || "https://sso-api.6seconds.org",

  // Credenciales de Rowi en el sistema SSO
  clientId: process.env.SIX_SECONDS_CLIENT_ID || "",
  jwtSecret: process.env.SIX_SECONDS_JWT_SECRET || "",

  // Configuración de Rowi
  rowiUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  sourceName: "Rowi",

  // Token names
  tokenName: process.env.NEXT_PUBLIC_ENVIRONMENT === "production" ? "ss_token" : "ss_dev_token",
  refreshTokenName: "ss_refresh",
};

// =========================================================
// Tipos
// =========================================================
export interface SixSecondsUser {
  email: string;
  SSOUserId: string;
  name?: string;
  preferredLanguage?: string;
  app_access: Array<{
    SSOId: string;
    App_Access: string;
    Role: "SuperAdmin" | "Admin" | "User";
    Status: number; // 1 = active
    Temp_Access: number; // 1 = temporal
    Temp_Date: string;
  }>;
  iat: number;
  exp: number;
}

export interface SSOTokenPayload {
  email: string;
  ssoUserId: string;
  role: string;
  name?: string;
  language?: string;
  hasRowiAccess: boolean;
  isTempAccess: boolean;
  tempExpiryDate?: string;
}

// =========================================================
// Token Store (Client-side)
// =========================================================
export const ssoTokenStore = {
  getToken: () => {
    if (typeof window === "undefined") return null;
    return Cookies.get(SSO_CONFIG.tokenName) || null;
  },

  setToken: (token: string) => {
    if (typeof window === "undefined") return;
    Cookies.set(SSO_CONFIG.tokenName, token, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    window.dispatchEvent(new Event("sso-token-changed"));
  },

  removeToken: () => {
    if (typeof window === "undefined") return;
    Cookies.remove(SSO_CONFIG.tokenName);
    localStorage?.removeItem(SSO_CONFIG.tokenName);
    window.dispatchEvent(new Event("sso-token-changed"));
  },

  getRefreshToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage?.getItem(SSO_CONFIG.refreshTokenName) || null;
  },

  setRefreshToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage?.setItem(SSO_CONFIG.refreshTokenName, token);
  },

  removeRefreshToken: () => {
    if (typeof window === "undefined") return;
    localStorage?.removeItem(SSO_CONFIG.refreshTokenName);
  },
};

// =========================================================
// SSO URL Builders
// =========================================================

/**
 * Genera la URL de login del SSO de Six Seconds
 * @param returnPath - Ruta a donde redirigir después del login (opcional)
 */
export function getSSOLoginUrl(returnPath: string = "/dashboard"): string {
  const returnUrl = encodeURIComponent(`${SSO_CONFIG.rowiUrl}/api/auth/six-seconds/callback`);
  const state = encodeURIComponent(returnPath); // Guardar la ruta de retorno en state

  return `${SSO_CONFIG.ssoSiteUrl}/login?source=${SSO_CONFIG.sourceName}&clientId=${SSO_CONFIG.clientId}&returnUrl=${returnUrl}&state=${state}`;
}

/**
 * Genera la URL de logout del SSO
 */
export function getSSOLogoutUrl(): string {
  return `${SSO_CONFIG.ssoSiteUrl}/logout?source=${SSO_CONFIG.sourceName}&returnUrl=${encodeURIComponent(SSO_CONFIG.rowiUrl)}`;
}

/**
 * Genera la URL para usuarios no autorizados
 */
export function getSSOUnauthorizedUrl(): string {
  return `${SSO_CONFIG.ssoSiteUrl}/unauthorized?source=${SSO_CONFIG.sourceName}`;
}

// =========================================================
// Token Verification (Server-side)
// =========================================================

/**
 * Verifica y decodifica un token JWT de Six Seconds
 * SOLO usar en server-side
 */
export function verifySSOToken(token: string): SixSecondsUser | null {
  if (!SSO_CONFIG.jwtSecret) {
    console.error("❌ SIX_SECONDS_JWT_SECRET not configured");
    return null;
  }

  try {
    const decoded = jwt.verify(token, SSO_CONFIG.jwtSecret, {
      algorithms: ["HS256"],
    }) as SixSecondsUser;

    return decoded;
  } catch (error) {
    console.error("❌ Error verifying Six Seconds token:", error);
    return null;
  }
}

/**
 * Decodifica un token sin verificar (para debugging)
 */
export function decodeSSOToken(token: string): SixSecondsUser | null {
  try {
    const decoded = jwt.decode(token) as SixSecondsUser;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extrae información útil del token de Six Seconds
 */
export function extractUserFromSSOToken(token: string): SSOTokenPayload | null {
  const decoded = decodeSSOToken(token);
  if (!decoded) return null;

  // Buscar acceso a Rowi específicamente
  const rowiAccess = decoded.app_access?.find(
    (access) => access.App_Access === "Rowi" && access.Status === 1
  );

  // Si no tiene acceso específico a Rowi, buscar acceso general
  const anyAccess = decoded.app_access?.find((access) => access.Status === 1);

  const access = rowiAccess || anyAccess;

  return {
    email: decoded.email,
    ssoUserId: decoded.SSOUserId,
    role: access?.Role || "User",
    name: decoded.name,
    language: decoded.preferredLanguage,
    hasRowiAccess: !!access,
    isTempAccess: access?.Temp_Access === 1,
    tempExpiryDate: access?.Temp_Date,
  };
}

/**
 * Verifica si el token ha expirado
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeSSOToken(token);
  if (!decoded || !decoded.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Verifica si el acceso temporal ha expirado
 */
export function isTempAccessExpired(token: string): boolean {
  const user = extractUserFromSSOToken(token);
  if (!user || !user.isTempAccess || !user.tempExpiryDate) return false;

  const expiryDate = new Date(user.tempExpiryDate);
  return new Date() > expiryDate;
}

// =========================================================
// Client-side Helpers
// =========================================================

/**
 * Inicia el flujo de login con Six Seconds SSO
 */
export function loginWithSixSeconds(returnPath?: string): void {
  if (typeof window === "undefined") return;
  window.location.href = getSSOLoginUrl(returnPath);
}

/**
 * Cierra sesión del SSO
 */
export function logoutFromSixSeconds(): void {
  ssoTokenStore.removeToken();
  ssoTokenStore.removeRefreshToken();

  if (typeof window !== "undefined") {
    window.location.href = getSSOLogoutUrl();
  }
}

/**
 * Verifica si el usuario está autenticado con Six Seconds
 */
export function isAuthenticatedWithSixSeconds(): boolean {
  const token = ssoTokenStore.getToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

// =========================================================
// API Helpers
// =========================================================

/**
 * Crea headers con el token de Six Seconds para llamadas API
 */
export function getSSOAuthHeaders(): Record<string, string> {
  const token = ssoTokenStore.getToken();
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
    "X-SSO-Source": SSO_CONFIG.sourceName,
  };
}

/**
 * Maneja la respuesta de una API y actualiza tokens si es necesario
 */
export function handleSSOApiResponse(response: Response): void {
  // Verificar si hay nuevos tokens en los headers
  const newAccessToken = response.headers.get("x-access");
  const newRefreshToken = response.headers.get("x-refresh");

  if (newAccessToken) {
    ssoTokenStore.setToken(newAccessToken);
  }

  if (newRefreshToken) {
    ssoTokenStore.setRefreshToken(newRefreshToken);
  }
}

// =========================================================
// Export Config (para uso en otros módulos)
// =========================================================
export { SSO_CONFIG };
