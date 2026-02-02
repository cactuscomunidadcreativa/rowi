"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  User,
  Building2,
  Globe,
  Briefcase,
  Users,
  UsersRound,
  Check,
  Search,
  Sparkles,
  FlaskConical,
  LayoutDashboard,
  Shield,
  Settings,
  BarChart3,
  GraduationCap,
  Heart,
} from "lucide-react";
import { useUserContext, ContextType, UserContext, ROLE_CONFIG } from "@/contexts/UserContextProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   🎨 Iconos por tipo de contexto
========================================================= */
const CONTEXT_ICONS: Record<ContextType, React.ElementType> = {
  personal: User,
  superhub: Building2,
  hub: Globe,
  tenant: Briefcase,
  organization: Users,
  community: UsersRound,
};

/* =========================================================
   🔗 Quick Links (accesos rápidos según rol)
========================================================= */
interface QuickLink {
  href: string;
  icon: React.ElementType;
  labelES: string;
  labelEN: string;
  color: string;
  requiredRoles?: string[];
  requiredFlags?: ("isAdmin" | "isConsultant" | "isCoach")[];
}

const QUICK_LINKS: QuickLink[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    labelES: "Mi Dashboard",
    labelEN: "My Dashboard",
    color: "#3b82f6",
  },
  {
    href: "/affinity",
    icon: Heart,
    labelES: "Afinidad",
    labelEN: "Affinity",
    color: "#ec4899",
  },
  {
    href: "/research",
    icon: FlaskConical,
    labelES: "Investigación",
    labelEN: "Research",
    color: "#7c3aed",
    requiredFlags: ["isAdmin"],
  },
  {
    href: "/hub/admin",
    icon: Shield,
    labelES: "Admin Panel",
    labelEN: "Admin Panel",
    color: "#ef4444",
    requiredFlags: ["isAdmin"],
  },
  {
    href: "/benchmark",
    icon: BarChart3,
    labelES: "Benchmark",
    labelEN: "Benchmark",
    color: "#10b981",
  },
  {
    href: "/learning",
    icon: GraduationCap,
    labelES: "Aprendizaje",
    labelEN: "Learning",
    color: "#f59e0b",
  },
];

/* =========================================================
   🎭 Componente Principal: ContextSwitcher
========================================================= */
export default function ContextSwitcher() {
  const { lang } = useI18n();
  const {
    contextGroups,
    currentContext,
    switchContext,
    isLoading,
    hasMultipleContexts,
    isConsultant,
    isCoach,
    isAdmin,
  } = useUserContext();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // Icono del contexto actual
  const CurrentIcon = CONTEXT_ICONS[currentContext.type] || User;
  const currentRoleConfig = ROLE_CONFIG[currentContext.role] || ROLE_CONFIG.USER;

  // Filtrar contextos por búsqueda
  const filteredGroups = contextGroups
    .map((group) => ({
      ...group,
      contexts: group.contexts
        .filter((ctx) =>
          ctx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ctx.role.toLowerCase().includes(searchQuery.toLowerCase())
        )
        // Ordenar por prioridad del rol (mayor primero)
        .sort((a, b) => {
          const priorityA = ROLE_CONFIG[a.role]?.priority || 0;
          const priorityB = ROLE_CONFIG[b.role]?.priority || 0;
          return priorityB - priorityA;
        }),
    }))
    .filter((group) => group.contexts.length > 0);

  // Filtrar quick links según permisos
  const visibleQuickLinks = QUICK_LINKS.filter((link) => {
    if (!link.requiredFlags || link.requiredFlags.length === 0) return true;
    return link.requiredFlags.some((flag) => {
      if (flag === "isAdmin") return isAdmin;
      if (flag === "isConsultant") return isConsultant;
      if (flag === "isCoach") return isCoach;
      return false;
    });
  });

  return (
    <div ref={containerRef} className="relative">
      {/* Botón principal - ancho fijo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
          w-[200px] min-w-[200px] max-w-[200px]
          ${isOpen
            ? "border-[var(--rowi-g2)] bg-[var(--rowi-g2)]/5"
            : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
          }
          ${isLoading ? "opacity-50 cursor-wait" : "cursor-pointer"}
        `}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${currentRoleConfig.color}15` }}
        >
          <CurrentIcon
            className="w-4 h-4"
            style={{ color: currentRoleConfig.color }}
          />
        </div>
        <div className="text-left min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentContext.type === "personal"
              ? (lang === "es" ? "Mi Dashboard" : "My Dashboard")
              : currentContext.name}
          </p>
          {currentContext.type !== "personal" && (
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
              {lang === "es" ? currentRoleConfig.label : currentRoleConfig.labelEN}
            </p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xl overflow-hidden z-50"
          >
            {/* Header con búsqueda */}
            <div className="p-3 border-b border-gray-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={lang === "es" ? "Buscar contexto..." : "Search context..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-zinc-800 border-0 rounded-lg focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none"
                />
              </div>
            </div>

            {/* Lista de contextos */}
            <div className="max-h-72 overflow-y-auto">
              {/* Opción Personal siempre visible */}
              <ContextOption
                context={{
                  id: "personal",
                  type: "personal",
                  name: lang === "es" ? "Mi Dashboard Personal" : "My Personal Dashboard",
                  role: "USER",
                  roleLabel: lang === "es" ? "Vista Personal" : "Personal View",
                }}
                isSelected={currentContext.type === "personal"}
                onClick={() => {
                  switchContext("personal", null);
                  setIsOpen(false);
                  setSearchQuery("");
                }}
                lang={lang}
              />

              {/* Separador si hay grupos */}
              {filteredGroups.length > 0 && (
                <div className="border-t border-gray-200 dark:border-zinc-800 my-1" />
              )}

              {/* Grupos de contextos */}
              {filteredGroups.map((group) => (
                <div key={group.type}>
                  {/* Header del grupo */}
                  <div className="px-3 py-2 flex items-center gap-2 sticky top-0 bg-white dark:bg-zinc-900">
                    {(() => {
                      const GroupIcon = CONTEXT_ICONS[group.type as ContextType] || Users;
                      return <GroupIcon className="w-4 h-4 text-gray-400" />;
                    })()}
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {lang === "es" ? group.label : group.labelEN}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({group.contexts.length})
                    </span>
                  </div>

                  {/* Contextos del grupo */}
                  {group.contexts.map((ctx) => (
                    <ContextOption
                      key={ctx.id}
                      context={ctx}
                      isSelected={currentContext.id === ctx.id && currentContext.type === ctx.type}
                      onClick={() => {
                        switchContext(ctx.type, ctx.id);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      lang={lang}
                    />
                  ))}
                </div>
              ))}

              {/* Sin resultados */}
              {filteredGroups.length === 0 && searchQuery && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {lang === "es" ? "No se encontraron contextos" : "No contexts found"}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            {visibleQuickLinks.length > 0 && !searchQuery && (
              <>
                <div className="border-t border-gray-200 dark:border-zinc-800" />
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">
                    {lang === "es" ? "Accesos Rápidos" : "Quick Access"}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {visibleQuickLinks.slice(0, 6).map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => {
                          setIsOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <link.icon className="w-3.5 h-3.5" style={{ color: link.color }} />
                        <span className="truncate">
                          {lang === "es" ? link.labelES : link.labelEN}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Footer con info de consultor */}
            {isConsultant && (
              <div className="p-3 border-t border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10">
                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {lang === "es"
                      ? "Modo Consultor activo"
                      : "Consultant mode active"}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   🔘 Componente de opción de contexto
========================================================= */
function ContextOption({
  context,
  isSelected,
  onClick,
  lang,
}: {
  context: UserContext;
  isSelected: boolean;
  onClick: () => void;
  lang: string;
}) {
  const Icon = CONTEXT_ICONS[context.type] || Users;
  const roleConfig = ROLE_CONFIG[context.role] || ROLE_CONFIG.USER;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
        ${isSelected
          ? "bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]"
          : "hover:bg-gray-50 dark:hover:bg-zinc-800"
        }
      `}
    >
      {/* Icono */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${context.color || roleConfig.color}15` }}
      >
        <Icon
          className="w-4 h-4"
          style={{ color: context.color || roleConfig.color }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isSelected ? "" : "text-gray-900 dark:text-white"}`}>
          {context.name}
        </p>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: `${roleConfig.color}15`,
              color: roleConfig.color,
            }}
          >
            {lang === "es" ? roleConfig.label : roleConfig.labelEN}
          </span>
          {context.memberCount !== undefined && context.memberCount > 0 && (
            <span className="text-[10px] text-gray-400">
              {context.memberCount} {lang === "es" ? "miembros" : "members"}
            </span>
          )}
        </div>
      </div>

      {/* Check si está seleccionado */}
      {isSelected && (
        <Check className="w-5 h-5 text-[var(--rowi-g2)] flex-shrink-0" />
      )}
    </button>
  );
}

/* =========================================================
   📱 Versión Compacta para Mobile
========================================================= */
export function ContextSwitcherCompact() {
  const { currentContext, hasMultipleContexts, isConsultant } = useUserContext();
  const { lang } = useI18n();

  if (!hasMultipleContexts && !isConsultant) return null;

  const Icon = CONTEXT_ICONS[currentContext.type] || User;
  const roleConfig = ROLE_CONFIG[currentContext.role] || ROLE_CONFIG.USER;

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded-md"
      style={{ backgroundColor: `${roleConfig.color}10` }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color: roleConfig.color }} />
      <span className="text-xs font-medium truncate max-w-[100px]" style={{ color: roleConfig.color }}>
        {currentContext.type === "personal"
          ? (lang === "es" ? "Personal" : "Personal")
          : currentContext.name}
      </span>
    </div>
  );
}
