"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Activity,
  Search,
  RefreshCw,
  User,
  Clock,
  Filter,
  ChevronDown,
  Shield,
  LogIn,
  LogOut,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Settings,
  Zap,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ACTION_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  LOGIN: { icon: LogIn, color: "text-green-500" },
  FAILED: { icon: AlertTriangle, color: "text-red-500" },
  LOGOUT: { icon: LogOut, color: "text-gray-500" },
  VIEW: { icon: Eye, color: "text-blue-500" },
  CREATE: { icon: Plus, color: "text-emerald-500" },
  UPDATE: { icon: Edit3, color: "text-amber-500" },
  DELETE: { icon: Trash2, color: "text-red-500" },
  NAVIGATE: { icon: FileText, color: "text-indigo-500" },
  SETTING: { icon: Settings, color: "text-purple-500" },
  SECURITY: { icon: Shield, color: "text-red-600" },
};

function getActionConfig(action: string) {
  const upper = action?.toUpperCase() || "";
  for (const [key, val] of Object.entries(ACTION_ICONS)) {
    if (upper.includes(key)) return val;
  }
  return { icon: Zap, color: "text-gray-400" };
}

export default function LogsPage() {
  const { data, isLoading, mutate } = useSWR("/api/hub/logs/interactions", fetcher);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const logs = Array.isArray(data) ? data : [];
  const actions = [...new Set(logs.map((l: any) => l.action).filter(Boolean))];

  const filtered = logs.filter((l: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      l.action?.toLowerCase().includes(q) ||
      l.entity?.toLowerCase().includes(q) ||
      l.userId?.toLowerCase().includes(q) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(q);
    const matchesAction = actionFilter === "all" || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Logs de Actividad</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{logs.length} registros recientes</p>
          </div>
        </div>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por acción, entidad, usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none min-w-[180px]"
          >
            <option value="all">Todas las acciones</option>
            {actions.map((a: string) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
          <Activity className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {search || actionFilter !== "all" ? "Sin resultados con estos filtros" : "No hay logs de actividad"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalles</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                {filtered.slice(0, 100).map((log: any) => {
                  const cfg = getActionConfig(log.action);
                  const Icon = cfg.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                          <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{log.action || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{log.entity || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]" title={log.userId || ""}>
                            {log.userId ? log.userId.slice(0, 12) + "…" : "Sistema"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {log.details ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate block max-w-[200px]" title={JSON.stringify(log.details)}>
                            {typeof log.details === "object"
                              ? Object.entries(log.details).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(", ")
                              : String(log.details).slice(0, 50)}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 100 && (
            <div className="px-4 py-3 text-center text-xs text-gray-500 border-t border-gray-100 dark:border-zinc-700">
              Mostrando 100 de {filtered.length} registros
            </div>
          )}
        </div>
      )}
    </div>
  );
}
