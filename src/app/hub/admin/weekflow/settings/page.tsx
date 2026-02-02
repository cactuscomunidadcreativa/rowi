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
  Calendar,
  Heart,
  MessageSquare,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   ⚙️ WeekFlow Settings Page
========================================================= */

export default function WeekFlowSettingsPage() {
  const { t, lang } = useI18n();
  const [saving, setSaving] = useState(false);

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
    saved: lang === "en" ? "Settings saved" : "Configuración guardada",
    monday: lang === "en" ? "Monday" : "Lunes",
    tuesday: lang === "en" ? "Tuesday" : "Martes",
    wednesday: lang === "en" ? "Wednesday" : "Miércoles",
    thursday: lang === "en" ? "Thursday" : "Jueves",
    friday: lang === "en" ? "Friday" : "Viernes",
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
          <ToggleRight className="w-10 h-10 text-[var(--rowi-success)]" />
        ) : (
          <ToggleLeft className="w-10 h-10 text-[var(--rowi-muted)]" />
        )}
      </button>
    );
  }

  return (
    <AdminPage
      titleKey="admin.weekflow.settings.title"
      descriptionKey="admin.weekflow.settings.description"
      icon={Settings}
      actions={
        <AdminButton icon={Save} onClick={handleSave} loading={saving}>
          {txt.save}
        </AdminButton>
      }
    >
      <div className="space-y-6">
        {/* Notifications */}
        <div className="bg-[var(--rowi-surface)] rounded-xl p-6 border border-[var(--rowi-border)] shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[var(--rowi-primary)]" />
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
              <span className="text-[var(--rowi-foreground)]">{txt.reminderDay}</span>
              <select
                value={settings.reminderDay}
                onChange={(e) => setSettings(s => ({ ...s, reminderDay: e.target.value }))}
                className="px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
              >
                <option value="monday">{txt.monday}</option>
                <option value="tuesday">{txt.tuesday}</option>
                <option value="wednesday">{txt.wednesday}</option>
                <option value="thursday">{txt.thursday}</option>
                <option value="friday">{txt.friday}</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--rowi-foreground)]">{txt.reminderTime}</span>
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => setSettings(s => ({ ...s, reminderTime: e.target.value }))}
                className="px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Session Configuration */}
        <div className="bg-[var(--rowi-surface)] rounded-xl p-6 border border-[var(--rowi-border)] shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--rowi-secondary)]" />
            {txt.sessionConfig}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--rowi-foreground)]">{txt.sessionDuration}</span>
              <input
                type="number"
                value={settings.sessionDuration}
                onChange={(e) => setSettings(s => ({ ...s, sessionDuration: parseInt(e.target.value) || 60 }))}
                className="w-24 px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
                min={15}
                max={180}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--rowi-foreground)]">{txt.maxContributions}</span>
              <input
                type="number"
                value={settings.maxContributionsPerUser}
                onChange={(e) => setSettings(s => ({ ...s, maxContributionsPerUser: parseInt(e.target.value) || 5 }))}
                className="w-20 px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
                min={1}
                max={20}
              />
            </div>
          </div>
        </div>

        {/* Contribution Types */}
        <div className="bg-[var(--rowi-surface)] rounded-xl p-6 border border-[var(--rowi-border)] shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[var(--rowi-success)]" />
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
        <div className="bg-[var(--rowi-surface)] rounded-xl p-6 border border-[var(--rowi-border)] shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
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
        <div className="bg-[var(--rowi-surface)] rounded-xl p-6 border border-[var(--rowi-border)] shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--rowi-warning)]" />
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
    <div className="flex items-center justify-between py-2 border-b border-[var(--rowi-border)] last:border-0">
      <span className="text-[var(--rowi-foreground)]">{label}</span>
      {toggle}
    </div>
  );
}
