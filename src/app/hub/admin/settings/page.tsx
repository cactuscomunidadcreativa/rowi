"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  Key, Eye, EyeOff, Save, Trash2, RefreshCw, AlertTriangle,
  Shield, Bot, Mail, CreditCard, Database, Settings2, Check, X
} from "lucide-react";

/**
 * =========================================================
 * 🔐 Settings Page — Gestión de claves del sistema
 * =========================================================
 */

interface ConfigItem {
  key: string;
  category: string;
  description: string | null;
  isSecret: boolean;
  isActive: boolean;
  hasValue: boolean;
  updatedAt: string;
}

interface GroupedConfigs {
  [category: string]: ConfigItem[];
}

const CATEGORY_ICONS: Record<string, typeof Key> = {
  ai: Bot,
  auth: Shield,
  email: Mail,
  payments: CreditCard,
  database: Database,
  general: Settings2,
};

const CATEGORY_COLORS: Record<string, string> = {
  ai: "from-purple-500 to-pink-500",
  auth: "from-blue-500 to-cyan-500",
  email: "from-green-500 to-emerald-500",
  payments: "from-orange-500 to-yellow-500",
  database: "from-red-500 to-rose-500",
  general: "from-gray-500 to-slate-500",
};

export default function SettingsPage() {
  const { t } = useI18n();
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [grouped, setGrouped] = useState<GroupedConfigs>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showValue, setShowValue] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar configuraciones
  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al cargar configuraciones");
      }

      setConfigs(data.configs || []);
      setGrouped(data.grouped || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Guardar configuración
  const handleSave = async (key: string) => {
    if (!editValue.trim()) {
      setError(t("admin.settings.errorEmptyValue"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: editValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar");
      }

      setSuccessMessage(t("admin.settings.saved"));
      setEditingKey(null);
      setEditValue("");
      fetchConfigs();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar configuración
  const handleDelete = async (key: string) => {
    if (!confirm(t("admin.settings.confirmDelete"))) return;

    try {
      const res = await fetch(`/api/admin/settings?key=${key}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar");
      }

      setSuccessMessage(t("admin.settings.deleted"));
      fetchConfigs();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  // Cancelar edición
  const handleCancel = () => {
    setEditingKey(null);
    setEditValue("");
  };

  // Obtener valor actual para editar
  const startEditing = async (key: string) => {
    setEditingKey(key);
    setEditValue("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--rowi-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)]">
            {t("admin.settings.title")}
          </h1>
          <p className="text-sm text-[var(--rowi-muted)] mt-1">
            {t("admin.settings.subtitle")}
          </p>
        </div>
        <button
          onClick={fetchConfigs}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-card)] border border-[var(--rowi-border)] hover:bg-[var(--rowi-border)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t("admin.settings.refresh")}
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Advertencia de seguridad */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
        <div>
          <p className="font-medium text-amber-400">
            {t("admin.settings.securityWarning")}
          </p>
          <p className="text-sm text-amber-400/80 mt-1">
            {t("admin.settings.securityWarningDesc")}
          </p>
        </div>
      </div>

      {/* Configuraciones por categoría */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => {
          const Icon = CATEGORY_ICONS[category] || Settings2;
          const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;

          return (
            <div
              key={category}
              className="rounded-xl border border-[var(--rowi-border)] bg-[var(--rowi-card)] overflow-hidden"
            >
              {/* Category Header */}
              <div className={`px-6 py-4 bg-gradient-to-r ${colorClass} bg-opacity-10`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClass}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[var(--rowi-foreground)] capitalize">
                      {t(`admin.settings.category.${category}`)}
                    </h2>
                    <p className="text-xs text-[var(--rowi-muted)]">
                      {items.length} {t("admin.settings.keysConfigured")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Config Items */}
              <div className="divide-y divide-[var(--rowi-border)]">
                {items.map((config) => (
                  <div key={config.key} className="p-4 hover:bg-[var(--rowi-border)]/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-[var(--rowi-muted)]" />
                          <code className="font-mono text-sm text-[var(--rowi-foreground)]">
                            {config.key}
                          </code>
                          {config.isSecret && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 font-medium">
                              SECRET
                            </span>
                          )}
                          {config.hasValue ? (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/20 text-green-400 font-medium">
                              {t("admin.settings.configured")}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-400 font-medium">
                              {t("admin.settings.notConfigured")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--rowi-muted)] mt-1">
                          {config.description || t("admin.settings.noDescription")}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {editingKey === config.key ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type={showValue[config.key] ? "text" : "password"}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  placeholder={t("admin.settings.enterValue")}
                                  className="w-64 px-3 py-2 pr-10 rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-border)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowValue(prev => ({ ...prev, [config.key]: !prev[config.key] }))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
                                >
                                  {showValue[config.key] ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                              <button
                                onClick={() => handleSave(config.key)}
                                disabled={saving}
                                className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                              >
                                {saving ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-2 rounded-lg bg-[var(--rowi-border)] text-[var(--rowi-foreground)] hover:bg-[var(--rowi-muted)]/30 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(config.key)}
                              className="px-3 py-1.5 text-sm rounded-lg bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] hover:bg-[var(--rowi-primary)]/20 transition-colors"
                            >
                              {config.hasValue ? t("admin.settings.update") : t("admin.settings.configure")}
                            </button>
                            {config.hasValue && (
                              <button
                                onClick={() => handleDelete(config.key)}
                                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {Object.keys(grouped).length === 0 && !loading && (
        <div className="text-center py-12">
          <Key className="w-12 h-12 mx-auto text-[var(--rowi-muted)]" />
          <p className="mt-4 text-[var(--rowi-muted)]">
            {t("admin.settings.noConfigs")}
          </p>
        </div>
      )}
    </div>
  );
}
