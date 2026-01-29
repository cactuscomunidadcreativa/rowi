"use client";

/**
 * 🔐 useSixSecondsAuth Hook
 * ==========================
 * Hook para manejar la autenticación con Six Seconds SSO.
 *
 * Features:
 * - Detecta si el usuario está autenticado via SSO
 * - Provee funciones de login/logout
 * - Sincroniza con NextAuth session
 */

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ssoTokenStore,
  extractUserFromSSOToken,
  isTokenExpired,
  isTempAccessExpired,
  loginWithSixSeconds,
  logoutFromSixSeconds,
  type SSOTokenPayload,
} from "./sso";

export interface UseSixSecondsAuthReturn {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  isSSOUser: boolean;

  // User info from SSO token
  ssoUser: SSOTokenPayload | null;

  // Actions
  login: (returnPath?: string) => void;
  logout: () => void;

  // Token status
  hasValidToken: boolean;
  isTempAccess: boolean;
  tempAccessExpired: boolean;
}

export function useSixSecondsAuth(): UseSixSecondsAuthReturn {
  const { data: session, status } = useSession();
  const [ssoUser, setSsoUser] = useState<SSOTokenPayload | null>(null);
  const [hasValidToken, setHasValidToken] = useState(false);

  // ─────────────────────────────────────────────────────────
  // Check SSO token on mount and token changes
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const checkToken = () => {
      const token = ssoTokenStore.getToken();

      if (!token) {
        setSsoUser(null);
        setHasValidToken(false);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        console.warn("⚠️ Six Seconds token expired");
        ssoTokenStore.removeToken();
        setSsoUser(null);
        setHasValidToken(false);
        return;
      }

      // Extract user info
      const userInfo = extractUserFromSSOToken(token);
      if (userInfo) {
        setSsoUser(userInfo);
        setHasValidToken(true);
      } else {
        setSsoUser(null);
        setHasValidToken(false);
      }
    };

    checkToken();

    // Listen for token changes
    window.addEventListener("sso-token-changed", checkToken);
    return () => window.removeEventListener("sso-token-changed", checkToken);
  }, []);

  // ─────────────────────────────────────────────────────────
  // Derived state
  // ─────────────────────────────────────────────────────────
  const isLoading = status === "loading";
  const isAuthenticated = !!session?.user;

  // Check if user logged in via Six Seconds SSO
  const isSSOUser =
    isAuthenticated &&
    ((session?.user as any)?.ssoProvider === "six-seconds" || hasValidToken);

  // Check temp access status
  const isTempAccess = ssoUser?.isTempAccess ?? false;
  const tempAccessExpired = hasValidToken
    ? isTempAccessExpired(ssoTokenStore.getToken()!)
    : false;

  // ─────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────
  const login = useCallback((returnPath?: string) => {
    loginWithSixSeconds(returnPath);
  }, []);

  const logout = useCallback(() => {
    logoutFromSixSeconds();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    isSSOUser,
    ssoUser,
    login,
    logout,
    hasValidToken,
    isTempAccess,
    tempAccessExpired,
  };
}
