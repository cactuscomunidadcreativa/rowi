"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Settings,
  Save,
  Bell,
  Clock,
  Target,
  Users,
  Zap,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   ⚙️ Tasks Settings Page
========================================================= */

export default function TasksSettingsPage() {
  const { t, lang } = useI18n();
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    enableNotifications: true,
    overdueReminders: true,
    dailyDigest: false,
    weeklyReport: true,
    autoArchiveDays: 30,
    defaultPriority: "medium",
    allowSubtasks: true,
    requireDueDate: false,
    enableEmotionalTracking: true,
    gamificationEnabled: true,
  });

  const txt = {
    title: lang === "en" ? "Task Settings" : "Configuración de Tareas",
    description: lang === "en" ? "Configure task behavior and notifications" : "Configura el comportamiento de tareas y notificaciones",
    notifications: lang === "en" ? "Notifications" : "Notificaciones",
    enableNotifications: lang === "en" ? "Enable task notifications" : "Habilitar notificaciones de tareas",
    overdueReminders: lang === "en" ? "Send overdue reminders" : "Enviar recordatorios de tareas vencidas",
    dailyDigest: lang === "en" ? "Daily task digest" : "Resumen diario de tareas",
    weeklyReport: lang === "en" ? "Weekly progress report" : "Reporte semanal de progreso",
    taskBehavior: lang === "en" ? "Task Behavior" : "Comportamiento de Tareas",
    autoArchive: lang === "en" ? "Auto-archive after (days)" : "Archivar automáticamente después de (días)",
    defaultPriority: lang === "en" ? "Default priority" : "Prioridad por defecto",
    allowSubtasks: lang === "en" ? "Allow subtasks" : "Permitir subtareas",
    requireDueDate: lang === "en" ? "Require due date" : "Requerir fecha de vencimiento",
    features: lang === "en" ? "Features" : "Características",
    emotionalTracking: lang === "en" ? "Emotional tracking on tasks" : "Seguimiento emocional en tareas",
    gamification: lang === "en" ? "Gamification & achievements" : "Gamificación y logros",
    save: lang === "en" ? "Save Settings" : "Guardar Configuración",
    saved: lang === "en" ? "Settings saved" : "Configuración guardada",
    high: lang === "en" ? "High" : "Alta",
    medium: lang === "en" ? "Medium" : "Media",
    low: lang === "en" ? "Low" : "Baja",
  };

  async function handleSave() {
    setSaving(true);
    // Simular guardado
    await new Promise(r => setTimeout(r, 500));
    toast.success(txt.saved);
    setSaving(false);
  }

  function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
      <button onClick={onToggle} className="text-2xl">
        {enabled ? (
          <ToggleRight className="w-10 h-10 text-green-500" />
        ) : (
          <ToggleLeft className="w-10 h-10 text-gray-400" />
        )}
      </button>
    );
  }

  return (
    <AdminPage
      titleKey="admin.tasks.settings.title"
      descriptionKey="admin.tasks.settings.description"
      icon={Settings}
      actions={
        <AdminButton icon={Save} onClick={handleSave} loading={saving}>
          {txt.save}
        </AdminButton>
      }
    >
      <div className="space-y-6">
        {/* Notifications */}
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-gray-200 dark:border-zinc-700/50 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            {txt.notifications}
          </h3>
          <div className="space-y-4">
            <SettingRow
              label={txt.enableNotifications}
              toggle={
                <Toggle
                  enabled={settings.enableNotifications}
                  onToggle={() => setSettings(s => ({ ...s, enableNotifications: !s.enableNotifications }))}
                />
              }
            />
            <SettingRow
              label={txt.overdueReminders}
              toggle={
                <Toggle
                  enabled={settings.overdueReminders}
                  onToggle={() => setSettings(s => ({ ...s, overdueReminders: !s.overdueReminders }))}
                />
              }
            />
            <SettingRow
              label={txt.dailyDigest}
              toggle={
                <Toggle
                  enabled={settings.dailyDigest}
                  onToggle={() => setSettings(s => ({ ...s, dailyDigest: !s.dailyDigest }))}
                />
              }
            />
            <SettingRow
              label={txt.weeklyReport}
              toggle={
                <Toggle
                  enabled={settings.weeklyReport}
                  onToggle={() => setSettings(s => ({ ...s, weeklyReport: !s.weeklyReport }))}
                />
              }
            />
          </div>
        </div>

        {/* Task Behavior */}
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-gray-200 dark:border-zinc-700/50 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-500" />
            {txt.taskBehavior}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700 dark:text-gray-300">{txt.autoArchive}</span>
              <input
                type="number"
                value={settings.autoArchiveDays}
                onChange={(e) => setSettings(s => ({ ...s, autoArchiveDays: parseInt(e.target.value) || 30 }))}
                className="w-20 px-3 py-2 text-sm bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg text-gray-900 dark:text-white"
                min={7}
                max={365}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700 dark:text-gray-300">{txt.defaultPriority}</span>
              <select
                value={settings.defaultPriority}
                onChange={(e) => setSettings(s => ({ ...s, defaultPriority: e.target.value }))}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="high">{txt.high}</option>
                <option value="medium">{txt.medium}</option>
                <option value="low">{txt.low}</option>
              </select>
            </div>
            <SettingRow
              label={txt.allowSubtasks}
              toggle={
                <Toggle
                  enabled={settings.allowSubtasks}
                  onToggle={() => setSettings(s => ({ ...s, allowSubtasks: !s.allowSubtasks }))}
                />
              }
            />
            <SettingRow
              label={txt.requireDueDate}
              toggle={
                <Toggle
                  enabled={settings.requireDueDate}
                  onToggle={() => setSettings(s => ({ ...s, requireDueDate: !s.requireDueDate }))}
                />
              }
            />
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-gray-200 dark:border-zinc-700/50 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            {txt.features}
          </h3>
          <div className="space-y-4">
            <SettingRow
              label={txt.emotionalTracking}
              toggle={
                <Toggle
                  enabled={settings.enableEmotionalTracking}
                  onToggle={() => setSettings(s => ({ ...s, enableEmotionalTracking: !s.enableEmotionalTracking }))}
                />
              }
            />
            <SettingRow
              label={txt.gamification}
              toggle={
                <Toggle
                  enabled={settings.gamificationEnabled}
                  onToggle={() => setSettings(s => ({ ...s, gamificationEnabled: !s.gamificationEnabled }))}
                />
              }
            />
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

function SettingRow({ label, toggle }: { label: string; toggle: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-700/50 last:border-0">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      {toggle}
    </div>
  );
}
