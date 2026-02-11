"use client";

import { useState, useEffect } from "react";
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
  Calendar,
  Heart,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   ⚙️ WeekFlow Settings Page — Persistencia real con API
========================================================= */

interface WeekFlowConfig {
  id: string;
  hubId: string;
  name: string;
  isActive: boolean;
  enableShowTell: boolean;
  enableToDiscuss: boolean;
  enableFocus: boolean;
  enableTasks: boolean;
  enableMoodCheckin: boolean;
  requireMoodCheckin: boolean;
  moodReminderDay: number;
  moodReminderTime: string;
  maxItemsPerSection: number;
  maxTasksPerMember: number;
  pointsPerCheckin: number;
  pointsPerContribution: number;
  pointsPerTaskComplete: number;
  emailReminders: boolean;
}

const DAY_MAP: Record<number, string> = {
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
};

const DAY_REVERSE: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
};

export default function WeekFlowSettingsPage() {
  const { t, lang } = useI18n();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configId, setConfigId] = useState<string | null>(null);
  const [hubId, setHubId] = useState<string | null>(null);
  const [hubs, setHubs] = useState<{ id: string; name: string }[]>([]);

  const [settings, setSettings] = useState({
    enableNotifications: true,
    weeklyReminder: true,
    reminderDay: "monday",
    reminderTime: "09:00",
    enableMoodCheckin: true,
    requireMoodCheckin: false,
    enableShowAndTell: true,
    enableToDiscuss: true,
    enableFocus: true,
    enableTasks: true,
    maxContributionsPerUser: 5,
    sessionDuration: 60,
    enableGamification: true,
    showLeaderboard: true,
    enableStreaks: true,
  });

  const txt = {
    title: lang === "en" ? "WeekFlow Settings" : "Configuración de WeekFlow",
    description: lang === "en" ? "Configure weekly sessions and notifications" : "Configura las sesiones semanales y notificaciones",
    notifications: lang === "en" ? "Notifications" : "Notificaciones",
    enableNotifications: lang === "en" ? "Enable WeekFlow notifications" : "Habilitar notificaciones de WeekFlow",
    weeklyReminder: lang === "en" ? "Send weekly session reminder" : "Enviar recordatorio semanal",
    reminderDay: lang === "en" ? "Reminder day" : "Día del recordatorio",
    reminderTime: lang === "en" ? "Reminder time" : "Hora del recordatorio",
    sessionConfig: lang === "en" ? "Session Configuration" : "Configuración de Sesión",
    sessionDuration: lang === "en" ? "Session duration (minutes)" : "Duración de sesión (minutos)",
    maxContributions: lang === "en" ? "Max contributions per user" : "Máx. contribuciones por usuario",
    contributions: lang === "en" ? "Contribution Types" : "Tipos de Contribución",
    enableShowAndTell: lang === "en" ? "Enable Show & Tell section" : "Habilitar sección Show & Tell",
    enableToDiscuss: lang === "en" ? "Enable To Discuss section" : "Habilitar sección A Discutir",
    enableFocus: lang === "en" ? "Enable Focus section" : "Habilitar sección Focus",
    enableTasks: lang === "en" ? "Enable Tasks section" : "Habilitar sección Tareas",
    moodConfig: lang === "en" ? "Mood Check-in" : "Check-in de Ánimo",
    enableMoodCheckin: lang === "en" ? "Enable mood check-in" : "Habilitar check-in de ánimo",
    requireMoodCheckin: lang === "en" ? "Require mood before contributing" : "Requerir ánimo antes de contribuir",
    gamification: lang === "en" ? "Gamification" : "Gamificación",
    enableGamification: lang === "en" ? "Enable gamification & points" : "Habilitar gamificación y puntos",
    showLeaderboard: lang === "en" ? "Show leaderboard" : "Mostrar tabla de posiciones",
    enableStreaks: lang === "en" ? "Enable participation streaks" : "Habilitar rachas de participación",
    save: lang === "en" ? "Save Settings" : "Guardar Configuración",
    saved: lang === "en" ? "Settings saved successfully" : "Configuración guardada correctamente",
    saveError: lang === "en" ? "Error saving settings" : "Error al guardar la configuración",
    loadError: lang === "en" ? "Error loading settings" : "Error al cargar la configuración",
    selectHub: lang === "en" ? "Select a hub" : "Selecciona un hub",
    hub: lang === "en" ? "Hub / Community" : "Hub / Comunidad",
    monday: lang === "en" ? "Monday" : "Lunes",
    tuesday: lang === "en" ? "Tuesday" : "Martes",
    wednesday: lang === "en" ? "Wednesday" : "Miércoles",
    thursday: lang === "en" ? "Thursday" : "Jueves",
    friday: lang === "en" ? "Friday" : "Viernes",
  };

  // Cargar hubs del usuario
  useEffect(() => {
    async function loadHubs() {
      try {
        const res = await fetch("/api/hubs/my");
        const data = await res.json();
        if (data.ok && data.hubs?.length > 0) {
          setHubs(data.hubs.map((h: { id: string; name: string }) => ({ id: h.id, name: h.name })));
          setHubId(data.hubs[0].id);
        }
      } catch (err) {
        console.error("Error loading hubs:", err);
      }
    }
    loadHubs();
  }, []);

  // Cargar config cuando cambia el hub
  useEffect(() => {
    if (!hubId) {
      setLoading(false);
      return;
    }
    loadConfig(hubId);
  }, [hubId]);

  async function loadConfig(hId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/weekflow/config?hubId=${hId}`);
      const data = await res.json();
      if (data.ok && data.config) {
        const c = data.config as WeekFlowConfig;
        setConfigId(c.id);
        setSettings({
          enableNotifications: c.emailReminders,
          weeklyReminder: c.emailReminders,
          reminderDay: DAY_MAP[c.moodReminderDay] || "monday",
          reminderTime: c.moodReminderTime || "09:00",
          enableMoodCheckin: c.enableMoodCheckin,
          requireMoodCheckin: c.requireMoodCheckin,
          enableShowAndTell: c.enableShowTell,
          enableToDiscuss: c.enableToDiscuss,
          enableFocus: c.enableFocus,
          enableTasks: c.enableTasks,
          maxContributionsPerUser: c.maxItemsPerSection || 5,
          sessionDuration: 60,
          enableGamification: c.pointsPerCheckin > 0,
          showLeaderboard: c.pointsPerCheckin > 0,
          enableStreaks: c.pointsPerCheckin > 0,
        });
      }
    } catch (err) {
      console.error("Error loading config:", err);
      toast.error(txt.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!configId) return;

    setSaving(true);
    try {
      const res = await fetch("/api/weekflow/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: configId,
          enableShowTell: settings.enableShowAndTell,
          enableToDiscuss: settings.enableToDiscuss,
          enableFocus: settings.enableFocus,
          enableTasks: settings.enableTasks,
          enableMoodCheckin: settings.enableMoodCheckin,
          requireMoodCheckin: settings.requireMoodCheckin,
          moodReminderDay: DAY_REVERSE[settings.reminderDay] || 1,
          moodReminderTime: settings.reminderTime,
          maxItemsPerSection: settings.maxContributionsPerUser,
          emailReminders: settings.enableNotifications && settings.weeklyReminder,
          pointsPerCheckin: settings.enableGamification ? 15 : 0,
          pointsPerContribution: settings.enableGamification ? 10 : 0,
          pointsPerTaskComplete: settings.enableGamification ? 5 : 0,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        toast.success(txt.saved);
      } else {
        toast.error(data.error || txt.saveError);
      }
    } catch (err) {
      console.error("Error saving config:", err);
      toast.error(txt.saveError);
    } finally {
      setSaving(false);
    }
  }

  function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
      <button onClick={onToggle} className="text-2xl">
        {enabled ? (
          <ToggleRight className="w-10 h-10 text-green-500" />
        ) : (
          <ToggleLeft className="w-10 h-10 text-gray-400 dark:text-gray-600" />
        )}
      </button>
    );
  }

  if (loading) {
    return (
      <AdminPage
        titleKey="admin.weekflow.settings.title"
        descriptionKey="admin.weekflow.settings.description"
        icon={Settings}
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      titleKey="admin.weekflow.settings.title"
      descriptionKey="admin.weekflow.settings.description"
      icon={Settings}
      actions={
        <AdminButton icon={Save} onClick={handleSave} loading={saving} disabled={!configId}>
          {txt.save}
        </AdminButton>
      }
    >
      <div className="space-y-6">
        {/* Hub Selector */}
        {hubs.length > 1 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              {txt.hub}
            </h3>
            <select
              value={hubId || ""}
              onChange={(e) => setHubId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
            >
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-500" />
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
              label={txt.weeklyReminder}
              toggle={
                <Toggle
                  enabled={settings.weeklyReminder}
                  onToggle={() => setSettings(s => ({ ...s, weeklyReminder: !s.weeklyReminder }))}
                />
              }
            />
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-900 dark:text-white">{txt.reminderDay}</span>
              <select
                value={settings.reminderDay}
                onChange={(e) => setSettings(s => ({ ...s, reminderDay: e.target.value }))}
                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="monday">{txt.monday}</option>
                <option value="tuesday">{txt.tuesday}</option>
                <option value="wednesday">{txt.wednesday}</option>
                <option value="thursday">{txt.thursday}</option>
                <option value="friday">{txt.friday}</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-900 dark:text-white">{txt.reminderTime}</span>
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => setSettings(s => ({ ...s, reminderTime: e.target.value }))}
                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Session Configuration */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            {txt.sessionConfig}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-900 dark:text-white">{txt.maxContributions}</span>
              <input
                type="number"
                value={settings.maxContributionsPerUser}
                onChange={(e) => setSettings(s => ({ ...s, maxContributionsPerUser: parseInt(e.target.value) || 5 }))}
                className="w-20 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                min={1}
                max={20}
              />
            </div>
          </div>
        </div>

        {/* Contribution Types */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-500" />
            {txt.contributions}
          </h3>
          <div className="space-y-4">
            <SettingRow
              label={txt.enableShowAndTell}
              toggle={
                <Toggle
                  enabled={settings.enableShowAndTell}
                  onToggle={() => setSettings(s => ({ ...s, enableShowAndTell: !s.enableShowAndTell }))}
                />
              }
            />
            <SettingRow
              label={txt.enableToDiscuss}
              toggle={
                <Toggle
                  enabled={settings.enableToDiscuss}
                  onToggle={() => setSettings(s => ({ ...s, enableToDiscuss: !s.enableToDiscuss }))}
                />
              }
            />
            <SettingRow
              label={txt.enableFocus}
              toggle={
                <Toggle
                  enabled={settings.enableFocus}
                  onToggle={() => setSettings(s => ({ ...s, enableFocus: !s.enableFocus }))}
                />
              }
            />
            <SettingRow
              label={txt.enableTasks}
              toggle={
                <Toggle
                  enabled={settings.enableTasks}
                  onToggle={() => setSettings(s => ({ ...s, enableTasks: !s.enableTasks }))}
                />
              }
            />
          </div>
        </div>

        {/* Mood Check-in */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            {txt.moodConfig}
          </h3>
          <div className="space-y-4">
            <SettingRow
              label={txt.enableMoodCheckin}
              toggle={
                <Toggle
                  enabled={settings.enableMoodCheckin}
                  onToggle={() => setSettings(s => ({ ...s, enableMoodCheckin: !s.enableMoodCheckin }))}
                />
              }
            />
            <SettingRow
              label={txt.requireMoodCheckin}
              toggle={
                <Toggle
                  enabled={settings.requireMoodCheckin}
                  onToggle={() => setSettings(s => ({ ...s, requireMoodCheckin: !s.requireMoodCheckin }))}
                />
              }
            />
          </div>
        </div>

        {/* Gamification */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            {txt.gamification}
          </h3>
          <div className="space-y-4">
            <SettingRow
              label={txt.enableGamification}
              toggle={
                <Toggle
                  enabled={settings.enableGamification}
                  onToggle={() => setSettings(s => ({ ...s, enableGamification: !s.enableGamification }))}
                />
              }
            />
            <SettingRow
              label={txt.showLeaderboard}
              toggle={
                <Toggle
                  enabled={settings.showLeaderboard}
                  onToggle={() => setSettings(s => ({ ...s, showLeaderboard: !s.showLeaderboard }))}
                />
              }
            />
            <SettingRow
              label={txt.enableStreaks}
              toggle={
                <Toggle
                  enabled={settings.enableStreaks}
                  onToggle={() => setSettings(s => ({ ...s, enableStreaks: !s.enableStreaks }))}
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
    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <span className="text-gray-900 dark:text-white">{label}</span>
      {toggle}
    </div>
  );
}
