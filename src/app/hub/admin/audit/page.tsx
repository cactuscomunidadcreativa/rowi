"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Shield,
  Search,
  RefreshCw,
  User,
  Clock,
  LogIn,
  Settings,
  Edit3,
  Eye,
  Globe,
  Loader2,
  FileText,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Categories: i18n key + visual config. Labels resolved at render time.
const CATEGORIES: Record<
  string,
  { labelKey: string; fallback: string; color: string; icon: React.ElementType }
> = {
  security: { labelKey: "admin.audit.cat.security", fallback: "Seguridad", color: "text-red-500 bg-red-50 dark:bg-red-900/20", icon: Shield },
  auth: { labelKey: "admin.audit.cat.auth", fallback: "Autenticación", color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20", icon: LogIn },
  data: { labelKey: "admin.audit.cat.data", fallback: "Datos", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20", icon: Edit3 },
  system: { labelKey: "admin.audit.cat.system", fallback: "Sistema", color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20", icon: Settings },
  view: { labelKey: "admin.audit.cat.view", fallback: "Navegación", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20", icon: Eye },
};

function categorize(action: string): string {
  const a = action?.toUpperCase() || "";
  if (a.includes("LOGIN") || a.includes("LOGOUT") || a.includes("AUTH")) return "auth";
  if (a.includes("SECURITY") || a.includes("UNAUTHORIZED") || a.includes("CSRF")) return "security";
  if (a.includes("CREATE") || a.includes("UPDATE") || a.includes("DELETE") || a.includes("CHANGE")) return "data";
  if (a.includes("VIEW") || a.includes("NAVIGATE") || a.includes("PAGE")) return "view";
  return "system";
}

function severityBadge(action: string) {
  const a = action?.toUpperCase() || "";
  if (a.includes("UNAUTHORIZED") || a.includes("CSRF") || a.includes("FAILED") || a.includes("DELETE"))
    return { key: "high", fallback: "Alto", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  if (a.includes("CHANGE") || a.includes("UPDATE") || a.includes("SECURITY"))
    return { key: "medium", fallback: "Medio", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
  return { key: "low", fallback: "Bajo", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
}

export default function AuditPage() {
  const { t, lang } = useI18n();
  const { data, isLoading, mutate } = useSWR("/api/hub/logs/interactions", fetcher);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const logs = Array.isArray(data) ? data : [];

  // Filter
  const filtered = logs.filter((l: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      l.action?.toLowerCase().includes(q) ||
      l.entity?.toLowerCase().includes(q) ||
      l.userId?.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "all" || categorize(l.action) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const stats = {
    total: logs.length,
    security: logs.filter((l: any) => categorize(l.action) === "security").length,
    auth: logs.filter((l: any) => categorize(l.action) === "auth").length,
    data: logs.filter((l: any) => categorize(l.action) === "data").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("admin.audit.title", "Auditoría")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t(
                "admin.audit.subtitle",
                "Registro de seguridad y acciones del sistema",
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          {t("admin.audit.refresh", "Actualizar")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("admin.audit.stat.total", "Total"), value: stats.total, icon: FileText, color: "#6366f1" },
          { label: t("admin.audit.cat.security", "Seguridad"), value: stats.security, icon: Shield, color: "#ef4444" },
          { label: t("admin.audit.cat.auth", "Autenticación"), value: stats.auth, icon: LogIn, color: "#3b82f6" },
          { label: t("admin.audit.cat.data", "Datos"), value: stats.data, icon: Edit3, color: "#10b981" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t(
              "admin.audit.searchPlaceholder",
              "Buscar por acción, entidad, usuario...",
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "all", label: t("admin.audit.filter.all", "Todos") },
            ...Object.entries(CATEGORIES).map(([key, val]) => ({
              key,
              label: t(val.labelKey, val.fallback),
            })),
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                categoryFilter === cat.key
                  ? "bg-rose-500 text-white shadow-sm"
                  : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-700 hover:border-rose-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
          <Shield className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {search || categoryFilter !== "all"
              ? t(
                  "admin.audit.empty.filtered",
                  "Sin resultados con estos filtros",
                )
              : t("admin.audit.empty.none", "No hay registros de auditoría")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 100).map((log: any) => {
            const cat = CATEGORIES[categorize(log.action)] || CATEGORIES.system;
            const sev = severityBadge(log.action);
            const CatIcon = cat.icon;
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 hover:shadow-sm transition-shadow"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                  <CatIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{log.action || "—"}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sev.color}`}>
                      {t(`admin.audit.severity.${sev.key}`, sev.fallback)}
                    </span>
                    {log.entity && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        → {log.entity}{log.targetId ? ` #${log.targetId.slice(0, 8)}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.userId
                        ? log.userId.slice(0, 12) + "…"
                        : t("admin.audit.system", "Sistema")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleDateString(lang || "es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {log.ipAddress && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {log.ipAddress}
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <div className="mt-2 p-2 rounded-lg bg-gray-50 dark:bg-zinc-900 text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                      {typeof log.details === "object"
                        ? JSON.stringify(log.details).slice(0, 200)
                        : String(log.details).slice(0, 200)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length > 100 && (
            <p className="text-center text-xs text-gray-500 py-2">
              {t("admin.audit.showing", "Mostrando 100 de")} {filtered.length}{" "}
              {t("admin.audit.records", "registros")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
