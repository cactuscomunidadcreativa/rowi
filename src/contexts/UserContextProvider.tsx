"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";

/* =========================================================
   🎭 TIPOS PARA EL SISTEMA MULTI-ROL
========================================================= */

export type ContextType = "personal" | "superhub" | "hub" | "tenant" | "organization" | "community";

export interface UserContext {
  id: string;
  type: ContextType;
  name: string;
  slug?: string;
  role: string;
  roleLabel: string;
  icon?: string;
  color?: string;
  parentId?: string;
  parentName?: string;
  memberCount?: number;
  permissions?: string[];
}

export interface UserContextGroup {
  type: ContextType;
  label: string;
  labelEN: string;
  icon: string;
  contexts: UserContext[];
}

export interface CurrentContext {
  type: ContextType;
  id: string | null;
  name: string;
  role: string;
}

interface UserContextState {
  // Todos los contextos del usuario agrupados
  contextGroups: UserContextGroup[];

  // Contexto actualmente seleccionado
  currentContext: CurrentContext;

  // Helpers
  isLoading: boolean;
  error: string | null;

  // Acciones
  switchContext: (type: ContextType, id: string | null) => void;
  refreshContexts: () => void;

  // Getters útiles
  isConsultant: boolean;
  isCoach: boolean;
  isAdmin: boolean;
  hasMultipleContexts: boolean;
  getContextById: (type: ContextType, id: string) => UserContext | undefined;
  getContextsOfType: (type: ContextType) => UserContext[];
}

const defaultContext: CurrentContext = {
  type: "personal",
  id: null,
  name: "Mi Dashboard",
  role: "USER",
};

const UserContextContext = createContext<UserContextState | undefined>(undefined);

/* =========================================================
   🔄 FETCHER
========================================================= */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error fetching contexts");
  return res.json();
};

/* =========================================================
   🏠 PROVIDER
========================================================= */
export function UserContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Fetch de contextos del usuario
  const { data, error, mutate } = useSWR(
    isAuthenticated ? "/api/user/contexts" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  // Estado del contexto actual (persistido en localStorage)
  const [currentContext, setCurrentContext] = useState<CurrentContext>(defaultContext);

  // Cargar contexto guardado de localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rowi_current_context");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCurrentContext(parsed);
        } catch {
          // Si hay error, usar default
        }
      }
    }
  }, []);

  // Guardar contexto en localStorage cuando cambie
  useEffect(() => {
    if (typeof window !== "undefined" && currentContext) {
      localStorage.setItem("rowi_current_context", JSON.stringify(currentContext));
    }
  }, [currentContext]);

  // Cambiar contexto
  const switchContext = useCallback((type: ContextType, id: string | null) => {
    if (type === "personal") {
      setCurrentContext(defaultContext);
      return;
    }

    // Buscar el contexto en los grupos
    const group = data?.groups?.find((g: UserContextGroup) => g.type === type);
    const context = group?.contexts?.find((c: UserContext) => c.id === id);

    if (context) {
      setCurrentContext({
        type,
        id: context.id,
        name: context.name,
        role: context.role,
      });
    }
  }, [data]);

  // Refrescar contextos
  const refreshContexts = useCallback(() => {
    mutate();
  }, [mutate]);

  // Getters
  const getContextById = useCallback((type: ContextType, id: string): UserContext | undefined => {
    const group = data?.groups?.find((g: UserContextGroup) => g.type === type);
    return group?.contexts?.find((c: UserContext) => c.id === id);
  }, [data]);

  const getContextsOfType = useCallback((type: ContextType): UserContext[] => {
    const group = data?.groups?.find((g: UserContextGroup) => g.type === type);
    return group?.contexts || [];
  }, [data]);

  // Flags útiles
  const isConsultant = data?.flags?.isConsultant || false;
  const isCoach = data?.flags?.isCoach || false;
  const isAdmin = data?.flags?.isAdmin || false;

  const hasMultipleContexts = (data?.groups || []).reduce(
    (acc: number, g: UserContextGroup) => acc + g.contexts.length,
    0
  ) > 1;

  const value: UserContextState = {
    contextGroups: data?.groups || [],
    currentContext,
    isLoading: !data && !error && isAuthenticated,
    error: error?.message || null,
    switchContext,
    refreshContexts,
    isConsultant,
    isCoach,
    isAdmin,
    hasMultipleContexts,
    getContextById,
    getContextsOfType,
  };

  return (
    <UserContextContext.Provider value={value}>
      {children}
    </UserContextContext.Provider>
  );
}

/* =========================================================
   🪝 HOOK
========================================================= */
export function useUserContext() {
  const context = useContext(UserContextContext);
  if (!context) {
    throw new Error("useUserContext must be used within UserContextProvider");
  }
  return context;
}

/* =========================================================
   🎨 CONFIGURACIÓN DE TIPOS DE CONTEXTO
========================================================= */
export const CONTEXT_TYPE_CONFIG: Record<ContextType, {
  label: string;
  labelEN: string;
  icon: string;
  color: string;
}> = {
  personal: {
    label: "Personal",
    labelEN: "Personal",
    icon: "user",
    color: "#3b82f6",
  },
  superhub: {
    label: "Corporación",
    labelEN: "Corporation",
    icon: "building-2",
    color: "#8b5cf6",
  },
  hub: {
    label: "División/Región",
    labelEN: "Division/Region",
    icon: "globe",
    color: "#10b981",
  },
  tenant: {
    label: "Empresa",
    labelEN: "Company",
    icon: "briefcase",
    color: "#f59e0b",
  },
  organization: {
    label: "Departamento",
    labelEN: "Department",
    icon: "users",
    color: "#ec4899",
  },
  community: {
    label: "Equipo",
    labelEN: "Team",
    icon: "users-round",
    color: "#06b6d4",
  },
};

/* =========================================================
   🏷️ CONFIGURACIÓN DE ROLES
========================================================= */
export const ROLE_CONFIG: Record<string, {
  label: string;
  labelEN: string;
  color: string;
  priority: number;
}> = {
  // Roles globales
  SUPERADMIN: { label: "Super Admin", labelEN: "Super Admin", color: "#ef4444", priority: 100 },
  ADMIN: { label: "Administrador", labelEN: "Administrator", color: "#f59e0b", priority: 90 },

  // Roles de tenant
  OWNER: { label: "Propietario", labelEN: "Owner", color: "#8b5cf6", priority: 85 },
  MANAGER: { label: "Gerente", labelEN: "Manager", color: "#3b82f6", priority: 70 },
  EDITOR: { label: "Editor", labelEN: "Editor", color: "#10b981", priority: 50 },
  VIEWER: { label: "Visor", labelEN: "Viewer", color: "#6b7280", priority: 20 },

  // Roles especiales
  CONSULTANT: { label: "Consultor", labelEN: "Consultant", color: "#ec4899", priority: 80 },
  COACH: { label: "Coach", labelEN: "Coach", color: "#06b6d4", priority: 75 },
  MENTOR: { label: "Mentor", labelEN: "Mentor", color: "#14b8a6", priority: 60 },

  // Roles de comunidad
  MEMBER: { label: "Miembro", labelEN: "Member", color: "#6b7280", priority: 30 },

  // Roles de HR
  HR: { label: "Recursos Humanos", labelEN: "Human Resources", color: "#f97316", priority: 65 },
  BILLING: { label: "Facturación", labelEN: "Billing", color: "#84cc16", priority: 55 },

  // Roles académicos
  RESEARCHER: { label: "Investigador", labelEN: "Researcher", color: "#7c3aed", priority: 72 },
  ACADEMIC: { label: "Académico", labelEN: "Academic", color: "#6366f1", priority: 68 },

  // Default
  USER: { label: "Usuario", labelEN: "User", color: "#9ca3af", priority: 10 },
};

export function getRoleConfig(role: string) {
  return ROLE_CONFIG[role] || ROLE_CONFIG.USER;
}
