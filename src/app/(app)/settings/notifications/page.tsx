"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import { motion } from "framer-motion";
import {
  Bell,
  Mail,
  MessageCircle,
  Smartphone,
  BellRing,
  BellOff,
  Volume2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

/* ====== Traducciones inline ====== */
const T: Record<string, Record<string, string>> = {
  title: { es: "Notificaciones", en: "Notifications" },
  subtitle: { es: "Configura cómo y cuándo recibir alertas", en: "Configure how and when to receive alerts" },

  channels: { es: "Canales de notificación", en: "Notification channels" },
  channelsDesc: { es: "Elige cómo quieres recibir las notificaciones", en: "Choose how you want to receive notifications" },

  email: { es: "Email", en: "Email" },
  emailDesc: { es: "Recibe notificaciones por correo electrónico", en: "Receive notifications via email" },

  push: { es: "Push (navegador)", en: "Push (browser)" },
  pushDesc: { es: "Recibe notificaciones en tu navegador", en: "Receive browser notifications" },

  whatsapp: { es: "WhatsApp", en: "WhatsApp" },
  whatsappDesc: { es: "Recibe notificaciones por WhatsApp", en: "Receive notifications via WhatsApp" },

  sms: { es: "SMS", en: "SMS" },
  smsDesc: { es: "Recibe notificaciones por mensaje de texto", en: "Receive notifications via text message" },

  types: { es: "Tipos de notificación", en: "Notification types" },
  typesDesc: { es: "Selecciona qué tipo de notificaciones quieres recibir", en: "Select which types of notifications you want to receive" },

  newMessages: { es: "Nuevos mensajes", en: "New messages" },
  newMessagesDesc: { es: "Cuando recibes un mensaje de Rowi", en: "When you receive a message from Rowi" },

  insights: { es: "Insights diarios", en: "Daily insights" },
  insightsDesc: { es: "Resumen diario de tu progreso emocional", en: "Daily summary of your emotional progress" },

  community: { es: "Actividad de comunidad", en: "Community activity" },
  communityDesc: { es: "Cuando hay actividad en tus comunidades", en: "When there's activity in your communities" },

  reminders: { es: "Recordatorios", en: "Reminders" },
  remindersDesc: { es: "Recordatorios para continuar tu práctica", en: "Reminders to continue your practice" },

  marketing: { es: "Promociones y novedades", en: "Promotions and updates" },
  marketingDesc: { es: "Ofertas especiales y nuevas funciones", en: "Special offers and new features" },

  quiet: { es: "Horario silencioso", en: "Quiet hours" },
  quietDesc: { es: "No recibir notificaciones durante estas horas", en: "Don't receive notifications during these hours" },
  quietEnabled: { es: "Activar horario silencioso", en: "Enable quiet hours" },
  quietFrom: { es: "Desde", en: "From" },
  quietTo: { es: "Hasta", en: "To" },

  save: { es: "Guardar cambios", en: "Save changes" },
  saving: { es: "Guardando...", en: "Saving..." },
  saved: { es: "Guardado", en: "Saved" },
  loading: { es: "Cargando...", en: "Loading..." },
};

const COLORS = {
  purple: "#7a59c9",
  blue: "#31a2e3",
  pink: "#d797cf",
  green: "#10b981",
  orange: "#f59e0b",
};

type ToggleProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
};

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? "translate-x-6" : ""
        }`}
      />
    </button>
  );
}

export default function NotificationsPage() {
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const t = (key: string) => T[key]?.[lang] || T[key]?.es || key;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [channels, setChannels] = useState({
    email: true,
    push: false,
    whatsapp: false,
    sms: false,
  });

  const [types, setTypes] = useState({
    newMessages: true,
    insights: true,
    community: true,
    reminders: true,
    marketing: false,
  });

  const [quiet, setQuiet] = useState({
    enabled: false,
    from: "22:00",
    to: "08:00",
  });

  useEffect(() => {
    // Simular carga de configuración
    setTimeout(() => setLoading(false), 500);
  }, []);

  async function saveSettings() {
    setSaving(true);
    // Simular guardado
    await new Promise((r) => setTimeout(r, 1000));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" style={{ color: COLORS.purple }} />
          <span className="rowi-muted">{t("loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ background: `linear-gradient(135deg, ${COLORS.orange}20, ${COLORS.pink}20)` }}
        >
          <Bell size={32} style={{ color: COLORS.orange }} />
        </div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm rowi-muted mt-2">{t("subtitle")}</p>
      </motion.div>

      {/* Channels */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.blue}20` }}>
            <BellRing size={24} style={{ color: COLORS.blue }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("channels")}</h2>
            <p className="text-sm rowi-muted">{t("channelsDesc")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Mail size={20} style={{ color: COLORS.blue }} />
              <div>
                <p className="font-medium">{t("email")}</p>
                <p className="text-xs rowi-muted">{t("emailDesc")}</p>
              </div>
            </div>
            <Toggle
              checked={channels.email}
              onChange={(v) => setChannels((p) => ({ ...p, email: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Bell size={20} style={{ color: COLORS.purple }} />
              <div>
                <p className="font-medium">{t("push")}</p>
                <p className="text-xs rowi-muted">{t("pushDesc")}</p>
              </div>
            </div>
            <Toggle
              checked={channels.push}
              onChange={(v) => setChannels((p) => ({ ...p, push: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <MessageCircle size={20} style={{ color: COLORS.green }} />
              <div>
                <p className="font-medium">{t("whatsapp")}</p>
                <p className="text-xs rowi-muted">{t("whatsappDesc")}</p>
              </div>
            </div>
            <Toggle
              checked={channels.whatsapp}
              onChange={(v) => setChannels((p) => ({ ...p, whatsapp: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Smartphone size={20} style={{ color: COLORS.orange }} />
              <div>
                <p className="font-medium">{t("sms")}</p>
                <p className="text-xs rowi-muted">{t("smsDesc")}</p>
              </div>
            </div>
            <Toggle
              checked={channels.sms}
              onChange={(v) => setChannels((p) => ({ ...p, sms: v }))}
            />
          </div>
        </div>
      </motion.section>

      {/* Types */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.purple}20` }}>
            <Volume2 size={24} style={{ color: COLORS.purple }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("types")}</h2>
            <p className="text-sm rowi-muted">{t("typesDesc")}</p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries({
            newMessages: COLORS.blue,
            insights: COLORS.green,
            community: COLORS.pink,
            reminders: COLORS.orange,
            marketing: COLORS.purple,
          }).map(([key, color]) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div>
                <p className="font-medium">{t(key)}</p>
                <p className="text-xs rowi-muted">{t(`${key}Desc`)}</p>
              </div>
              <Toggle
                checked={types[key as keyof typeof types]}
                onChange={(v) => setTypes((p) => ({ ...p, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </motion.section>

      {/* Quiet Hours */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.pink}20` }}>
            <BellOff size={24} style={{ color: COLORS.pink }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("quiet")}</h2>
            <p className="text-sm rowi-muted">{t("quietDesc")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="font-medium">{t("quietEnabled")}</p>
            <Toggle
              checked={quiet.enabled}
              onChange={(v) => setQuiet((p) => ({ ...p, enabled: v }))}
            />
          </div>

          {quiet.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t("quietFrom")}</label>
                <input
                  type="time"
                  value={quiet.from}
                  onChange={(e) => setQuiet((p) => ({ ...p, from: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t("quietTo")}</label>
                <input
                  type="time"
                  value={quiet.to}
                  onChange={(e) => setQuiet((p) => ({ ...p, to: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="sticky bottom-4 flex items-center justify-center gap-4 p-4 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg border dark:border-gray-800"
      >
        <button
          onClick={saveSettings}
          disabled={saving}
          className="rowi-btn-primary px-8 py-3 flex items-center gap-2"
        >
          {saving ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              {t("saving")}
            </>
          ) : saved ? (
            <>
              <CheckCircle2 size={18} />
              {t("saved")}
            </>
          ) : (
            t("save")
          )}
        </button>
      </motion.div>
    </main>
  );
}
