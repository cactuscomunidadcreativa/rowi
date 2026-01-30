"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Crown,
  Sparkles,
  Calendar,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

/* ====== Traducciones inline ====== */
const T: Record<string, Record<string, string>> = {
  title: { es: "Suscripción", en: "Subscription" },
  subtitle: { es: "Administra tu plan y métodos de pago", en: "Manage your plan and payment methods" },

  currentPlan: { es: "Plan actual", en: "Current plan" },
  freePlan: { es: "Plan Gratuito", en: "Free Plan" },
  proPlan: { es: "Plan Pro", en: "Pro Plan" },
  teamPlan: { es: "Plan Equipo", en: "Team Plan" },
  familyPlan: { es: "Plan Familiar", en: "Family Plan" },

  features: { es: "Características incluidas", en: "Included features" },
  upgradeNow: { es: "Mejorar plan", en: "Upgrade now" },
  manageBilling: { es: "Gestionar facturación", en: "Manage billing" },

  billing: { es: "Facturación", en: "Billing" },
  nextBilling: { es: "Próximo cobro", en: "Next billing" },
  paymentMethod: { es: "Método de pago", en: "Payment method" },
  updatePayment: { es: "Actualizar método de pago", en: "Update payment method" },

  usage: { es: "Uso del plan", en: "Plan usage" },
  conversations: { es: "Conversaciones este mes", en: "Conversations this month" },
  invites: { es: "Invitaciones enviadas", en: "Invitations sent" },
  unlimited: { es: "Ilimitado", en: "Unlimited" },

  trial: { es: "Período de prueba", en: "Trial period" },
  trialEnds: { es: "Tu prueba termina el", en: "Your trial ends on" },
  trialDaysLeft: { es: "días restantes", en: "days left" },

  cancelSub: { es: "Cancelar suscripción", en: "Cancel subscription" },
  cancelWarning: { es: "Perderás acceso a las funciones premium al finalizar el período", en: "You'll lose access to premium features at the end of the period" },

  loading: { es: "Cargando...", en: "Loading..." },
  error: { es: "Error al cargar", en: "Error loading" },
};

const COLORS = {
  purple: "#7a59c9",
  blue: "#31a2e3",
  pink: "#d797cf",
  green: "#10b981",
  orange: "#f59e0b",
};

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "5 conversaciones al mes | 5 conversations per month",
    "Acceso básico a insights | Basic insights access",
    "1 comunidad | 1 community",
  ],
  pro: [
    "Conversaciones ilimitadas | Unlimited conversations",
    "Insights avanzados | Advanced insights",
    "Comunidades ilimitadas | Unlimited communities",
    "Soporte prioritario | Priority support",
  ],
  team: [
    "Todo en Pro | Everything in Pro",
    "Dashboard de equipo | Team dashboard",
    "Benchmarks corporativos | Corporate benchmarks",
    "Admin dedicado | Dedicated admin",
  ],
  family: [
    "Hasta 6 miembros | Up to 6 members",
    "Dashboard familiar | Family dashboard",
    "Insights compartidos | Shared insights",
    "Precio especial | Special pricing",
  ],
};

type PlanData = {
  name: string;
  slug: string;
  priceCents: number;
  interval: string;
  features: string[];
};

type SubscriptionData = {
  plan: PlanData | null;
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  trialEndsAt: string | null;
  usage: {
    conversations: number;
    conversationsLimit: number | null;
    invites: number;
    invitesLimit: number | null;
  };
};

export default function SubscriptionPage() {
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const t = (key: string) => T[key]?.[lang] || T[key]?.es || key;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const res = await fetch("/api/user/subscription", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) {
          setData(json);
        }
      } catch (e) {
        console.error("Error loading subscription:", e);
      } finally {
        setLoading(false);
      }
    }
    loadSubscription();
  }, []);

  const planName = data?.plan?.slug || "free";
  const features = PLAN_FEATURES[planName] || PLAN_FEATURES.free;

  const trialDaysLeft = data?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(data.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

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
          style={{ background: `linear-gradient(135deg, ${COLORS.green}20, ${COLORS.blue}20)` }}
        >
          <CreditCard size={32} style={{ color: COLORS.green }} />
        </div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm rowi-muted mt-2">{t("subtitle")}</p>
      </motion.div>

      {/* Trial Notice */}
      {trialDaysLeft !== null && trialDaysLeft > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rowi-card border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <AlertCircle size={24} style={{ color: COLORS.orange }} />
            </div>
            <div className="flex-1">
              <p className="font-medium">{t("trial")}</p>
              <p className="text-sm rowi-muted">
                {t("trialEnds")} {new Date(data!.trialEndsAt!).toLocaleDateString()} ({trialDaysLeft} {t("trialDaysLeft")})
              </p>
            </div>
            <button className="rowi-btn-primary">
              {t("upgradeNow")}
            </button>
          </div>
        </motion.div>
      )}

      {/* Current Plan */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rowi-card"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.purple}20` }}>
            <Crown size={24} style={{ color: COLORS.purple }} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{t("currentPlan")}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                {data?.plan?.name || t("freePlan")}
              </span>
              {data?.plan && data.plan.priceCents > 0 && (
                <span className="text-sm rowi-muted">
                  ${(data.plan.priceCents / 100).toFixed(2)}/{data.plan.interval === "month" ? "mes" : "año"}
                </span>
              )}
            </div>
          </div>
          <button className="rowi-btn flex items-center gap-2">
            <Sparkles size={16} />
            {t("upgradeNow")}
          </button>
        </div>

        {/* Features */}
        <div className="pt-4 border-t dark:border-gray-800">
          <h3 className="text-sm font-medium mb-3">{t("features")}</h3>
          <div className="grid gap-2">
            {features.map((feature, idx) => {
              const [es, en] = feature.split(" | ");
              return (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Check size={16} style={{ color: COLORS.green }} />
                  <span>{lang === "en" ? en : es}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Usage */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rowi-card"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl" style={{ background: `${COLORS.blue}20` }}>
            <Calendar size={24} style={{ color: COLORS.blue }} />
          </div>
          <h2 className="text-lg font-semibold">{t("usage")}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm rowi-muted mb-1">{t("conversations")}</p>
            <p className="text-2xl font-bold">
              {data?.usage.conversations || 0}
              <span className="text-sm font-normal rowi-muted ml-1">
                / {data?.usage.conversationsLimit || t("unlimited")}
              </span>
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm rowi-muted mb-1">{t("invites")}</p>
            <p className="text-2xl font-bold">
              {data?.usage.invites || 0}
              <span className="text-sm font-normal rowi-muted ml-1">
                / {data?.usage.invitesLimit || t("unlimited")}
              </span>
            </p>
          </div>
        </div>
      </motion.section>

      {/* Billing */}
      {data?.subscription && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rowi-card"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl" style={{ background: `${COLORS.green}20` }}>
              <CreditCard size={24} style={{ color: COLORS.green }} />
            </div>
            <h2 className="text-lg font-semibold">{t("billing")}</h2>
          </div>

          <div className="space-y-3">
            {data.subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="text-sm">{t("nextBilling")}</span>
                <span className="font-medium">
                  {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}

            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-sm">{t("manageBilling")}</span>
              <ExternalLink size={16} className="rowi-muted" />
            </button>
          </div>
        </motion.section>
      )}
    </main>
  );
}
