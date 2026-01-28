"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  ThemeTokens,
  defaultTokens,
  darkTokens,
  mergeTokens,
  tokensToCSS,
} from "./tokens";

/* =========================================================
   🎨 Rowi Theme Provider
   ---------------------------------------------------------
   Sistema de theming dinámico por Tenant/Hub

   Características:
   - Carga branding desde API por tenant
   - Inyecta CSS variables dinámicamente
   - Soporta light/dark mode
   - Permite override por Hub
========================================================= */

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  tokens: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
  tenantId: string | null;
  hubId: string | null;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "system",
  resolvedMode: "light",
  tokens: defaultTokens,
  setMode: () => {},
  tenantId: null,
  hubId: null,
  loading: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
  tenantId?: string;
  hubId?: string;
  defaultMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  tenantId,
  hubId,
  defaultMode = "system",
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");
  const [tokens, setTokens] = useState<ThemeTokens>(defaultTokens);
  const [customBranding, setCustomBranding] = useState<Partial<ThemeTokens> | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolver modo real (system → light/dark)
  useEffect(() => {
    function resolve() {
      if (mode === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setResolvedMode(prefersDark ? "dark" : "light");
      } else {
        setResolvedMode(mode);
      }
    }

    resolve();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", resolve);
    return () => mediaQuery.removeEventListener("change", resolve);
  }, [mode]);

  // Cargar branding del tenant
  useEffect(() => {
    async function loadBranding() {
      if (!tenantId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/theme/branding?tenantId=${tenantId}${hubId ? `&hubId=${hubId}` : ""}`);
        if (res.ok) {
          const data = await res.json();
          if (data.branding) {
            setCustomBranding(data.branding);
          }
        }
      } catch (e) {
        console.warn("Error loading branding:", e);
      } finally {
        setLoading(false);
      }
    }

    loadBranding();
  }, [tenantId, hubId]);

  // Calcular tokens finales
  useEffect(() => {
    let finalTokens = defaultTokens;

    // Aplicar dark mode si corresponde
    if (resolvedMode === "dark") {
      finalTokens = mergeTokens(finalTokens, darkTokens);
    }

    // Aplicar branding personalizado
    if (customBranding) {
      finalTokens = mergeTokens(finalTokens, customBranding);
    }

    setTokens(finalTokens);
  }, [resolvedMode, customBranding]);

  // Inyectar CSS variables
  useEffect(() => {
    const css = tokensToCSS(tokens);
    const styleId = "rowi-theme-vars";

    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `:root {\n  ${css}\n}`;

    // Actualizar clase dark
    document.documentElement.classList.toggle("dark", resolvedMode === "dark");
    document.documentElement.setAttribute("data-theme", resolvedMode);

    // Guardar preferencia
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("rowi.theme.mode", mode);
    }
  }, [tokens, resolvedMode, mode]);

  // Leer preferencia guardada
  useEffect(() => {
    const saved = localStorage.getItem("rowi.theme.mode") as ThemeMode | null;
    if (saved && ["light", "dark", "system"].includes(saved)) {
      setModeState(saved);
    }
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    window.dispatchEvent(new CustomEvent("rowi:theme-changed", { detail: newMode }));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        tokens,
        setMode,
        tenantId: tenantId || null,
        hubId: hubId || null,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/* =========================================================
   🎯 Hook: useThemeTokens
   Acceso directo a tokens específicos
========================================================= */

export function useThemeTokens() {
  const { tokens } = useTheme();
  return tokens;
}

/* =========================================================
   🎯 Hook: useThemeColors
   Acceso directo a colores
========================================================= */

export function useThemeColors() {
  const { tokens } = useTheme();
  return tokens.colors;
}
