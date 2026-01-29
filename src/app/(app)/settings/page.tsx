"use client";

import { useI18n } from "@/lib/i18n/react";
import { motion } from "framer-motion";
import {
  User,
  Users,
  Globe,
  CreditCard,
  Bell,
  Shield,
  Palette,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Heart,
  Settings2,
} from "lucide-react";
import Link from "next/link";

/* ====== Traducciones inline ====== */
const T: Record<string, Record<string, string>> = {
  title: { es: "Configuración", en: "Settings" },
  subtitle: { es: "Personaliza tu experiencia Rowi", en: "Customize your Rowi experience" },

  // Secciones
  profile: { es: "Mi Perfil", en: "My Profile" },
  profileDesc: { es: "Edita tu información personal, ubicación y preferencias", en: "Edit your personal info, location and preferences" },

  invites: { es: "Invitaciones", en: "Invitations" },
  invitesDesc: { es: "Invita a amigos y familiares a unirse a Rowi", en: "Invite friends and family to join Rowi" },

  rowiverse: { es: "RowiVerse", en: "RowiVerse" },
  rowiverseDesc: { es: "Explora la comunidad global de inteligencia emocional", en: "Explore the global emotional intelligence community" },

  communities: { es: "Mis Comunidades", en: "My Communities" },
  communitiesDesc: { es: "Gestiona tus comunidades y equipos", en: "Manage your communities and teams" },

  subscription: { es: "Suscripción", en: "Subscription" },
  subscriptionDesc: { es: "Administra tu plan y métodos de pago", en: "Manage your plan and payment methods" },

  notifications: { es: "Notificaciones", en: "Notifications" },
  notificationsDesc: { es: "Configura cómo y cuándo recibir alertas", en: "Configure how and when to receive alerts" },

  privacy: { es: "Privacidad", en: "Privacy" },
  privacyDesc: { es: "Controla qué información compartes", en: "Control what information you share" },

  appearance: { es: "Apariencia", en: "Appearance" },
  appearanceDesc: { es: "Personaliza el tema y estilo visual", en: "Customize theme and visual style" },

  help: { es: "Ayuda", en: "Help" },
  helpDesc: { es: "Preguntas frecuentes y soporte", en: "FAQ and support" },

  // Categorías
  account: { es: "Cuenta", en: "Account" },
  social: { es: "Social", en: "Social" },
  preferences: { es: "Preferencias", en: "Preferences" },
  support: { es: "Soporte", en: "Support" },
};

/* ====== Colores Rowi ====== */
const COLORS = {
  purple: "#7a59c9",
  blue: "#31a2e3",
  pink: "#d797cf",
  green: "#10b981",
  orange: "#f59e0b",
};

type SettingItem = {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  labelKey: string;
  descKey: string;
  badge?: string;
};

const settingsCategories: { titleKey: string; items: SettingItem[] }[] = [
  {
    titleKey: "account",
    items: [
      {
        href: "/settings/profile",
        icon: User,
        color: COLORS.purple,
        labelKey: "profile",
        descKey: "profileDesc",
      },
      {
        href: "/settings/subscription",
        icon: CreditCard,
        color: COLORS.green,
        labelKey: "subscription",
        descKey: "subscriptionDesc",
      },
      {
        href: "/settings/privacy",
        icon: Shield,
        color: COLORS.orange,
        labelKey: "privacy",
        descKey: "privacyDesc",
      },
    ],
  },
  {
    titleKey: "social",
    items: [
      {
        href: "/settings/invites",
        icon: Users,
        color: COLORS.blue,
        labelKey: "invites",
        descKey: "invitesDesc",
      },
      {
        href: "/settings/communities",
        icon: Heart,
        color: COLORS.pink,
        labelKey: "communities",
        descKey: "communitiesDesc",
      },
      {
        href: "/settings/rowiverse",
        icon: Globe,
        color: COLORS.purple,
        labelKey: "rowiverse",
        descKey: "rowiverseDesc",
        badge: "✨",
      },
    ],
  },
  {
    titleKey: "preferences",
    items: [
      {
        href: "/settings/notifications",
        icon: Bell,
        color: COLORS.orange,
        labelKey: "notifications",
        descKey: "notificationsDesc",
      },
      {
        href: "/settings/appearance",
        icon: Palette,
        color: COLORS.pink,
        labelKey: "appearance",
        descKey: "appearanceDesc",
      },
    ],
  },
  {
    titleKey: "support",
    items: [
      {
        href: "/help",
        icon: HelpCircle,
        color: COLORS.blue,
        labelKey: "help",
        descKey: "helpDesc",
      },
    ],
  },
];

export default function SettingsIndex() {
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const t = (key: string) => T[key]?.[lang] || T[key]?.es || key;

  return (
    <main className="max-w-3xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ background: `linear-gradient(135deg, ${COLORS.purple}20, ${COLORS.blue}20)` }}
        >
          <Settings2 size={32} style={{ color: COLORS.purple }} />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-500 to-pink-500 bg-clip-text text-transparent">
          {t("title")}
        </h1>
        <p className="text-sm rowi-muted mt-2">{t("subtitle")}</p>
      </motion.div>

      {/* Settings Categories */}
      {settingsCategories.map((category, catIdx) => (
        <motion.section
          key={category.titleKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: catIdx * 0.1 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider rowi-muted mb-3 px-1">
            {t(category.titleKey)}
          </h2>
          <div className="rowi-card p-0 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            {category.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <div
                    className="p-3 rounded-xl shrink-0"
                    style={{ background: `${item.color}15` }}
                  >
                    <Icon size={22} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      {t(item.labelKey)}
                      {item.badge && (
                        <span className="text-sm">{item.badge}</span>
                      )}
                    </div>
                    <p className="text-sm rowi-muted truncate">{t(item.descKey)}</p>
                  </div>
                  <ChevronRight
                    size={20}
                    className="rowi-muted shrink-0 group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              );
            })}
          </div>
        </motion.section>
      ))}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs rowi-muted pt-8"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles size={14} style={{ color: COLORS.purple }} />
          <span className="font-medium bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Rowi
          </span>
        </div>
        <p>
          {lang === "es"
            ? "Tu copiloto de inteligencia emocional"
            : "Your emotional intelligence copilot"}
        </p>
      </motion.div>
    </main>
  );
}
