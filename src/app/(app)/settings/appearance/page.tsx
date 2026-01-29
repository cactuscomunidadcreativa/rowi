"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import { motion } from "framer-motion";
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Type,
  Minus,
  Plus,
  RefreshCw,
  CheckCircle2,
  Globe,
  Check,
} from "lucide-react";

/* ====== Traducciones inline ====== */
const T: Record<string, Record<string, string>> = {
  title: { es: "Apariencia", en: "Appearance" },
  subtitle: { es: "Personaliza el tema y estilo visual", en: "Customize theme and visual style" },

  theme: { es: "Tema", en: "Theme" },
  themeDesc: { es: "Selecciona el modo de color de la interfaz", en: "Select the interface color mode" },
  themeLight: { es: "Claro", en: "Light" },
  themeDark: { es: "Oscuro", en: "Dark" },
  themeSystem: { es: "Sistema", en: "System" },

  accent: { es: "Color de acento", en: "Accent color" },
  accentDesc: { es: "Personaliza el color principal de la aplicación", en: "Customize the main color of the application" },

  fontSize: { es: "Tamaño de texto", en: "Font size" },
  fontSizeDesc: { es: "Ajusta el tamaño del texto en la interfaz", en: "Adjust the text size in the interface" },
  fontSmall: { es: "Pequeño", en: "Small" },
  fontMedium: { es: "Mediano", en: "Medium" },
  fontLarge: { es: "Grande", en: "Large" },

  language: { es: "Idioma", en: "Language" },
  languageDesc: { es: "Selecciona el idioma de la aplicación", en: "Select the application language" },
  langES: { es: "Español", en: "Spanish" },
  langEN: { es: "English", en: "English" },

  animations: { es: "Animaciones", en: "Animations" },
  animationsDesc: { es: "Activa o desactiva las animaciones de la interfaz", en: "Enable or disable interface animations" },
  animationsEnabled: { es: "Animaciones activadas", en: "Animations enabled" },

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

const ACCENT_COLORS = [
  { name: "Purple", value: "#7a59c9" },
  { name: "Blue", value: "#31a2e3" },
  { name: "Pink", value: "#d797cf" },
  { name: "Green", value: "#10b981" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
];

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

export default function AppearancePage() {
  const { locale, setLocale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const t = (key: string) => T[key]?.[lang] || T[key]?.es || key;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [accentColor, setAccentColor] = useState(COLORS.purple);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [animations, setAnimations] = useState(true);

  useEffect(() => {
    // Detectar tema actual
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) setTheme(savedTheme);

    const savedAccent = localStorage.getItem("accentColor");
    if (savedAccent) setAccentColor(savedAccent);

    const savedFontSize = localStorage.getItem("fontSize") as "small" | "medium" | "large" | null;
    if (savedFontSize) setFontSize(savedFontSize);

    setLoading(false);
  }, []);

  async function saveSettings() {
    setSaving(true);

    // Guardar tema
    localStorage.setItem("theme", theme);
    localStorage.setItem("accentColor", accentColor);
    localStorage.setItem("fontSize", fontSize);

    // Aplicar tema
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // Sistema
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    await new Promise((r) => setTimeout(r, 500));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLanguageChange(newLang: "es" | "en") {
    setLocale(newLang);
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
          style={{ background: `linear-gradient(135deg, ${COLORS.pink}20, ${COLORS.purple}20)` }}
        >
          <Palette size={32} style={{ color: COLORS.pink }} />
        </div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm rowi-muted mt-2">{t("subtitle")}</p>
      </motion.div>

      {/* Theme */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.purple}20` }}>
            <Sun size={24} style={{ color: COLORS.purple }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("theme")}</h2>
            <p className="text-sm rowi-muted">{t("themeDesc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light", icon: Sun, label: "themeLight" },
            { value: "dark", icon: Moon, label: "themeDark" },
            { value: "system", icon: Monitor, label: "themeSystem" },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value as any)}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                theme === value
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
              }`}
            >
              <Icon size={24} style={{ color: theme === value ? COLORS.purple : undefined }} />
              <span className="text-sm font-medium">{t(label)}</span>
              {theme === value && (
                <Check size={16} style={{ color: COLORS.purple }} />
              )}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Accent Color */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${accentColor}20` }}>
            <Palette size={24} style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("accent")}</h2>
            <p className="text-sm rowi-muted">{t("accentDesc")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setAccentColor(color.value)}
              className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center ${
                accentColor === color.value
                  ? "border-gray-800 dark:border-white scale-110"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: color.value }}
            >
              {accentColor === color.value && (
                <Check size={20} className="text-white" />
              )}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Font Size */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.blue}20` }}>
            <Type size={24} style={{ color: COLORS.blue }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("fontSize")}</h2>
            <p className="text-sm rowi-muted">{t("fontSizeDesc")}</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFontSize("small")}
              className={`px-3 py-1 rounded text-sm ${fontSize === "small" ? "bg-purple-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize("medium")}
              className={`px-3 py-1 rounded text-base ${fontSize === "medium" ? "bg-purple-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize("large")}
              className={`px-3 py-1 rounded text-lg ${fontSize === "large" ? "bg-purple-500 text-white" : "bg-gray-200 dark:bg-gray-700"}`}
            >
              A
            </button>
          </div>
          <span className="text-sm rowi-muted">
            {t(`font${fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}`)}
          </span>
        </div>
      </motion.section>

      {/* Language */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.green}20` }}>
            <Globe size={24} style={{ color: COLORS.green }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("language")}</h2>
            <p className="text-sm rowi-muted">{t("languageDesc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "es", label: "langES", flag: "🇪🇸" },
            { value: "en", label: "langEN", flag: "🇺🇸" },
          ].map(({ value, label, flag }) => (
            <button
              key={value}
              onClick={() => handleLanguageChange(value as "es" | "en")}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
                locale === value
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-green-300"
              }`}
            >
              <span className="text-2xl">{flag}</span>
              <span className="font-medium">{t(label)}</span>
              {locale === value && (
                <Check size={16} style={{ color: COLORS.green }} />
              )}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Animations */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rowi-card"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl" style={{ background: `${COLORS.orange}20` }}>
              <RefreshCw size={24} style={{ color: COLORS.orange }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t("animations")}</h2>
              <p className="text-sm rowi-muted">{t("animationsDesc")}</p>
            </div>
          </div>
          <Toggle checked={animations} onChange={setAnimations} />
        </div>
      </motion.section>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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
