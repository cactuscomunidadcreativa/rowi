"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Database,
  Languages,
  Lock,
  Bot,
  BarChart3,
  Rocket,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Server,
} from "lucide-react";

type HealthReport = {
  ok: boolean;
  status: "healthy" | "degraded" | "error";
  timestamp: string;
  modules: Record<string, "ok" | "warn" | "fail">;
  details: Record<string, string>;
  environment?: string;
  error?: string;
};

const MODULE_META: Record<string, { name: string; icon: React.ElementType; description: string }> = {
  prisma: { name: "Base de Datos", icon: Database, description: "Conexión Prisma y datos principales" },
  i18n: { name: "Internacionalización", icon: Languages, description: "Traducciones y localización" },
  auth: { name: "Autenticación", icon: Lock, description: "OAuth y configuración de sesiones" },
  ai: { name: "Inteligencia Artificial", icon: Bot, description: "Conexión con API de OpenAI" },
  data: { name: "Datos Base", icon: BarChart3, description: "RowiVerses, agentes y configuración" },
  build: { name: "Compilación", icon: Rocket, description: "Estado del build de Next.js" },
};

const STATUS_CONFIG = {
  ok: {
    icon: CheckCircle2,
    label: "Operativo",
    cardBg: "bg-emerald-50 dark:bg-emerald-900/10",
    border: "border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  warn: {
    icon: AlertCircle,
    label: "Advertencia",
    cardBg: "bg-amber-50 dark:bg-amber-900/10",
    border: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500",
    textColor: "text-amber-700 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  fail: {
    icon: XCircle,
    label: "Error",
    cardBg: "bg-red-50 dark:bg-red-900/10",
    border: "border-red-200 dark:border-red-800",
    iconColor: "text-red-500",
    textColor: "text-red-700 dark:text-red-400",
    dotColor: "bg-red-500",
  },
};

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  async function fetchHealth() {
    setLoading(true);
    try {
      const res = await fetch("/api/hub/system-health");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setData({
        ok: false,
        status: "error",
        error: err.message,
        timestamp: new Date().toISOString(),
        modules: {},
        details: {},
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHealth();
  }, []);

  // Count statuses
  const counts = data?.modules
    ? Object.values(data.modules).reduce(
        (acc, s) => {
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Estado del Sistema</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Diagnóstico en tiempo real de los módulos de Rowi
            </p>
          </div>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Re-evaluar
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Escaneando módulos…</p>
          </div>
        </div>
      ) : !data ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No se pudo obtener el estado del sistema</p>
        </div>
      ) : (
        <>
          {/* Overall Status Banner */}
          <div
            className={`rounded-xl border p-5 flex items-center gap-4 ${
              data.ok
                ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                : data.status === "degraded"
                ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
            }`}
          >
            {data.ok ? (
              <ShieldCheck className="w-8 h-8 text-emerald-500 flex-shrink-0" />
            ) : data.status === "degraded" ? (
              <AlertCircle className="w-8 h-8 text-amber-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {data.ok
                  ? "Todos los sistemas operativos"
                  : data.status === "degraded"
                  ? "Sistema funcionando con advertencias"
                  : "Se detectaron problemas en el sistema"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Última verificación:{" "}
                {new Date(data.timestamp).toLocaleString("es", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {data.environment && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 dark:bg-zinc-700 text-xs font-medium">
                    {data.environment}
                  </span>
                )}
              </p>
            </div>

            {/* Summary pills */}
            <div className="hidden sm:flex items-center gap-2">
              {counts.ok && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {counts.ok} OK
                </span>
              )}
              {counts.warn && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {counts.warn} Warn
                </span>
              )}
              {counts.fail && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {counts.fail} Error
                </span>
              )}
            </div>
          </div>

          {/* Module Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(MODULE_META).map(([key, meta]) => {
              const status = data.modules?.[key] ?? "fail";
              const config = STATUS_CONFIG[status];
              const detail = data.details?.[key];
              const StatusIcon = config.icon;
              const ModIcon = meta.icon;

              return (
                <div
                  key={key}
                  className={`rounded-xl border p-4 transition-all ${config.cardBg} ${config.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800 border ${config.border}`}>
                        <ModIcon className={`w-5 h-5 ${config.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{meta.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{meta.description}</p>
                      </div>
                    </div>
                    <StatusIcon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                    <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
                  </div>

                  {detail && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {detail.replace(/^[✅❌⚠️]\s*/, "")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Technical Details Toggle */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Server className="w-4 h-4 text-gray-400" />
                Detalles técnicos
              </span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {showDetails && (
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-zinc-700">
                <div className="mt-3 space-y-2">
                  {Object.entries(data.details || {}).map(([key, detail]) => (
                    <div
                      key={key}
                      className="flex items-start gap-3 text-xs font-mono text-gray-600 dark:text-gray-400 py-1.5 border-b border-gray-100 dark:border-zinc-700/50 last:border-0"
                    >
                      <span className="font-semibold text-gray-800 dark:text-gray-200 w-16 flex-shrink-0 uppercase">
                        {key}
                      </span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
                {data.error && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs text-red-700 dark:text-red-400 font-mono">
                    Error: {data.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
