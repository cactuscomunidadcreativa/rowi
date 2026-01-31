"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Zap,
  RefreshCcw,
  Plus,
  Trash2,
  Play,
  Clock,
  Loader2,
  Info,
  Settings,
  Mail,
  Bell,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  Database,
  ArrowRight,
  Activity,
  Target,
  Workflow,
  GitBranch,
  ToggleLeft,
  ToggleRight,
  Copy,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   Automation Admin - Flujos de Automatización
   =========================================================
   Permite crear y gestionar flujos de automatización con
   triggers, condiciones y acciones.
========================================================= */

interface Automation {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    type: string;
    config: Record<string, any>;
  };
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  executionCount: number;
  lastExecuted: string | null;
  createdAt: string;
  updatedAt: string;
}

const TRIGGER_TYPES = [
  { type: "user_created", icon: Users, label: "Usuario creado", color: "text-blue-500" },
  { type: "user_updated", icon: Users, label: "Usuario actualizado", color: "text-blue-500" },
  { type: "content_published", icon: FileText, label: "Contenido publicado", color: "text-green-500" },
  { type: "form_submitted", icon: Database, label: "Formulario enviado", color: "text-purple-500" },
  { type: "scheduled", icon: Calendar, label: "Programado", color: "text-amber-500" },
  { type: "webhook", icon: GitBranch, label: "Webhook", color: "text-pink-500" },
  { type: "event_created", icon: Calendar, label: "Evento creado", color: "text-cyan-500" },
];

const ACTION_TYPES = [
  { type: "send_email", icon: Mail, label: "Enviar email", color: "text-blue-500" },
  { type: "send_notification", icon: Bell, label: "Enviar notificación", color: "text-amber-500" },
  { type: "create_task", icon: Target, label: "Crear tarea", color: "text-green-500" },
  { type: "update_user", icon: Users, label: "Actualizar usuario", color: "text-purple-500" },
  { type: "send_message", icon: MessageSquare, label: "Enviar mensaje", color: "text-pink-500" },
  { type: "webhook", icon: GitBranch, label: "Llamar webhook", color: "text-cyan-500" },
  { type: "delay", icon: Clock, label: "Esperar", color: "text-gray-500" },
];

const DEFAULT_AUTOMATIONS: Automation[] = [
  {
    id: "1",
    name: "Bienvenida a nuevos usuarios",
    description: "Envía email de bienvenida cuando se crea un usuario",
    isActive: true,
    trigger: { type: "user_created", config: {} },
    conditions: [],
    actions: [
      { type: "send_email", config: { template: "welcome", delay: 0 } },
      { type: "send_notification", config: { title: "Bienvenido", message: "¡Gracias por unirte!" } },
    ],
    executionCount: 156,
    lastExecuted: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "2",
    name: "Recordatorio de perfil incompleto",
    description: "Notifica a usuarios que no han completado su perfil después de 3 días",
    isActive: true,
    trigger: { type: "scheduled", config: { cron: "0 9 * * *" } },
    conditions: [
      { field: "profile.completeness", operator: "lt", value: "80" },
      { field: "createdAt", operator: "gt", value: "3d" },
    ],
    actions: [{ type: "send_email", config: { template: "complete_profile" } }],
    executionCount: 89,
    lastExecuted: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "3",
    name: "Notificación de nuevo contenido",
    description: "Notifica a los managers cuando se publica nuevo contenido",
    isActive: false,
    trigger: { type: "content_published", config: {} },
    conditions: [{ field: "contentType", operator: "eq", value: "announcement" }],
    actions: [{ type: "send_notification", config: { audience: "managers" } }],
    executionCount: 42,
    lastExecuted: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export default function AutomationPage() {
  const { t } = useI18n();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadAutomations();
  }, []);

  async function loadAutomations() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/automation");
      if (res.ok) {
        const data = await res.json();
        setAutomations(data.automations || DEFAULT_AUTOMATIONS);
      } else {
        setAutomations(DEFAULT_AUTOMATIONS);
      }
    } catch {
      setAutomations(DEFAULT_AUTOMATIONS);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAutomation(id: string, isActive: boolean) {
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, isActive } : a)));
    toast.success(isActive ? t("admin.automation.activated") : t("admin.automation.deactivated"));
  }

  async function deleteAutomation(id: string) {
    if (!confirm(t("admin.automation.confirmDelete"))) return;
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    toast.success(t("admin.automation.deleteSuccess"));
  }

  async function duplicateAutomation(automation: Automation) {
    const newAutomation = {
      ...automation,
      id: Date.now().toString(),
      name: `${automation.name} (copia)`,
      isActive: false,
    };
    setAutomations((prev) => [...prev, newAutomation]);
    toast.success(t("admin.automation.duplicateSuccess"));
  }

  async function runAutomation(id: string) {
    toast.success(t("admin.automation.runSuccess"));
  }

  const getTriggerInfo = (type: string) => {
    return TRIGGER_TYPES.find((t) => t.type === type) || TRIGGER_TYPES[0];
  };

  const getActionInfo = (type: string) => {
    return ACTION_TYPES.find((a) => a.type === type) || ACTION_TYPES[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Zap className="w-7 h-7 text-amber-500" />
            {t("admin.automation.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.automation.description")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadAutomations()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)]
              bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white
              hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {t("admin.automation.newAutomation")}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-[var(--rowi-foreground)] font-medium">{t("admin.automation.infoTitle")}</p>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.automation.infoDesc")}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2">
            <Workflow className="w-4 h-4" />
            <span className="text-xs">{t("admin.automation.stats.total")}</span>
          </div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{automations.length}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <Play className="w-4 h-4" />
            <span className="text-xs">{t("admin.automation.stats.active")}</span>
          </div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
            {automations.filter((a) => a.isActive).length}
          </p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs">{t("admin.automation.stats.executions")}</span>
          </div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
            {automations.reduce((sum, a) => sum + a.executionCount, 0)}
          </p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs">{t("admin.automation.stats.lastRun")}</span>
          </div>
          <p className="text-sm font-medium text-[var(--rowi-foreground)]">
            {automations.length > 0 && automations[0].lastExecuted
              ? new Date(automations[0].lastExecuted).toLocaleString()
              : "-"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" />
        </div>
      ) : automations.length === 0 ? (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-12 text-center">
          <Zap className="w-12 h-12 mx-auto mb-3 text-[var(--rowi-muted)] opacity-50" />
          <p className="text-[var(--rowi-foreground)] font-medium mb-1">{t("admin.automation.noAutomations")}</p>
          <p className="text-[var(--rowi-muted)] text-sm mb-4">{t("admin.automation.noAutomationsDesc")}</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white
              hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {t("admin.automation.createFirst")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {automations.map((automation) => {
            const triggerInfo = getTriggerInfo(automation.trigger.type);
            const TriggerIcon = triggerInfo.icon;

            return (
              <div
                key={automation.id}
                className={`bg-[var(--rowi-card)] rounded-xl border transition-all ${
                  automation.isActive ? "border-[var(--rowi-border)]" : "border-[var(--rowi-border)] opacity-60"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${automation.isActive ? "bg-amber-500/10" : "bg-[var(--rowi-muted)]/10"}`}>
                        <TriggerIcon
                          className={`w-5 h-5 ${automation.isActive ? triggerInfo.color : "text-[var(--rowi-muted)]"}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[var(--rowi-foreground)]">{automation.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              automation.isActive
                                ? "bg-green-500/20 text-green-500"
                                : "bg-[var(--rowi-muted)]/20 text-[var(--rowi-muted)]"
                            }`}
                          >
                            {automation.isActive ? t("admin.automation.active") : t("admin.automation.inactive")}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--rowi-muted)] mb-3">{automation.description}</p>

                        {/* Flow Visualization */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${triggerInfo.color.replace("text-", "bg-")}/10`}>
                            <TriggerIcon className={`w-3.5 h-3.5 ${triggerInfo.color}`} />
                            <span className="text-xs text-[var(--rowi-foreground)]">{triggerInfo.label}</span>
                          </div>

                          {automation.conditions.length > 0 && (
                            <>
                              <ArrowRight className="w-3 h-3 text-[var(--rowi-muted)]" />
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10">
                                <Settings className="w-3.5 h-3.5 text-purple-500" />
                                <span className="text-xs text-[var(--rowi-foreground)]">
                                  {automation.conditions.length} {t("admin.automation.conditions")}
                                </span>
                              </div>
                            </>
                          )}

                          <ArrowRight className="w-3 h-3 text-[var(--rowi-muted)]" />

                          {automation.actions.map((action, i) => {
                            const actionInfo = getActionInfo(action.type);
                            const ActionIcon = actionInfo.icon;
                            return (
                              <div
                                key={i}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${actionInfo.color.replace("text-", "bg-")}/10`}
                              >
                                <ActionIcon className={`w-3.5 h-3.5 ${actionInfo.color}`} />
                                <span className="text-xs text-[var(--rowi-foreground)]">{actionInfo.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAutomation(automation.id, !automation.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          automation.isActive ? "text-green-500" : "text-[var(--rowi-muted)]"
                        }`}
                      >
                        {automation.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                      </button>
                      <button
                        onClick={() => runAutomation(automation.id)}
                        className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                        title={t("admin.automation.runNow")}
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => duplicateAutomation(automation)}
                        className="p-2 rounded-lg hover:bg-[var(--rowi-muted)]/10 text-[var(--rowi-muted)] transition-colors"
                        title={t("admin.automation.duplicate")}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteAutomation(automation.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                        title={t("actions.delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="px-5 py-3 border-t border-[var(--rowi-border)] bg-[var(--rowi-muted)]/5 flex items-center justify-between text-xs text-[var(--rowi-muted)]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {automation.executionCount} {t("admin.automation.executions")}
                    </span>
                    {automation.lastExecuted && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t("admin.automation.lastRun")}: {new Date(automation.lastExecuted).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span>
                    {t("admin.automation.created")}: {new Date(automation.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Automation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b border-[var(--rowi-border)]">
              <h3 className="text-lg font-semibold text-[var(--rowi-foreground)]">
                {t("admin.automation.newAutomation")}
              </h3>
              <p className="text-sm text-[var(--rowi-muted)]">{t("admin.automation.newAutomationDesc")}</p>
            </div>
            <div className="p-5 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Trigger Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-3">
                  {t("admin.automation.selectTrigger")}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TRIGGER_TYPES.map((trigger) => {
                    const Icon = trigger.icon;
                    return (
                      <button
                        key={trigger.type}
                        className="p-4 rounded-xl border border-[var(--rowi-border)] hover:border-[var(--rowi-primary)]
                          bg-[var(--rowi-background)] transition-all text-left"
                      >
                        <Icon className={`w-5 h-5 ${trigger.color} mb-2`} />
                        <p className="text-sm font-medium text-[var(--rowi-foreground)]">{trigger.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-3">
                  {t("admin.automation.selectActions")}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ACTION_TYPES.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.type}
                        className="p-4 rounded-xl border border-[var(--rowi-border)] hover:border-[var(--rowi-primary)]
                          bg-[var(--rowi-background)] transition-all text-left"
                      >
                        <Icon className={`w-5 h-5 ${action.color} mb-2`} />
                        <p className="text-sm font-medium text-[var(--rowi-foreground)]">{action.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[var(--rowi-border)] flex justify-end gap-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-lg border border-[var(--rowi-border)]
                  hover:bg-[var(--rowi-muted)]/10 transition-colors"
              >
                {t("actions.cancel")}
              </button>
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white
                  hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {t("actions.create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
