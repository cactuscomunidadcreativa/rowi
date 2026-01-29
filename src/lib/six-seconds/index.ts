/**
 * 🔐 Six Seconds SSO Integration Module
 * ======================================
 *
 * Este módulo permite a los graduados y partners de Six Seconds
 * acceder a Rowi con sus credenciales existentes.
 *
 * Exports:
 * - SSO utilities and URL builders
 * - Token management
 * - React hook for client-side auth
 *
 * Usage:
 * ```tsx
 * import { useSixSecondsAuth, loginWithSixSeconds } from '@/lib/six-seconds';
 *
 * // In component
 * const { isAuthenticated, isSSOUser, login, logout } = useSixSecondsAuth();
 *
 * // Login
 * loginWithSixSeconds('/dashboard');
 * ```
 */

// Core SSO utilities
export {
  // Config
  SSO_CONFIG,

  // Types
  type SixSecondsUser,
  type SSOTokenPayload,

  // Token management (client-side)
  ssoTokenStore,

  // URL builders
  getSSOLoginUrl,
  getSSOLogoutUrl,
  getSSOUnauthorizedUrl,

  // Token verification (server-side)
  verifySSOToken,
  decodeSSOToken,
  extractUserFromSSOToken,
  isTokenExpired,
  isTempAccessExpired,

  // Client helpers
  loginWithSixSeconds,
  logoutFromSixSeconds,
  isAuthenticatedWithSixSeconds,
  getSSOAuthHeaders,
  handleSSOApiResponse,
} from "./sso";

// React hook
export { useSixSecondsAuth, type UseSixSecondsAuthReturn } from "./useSixSecondsAuth";
