"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  User,
  Briefcase,
  Users as UsersIcon,
  UserCog,
  Heart,
  Handshake,
  Check,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import useSWR from "swr";
import { useI18n } from "@/lib/i18n/I18nProvider";

type ContextKind =
  | "personal"
  | "employee"
  | "manager"
  | "family"
  | "service_provider"
  | "service_client"
  | "tenant_primary"
  | "workspace_pro";

interface AccountContext {
  id: string;
  kind: ContextKind;
  labelKey: string;
  fallback: string;
  detail?: string;
  scopeRef?: { type: string; id: string };
  home: string;
  weight: number;
}

const KIND_ICON: Record<ContextKind, React.ElementType> = {
  personal: User,
  employee: Briefcase,
  manager: UserCog,
  family: Heart,
  service_provider: Handshake,
  service_client: Handshake,
  tenant_primary: Briefcase,
  workspace_pro: UsersIcon,
};

const KIND_COLOR: Record<ContextKind, string> = {
  personal: "#64748b",
  employee: "#2563eb",
  manager: "#7c3aed",
  family: "#ec4899",
  service_provider: "#0891b2",
  service_client: "#0d9488",
  tenant_primary: "#4f46e5",
  workspace_pro: "#059669",
};

const COOKIE_NAME = "rowi_active_context";

function readActiveContextId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("=")) || null;
}

function writeActiveContextId(id: string) {
  if (typeof document === "undefined") return;
  // 30 days, path=/ so all server routes can read it.
  // Secure flag only over HTTPS — leaving it off on http://localhost so
  // dev still works. samesite=lax protects navigations from CSRF.
  const maxAge = 60 * 60 * 24 * 30;
  const secure =
    typeof window !== "undefined" && window.location?.protocol === "https:"
      ? "; secure"
      : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AccountContextChip() {
  const router = useRouter();
  const { t } = useI18n();
  const { data, isLoading } = useSWR<{
    ok: boolean;
    contexts: AccountContext[];
  }>("/api/account/contexts", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveId(readActiveContextId());
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const contexts = data?.contexts || [];
  if (isLoading || contexts.length === 0) return null;

  // Default: if no cookie, pick the first (personal).
  const effectiveActiveId = activeId || contexts[0]?.id || null;
  const active = contexts.find((c) => c.id === effectiveActiveId) || contexts[0];
  if (!active) return null;

  const ActiveIcon = KIND_ICON[active.kind] || User;

  function pick(ctx: AccountContext) {
    writeActiveContextId(ctx.id);
    setActiveId(ctx.id);
    setOpen(false);
    router.push(ctx.home);
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors max-w-[200px]"
        title={t("account.context.switchTitle", "Cambiar contexto activo")}
      >
        <ActiveIcon
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: KIND_COLOR[active.kind] }}
        />
        <span className="text-xs font-medium truncate">
          {t(active.labelKey, active.fallback)}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xl overflow-hidden z-50"
          >
            <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-800">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t("account.context.dropdownTitle", "Contexto activo")}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {t(
                  "account.context.dropdownHint",
                  "Cambia el sombrero que usas en Rowi.",
                )}
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {contexts.map((ctx) => {
                const Icon = KIND_ICON[ctx.kind] || User;
                const isSelected = ctx.id === effectiveActiveId;
                return (
                  <button
                    key={ctx.id}
                    onClick={() => pick(ctx)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? "bg-[var(--rowi-g2)]/10"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${KIND_COLOR[ctx.kind]}18`,
                      }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: KIND_COLOR[ctx.kind] }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t(ctx.labelKey, ctx.fallback)}
                      </p>
                      {ctx.detail && (
                        <p className="text-[11px] text-gray-500 truncate">
                          {ctx.detail}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[var(--rowi-g2)] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
