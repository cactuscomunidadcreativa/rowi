"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import { motion } from "framer-motion";
import {
  Shield,
  Eye,
  EyeOff,
  Brain,
  Sparkles,
  Users,
  Database,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

/* ====== Traducciones inline ====== */
const T: Record<string, Record<string, string>> = {
  title: { es: "Privacidad", en: "Privacy" },
  subtitle: { es: "Controla qué información compartes con otros", en: "Control what information you share with others" },

  visibility: { es: "Visibilidad del perfil", en: "Profile visibility" },
  visibilityDesc: { es: "Decide qué partes de tu perfil pueden ver otros usuarios", en: "Decide which parts of your profile other users can see" },

  showBrain: { es: "Mostrar Brain Style", en: "Show Brain Style" },
  showBrainDesc: { es: "Tu estilo cerebral será visible en tu perfil público", en: "Your brain style will be visible on your public profile" },

  showTalents: { es: "Mostrar Talentos", en: "Show Talents" },
  showTalentsDesc: { es: "Tus talentos principales serán visibles para otros", en: "Your main talents will be visible to others" },

  showContact: { es: "Mostrar Contacto", en: "Show Contact" },
  showContactDesc: { es: "Tu email y teléfono serán visibles para conexiones", en: "Your email and phone will be visible to connections" },

  dataUsage: { es: "Uso de datos", en: "Data usage" },
  dataUsageDesc: { es: "Configura cómo Rowi utiliza tu información", en: "Configure how Rowi uses your information" },

  allowAI: { es: "Análisis de IA", en: "AI Analysis" },
  allowAIDesc: { es: "Permitir que Rowi analice tus datos para darte recomendaciones personalizadas", en: "Allow Rowi to analyze your data for personalized recommendations" },

  contributeRowi: { es: "Contribuir al RowiVerse", en: "Contribute to RowiVerse" },
  contributeRowiDesc: { es: "Tus datos anónimos ayudan a mejorar los benchmarks globales de inteligencia emocional", en: "Your anonymous data helps improve global emotional intelligence benchmarks" },

  dataManagement: { es: "Gestión de datos", en: "Data management" },
  dataManagementDesc: { es: "Descarga o elimina tus datos personales", en: "Download or delete your personal data" },

  downloadData: { es: "Descargar mis datos", en: "Download my data" },
  downloadDataDesc: { es: "Descarga una copia de toda tu información en Rowi", en: "Download a copy of all your information in Rowi" },

  deleteAccount: { es: "Eliminar mi cuenta", en: "Delete my account" },
  deleteAccountDesc: { es: "Elimina permanentemente tu cuenta y todos tus datos", en: "Permanently delete your account and all your data" },

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
  red: "#ef4444",
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

export default function PrivacyPage() {
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const t = (key: string) => T[key]?.[lang] || T[key]?.es || key;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [visibility, setVisibility] = useState({
    showBrain: true,
    showTalents: true,
    showContact: false,
  });

  const [dataSettings, setDataSettings] = useState({
    allowAI: true,
    contributeToRowiverse: true,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        const data = await res.json();
        if (data.ok && data.user) {
          setDataSettings({
            allowAI: data.user.allowAI ?? true,
            contributeToRowiverse: data.user.contributeToRowiverse ?? true,
          });
        }
      } catch (e) {
        console.error("Error loading privacy settings:", e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          allowAI: dataSettings.allowAI,
          contributeToRowiverse: dataSettings.contributeToRowiverse,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Error saving privacy settings:", e);
    } finally {
      setSaving(false);
    }
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
          style={{ background: `linear-gradient(135deg, ${COLORS.orange}20, ${COLORS.purple}20)` }}
        >
          <Shield size={32} style={{ color: COLORS.orange }} />
        </div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm rowi-muted mt-2">{t("subtitle")}</p>
      </motion.div>

      {/* Visibility Settings */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.purple}20` }}>
            <Eye size={24} style={{ color: COLORS.purple }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("visibility")}</h2>
            <p className="text-sm rowi-muted">{t("visibilityDesc")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Brain size={20} style={{ color: COLORS.purple }} />
              <div>
                <p className="font-medium">{t("showBrain")}</p>
                <p className="text-xs rowi-muted">{t("showBrainDesc")}</p>
              </div>
            </div>
            <Toggle
              checked={visibility.showBrain}
              onChange={(v) => setVisibility((p) => ({ ...p, showBrain: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Sparkles size={20} style={{ color: COLORS.pink }} />
              <div>
                <p className="font-medium">{t("showTalents")}</p>
                <p className="text-xs rowi-muted">{t("showTalentsDesc")}</p>
              </div>
            </div>
            <Toggle
              checked={visibility.showTalents}
              onChange={(v) => setVisibility((p) => ({ ...p, showTalents: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Users size={20} style={{ color: COLORS.blue }} />
              <div>
                <p className="font-medium">{t("showContact")}</p>
                <p className="text-xs rowi-muted">{t("showContactDesc")}</p>
              </div>
            </div>
            <Toggle
              checked={visibility.showContact}
              onChange={(v) => setVisibility((p) => ({ ...p, showContact: v }))}
            />
          </div>
        </div>
      </motion.section>

      {/* Data Usage */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.blue}20` }}>
            <Database size={24} style={{ color: COLORS.blue }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("dataUsage")}</h2>
            <p className="text-sm rowi-muted">{t("dataUsageDesc")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Brain size={20} style={{ color: COLORS.green }} />
              <div>
                <p className="font-medium">{t("allowAI")}</p>
                <p className="text-xs rowi-muted">{t("allowAIDesc")}</p>
              </div>
            </div>
            <Toggle
              checked={dataSettings.allowAI}
              onChange={(v) => setDataSettings((p) => ({ ...p, allowAI: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Users size={20} style={{ color: COLORS.purple }} />
              <div>
                <p className="font-medium">{t("contributeRowi")}</p>
                <p className="text-xs rowi-muted">{t("contributeRowiDesc")}</p>
              </div>
            </div>
            <Toggle
              checked={dataSettings.contributeToRowiverse}
              onChange={(v) => setDataSettings((p) => ({ ...p, contributeToRowiverse: v }))}
            />
          </div>
        </div>
      </motion.section>

      {/* Data Management */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.orange}20` }}>
            <Shield size={24} style={{ color: COLORS.orange }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("dataManagement")}</h2>
            <p className="text-sm rowi-muted">{t("dataManagementDesc")}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <Download size={20} style={{ color: COLORS.blue }} />
              <div className="text-left">
                <p className="font-medium">{t("downloadData")}</p>
                <p className="text-xs rowi-muted">{t("downloadDataDesc")}</p>
              </div>
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <Trash2 size={20} style={{ color: COLORS.red }} />
              <div className="text-left">
                <p className="font-medium text-red-700 dark:text-red-400">{t("deleteAccount")}</p>
                <p className="text-xs text-red-600 dark:text-red-400/70">{t("deleteAccountDesc")}</p>
              </div>
            </div>
          </button>
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
