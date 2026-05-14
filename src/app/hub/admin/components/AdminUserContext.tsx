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
};

const AdminUserContext = createContext<AdminUser>(DEFAULT);

export function AdminUserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminUser>(DEFAULT);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
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
