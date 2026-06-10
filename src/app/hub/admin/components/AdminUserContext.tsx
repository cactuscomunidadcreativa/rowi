"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  isSuperAdmin: boolean;
  primaryTenantId: string | null;
  permissions: Array<{ role?: string | null; scopeType?: string | null; scopeId?: string | null }>;
  loading: boolean;
  /**
   * Whether the user holds an admin role anywhere at all. SuperAdmins
   * always count. Otherwise we check the permission scope types.
   */
  hasAnyAdminScope: boolean;
  /** Truthy when the user can administrate at superhub or rowiverse level. */
  isPlatformAdmin: boolean;
  /** Capabilities concedidas (rol + suscripción), para filtrar la nav. */
  capabilities: string[];
  /** Helper: ¿tiene esta capability? */
  can: (capability: string) => boolean;
}

const DEFAULT: AdminUser = {
  id: "",
  email: null,
  name: null,
  isSuperAdmin: false,
  primaryTenantId: null,
  permissions: [],
  loading: true,
  hasAnyAdminScope: false,
  isPlatformAdmin: false,
  capabilities: [],
  can: () => false,
};

const AdminUserContext = createContext<AdminUser>(DEFAULT);

export function AdminUserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminUser>(DEFAULT);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [meRes, capsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/account/capabilities"),
        ]);
        const data = await meRes.json();
        const capsData = await capsRes.json().catch(() => ({ capabilities: [] }));
        if (cancelled) return;
        if (!data.ok) {
          setState({ ...DEFAULT, loading: false });
          return;
        }
        const user = data.user;
        const permissions = (user.permissions || []) as AdminUser["permissions"];
        const hasAnyAdminScope =
          user.isSuperAdmin ||
          permissions.some((p) =>
            ["rowiverse", "superhub", "tenant", "hub"].includes(p.scopeType || ""),
          );
        const isPlatformAdmin =
          user.isSuperAdmin ||
          permissions.some(
            (p) =>
              p.scopeType === "rowiverse" || p.scopeType === "superhub",
          );
        const capabilities: string[] = Array.isArray(capsData?.capabilities)
          ? capsData.capabilities
          : [];
        const capsSet = new Set(capabilities);
        setState({
          id: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: !!user.isSuperAdmin,
          primaryTenantId: user.primaryTenantId ?? null,
          permissions,
          loading: false,
          hasAnyAdminScope,
          isPlatformAdmin,
          capabilities,
          can: (cap: string) => capsSet.has(cap),
        });
      } catch {
        if (!cancelled) setState({ ...DEFAULT, loading: false });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminUserContext.Provider value={state}>
      {children}
    </AdminUserContext.Provider>
  );
}

export function useAdminUser(): AdminUser {
  return useContext(AdminUserContext);
}
