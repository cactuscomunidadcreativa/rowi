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
  ArrowRight,
} from "lucide-react";
import { getAllPlans } from "@/domains/plans/lib/plans";

const COLORS = {
  purple: "#7a59c9",
  blue: "#38bdf8",
  pink: "#d797cf",
  green: "#10b981",
  orange: "#f59e0b",
};

/* Cada feature es una clave i18n bajo settingsSubPg.feature.* */
const PLAN_FEATURES: Record<string, { key: string; fallback: string }[]> = {
  free: [
    { key: "settingsSubPg.feature.freeConversations", fallback: "5 conversaciones al mes" },
    { key: "settingsSubPg.feature.freeInsights", fallback: "Acceso básico a insights" },
    { key: "settingsSubPg.feature.freeCommunity", fallback: "1 comunidad" },
  ],
  pro: [
    { key: "settingsSubPg.feature.proConversations", fallback: "Conversaciones ilimitadas" },
    { key: "settingsSubPg.feature.proInsights", fallback: "Insights avanzados" },
    { key: "settingsSubPg.feature.proCommunities", fallback: "Comunidades ilimitadas" },
    { key: "settingsSubPg.feature.proSupport", fallback: "Soporte prioritario" },
  ],
  team: [
    { key: "settingsSubPg.feature.teamEverythingPro", fallback: "Todo en Pro" },
    { key: "settingsSubPg.feature.teamDashboard", fallback: "Dashboard de equipo" },
    { key: "settingsSubPg.feature.teamBenchmarks", fallback: "Benchmarks corporativos" },
    { key: "settingsSubPg.feature.teamAdmin", fallback: "Admin dedicado" },
  ],
  family: [
    { key: "settingsSubPg.feature.familyMembers", fallback: "Hasta 6 miembros" },
    { key: "settingsSubPg.feature.familyDashboard", fallback: "Dashboard familiar" },
    { key: "settingsSubPg.feature.familyInsights", fallback: "Insights compartidos" },
    { key: "settingsSubPg.feature.familyPricing", fallback: "Precio especial" },
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
  const { t, locale } = useI18n();
  const lang = locale; // se conserva para elegir campos de datos del plan (p.nameEN / p.descriptionEN)

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Checkout directo desde esta página: el usuario ya está logueado, así que
  // llamamos al endpoint y lo mandamos a Stripe sin saltar a /pricing.
  async function upgradeTo(slug: string) {
    setCheckoutLoading(slug);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: slug,
          billingPeriod: "monthly",
          successUrl: `${window.location.origin}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/settings/subscription`,
        }),
      });
      const json = await res.json();
      if (json?.url) window.location.href = json.url;
      else setCheckoutLoading(null);
    } catch {
      setCheckoutLoading(null);
    }
  }

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
          <span className="rowi-muted">{t("settingsSubPg.loading", "Cargando...")}</span>
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
        <h1 className="text-2xl font-bold">{t("settingsSubPg.title", "Suscripción")}</h1>
        <p className="text-sm rowi-muted mt-2">{t("settingsSubPg.subtitle", "Administra tu plan y métodos de pago")}</p>
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
              <p className="font-medium">{t("settingsSubPg.trial", "Período de prueba")}</p>
              <p className="text-sm rowi-muted">
                {t("settingsSubPg.trialEnds", "Tu prueba termina el")} {new Date(data!.trialEndsAt!).toLocaleDateString()} ({trialDaysLeft} {t("settingsSubPg.trialDaysLeft", "días restantes")})
              </p>
            </div>
            <button
              className="rowi-btn-primary"
              onClick={() => { window.location.href = "/pricing"; }}
            >
              {t("settingsSubPg.upgradeNow", "Mejorar plan")}
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
            <h2 className="text-lg font-semibold">{t("settingsSubPg.currentPlan", "Plan actual")}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                {data?.plan?.name || t("settingsSubPg.freePlan", "Plan Gratuito")}
              </span>
              {data?.plan && data.plan.priceCents > 0 && (
                <span className="text-sm rowi-muted">
                  ${(data.plan.priceCents / 100).toFixed(2)}/{data.plan.interval === "month" ? t("settingsSubPg.perMonth", "mes") : t("settingsSubPg.perYear", "año")}
                </span>
              )}
            </div>
          </div>
          <button
            className="rowi-btn flex items-center gap-2"
            onClick={() => { window.location.href = "/pricing"; }}
          >
            <Sparkles size={16} />
            {t("settingsSubPg.upgradeNow", "Mejorar plan")}
          </button>
        </div>

        {/* Features */}
        <div className="pt-4 border-t dark:border-gray-800">
          <h3 className="text-sm font-medium mb-3">{t("settingsSubPg.features", "Características incluidas")}</h3>
          <div className="grid gap-2">
            {features.map((feature) => (
              <div key={feature.key} className="flex items-center gap-2 text-sm">
                <Check size={16} style={{ color: COLORS.green }} />
                <span>{t(feature.key, feature.fallback)}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Upgrade options — planes embebidos, checkout directo sin salir */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-lg font-semibold mb-1">
          {t("settingsSubPg.upgradeHeading", "Mejora tu plan")}
        </h2>
        <p className="text-sm rowi-muted mb-4">
          {t("settingsSubPg.upgradeSubtitle", "Elige un plan y paga de forma segura, sin pasos extra.")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {getAllPlans()
            .filter(
              (p) =>
                !p.isCustomPricing &&
                p.priceMonthly > 0 &&
                (p.targetAudience === "B2C" || p.targetAudience === "B2C/B2B") &&
                p.slug !== planName, // no mostrar el plan actual
            )
            .map((p) => {
              const isLoadingThis = checkoutLoading === p.slug;
              return (
                <div
                  key={p.slug}
                  className="rowi-card flex flex-col gap-3 border dark:border-gray-800"
                >
                  <div>
                    <div className="font-semibold">{lang === "en" ? p.nameEN : p.name}</div>
                    <div className="text-2xl font-bold mt-1">
                      ${p.priceMonthly}
                      <span className="text-sm font-normal rowi-muted">
                        /{t("settingsSubPg.perMonthShort", "mes")}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs rowi-muted flex-1">
                    {lang === "en" ? p.descriptionEN : p.description}
                  </p>
                  <button
                    type="button"
                    disabled={isLoadingThis}
                    onClick={() => upgradeTo(p.slug)}
                    className="rowi-btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isLoadingThis
                      ? t("settingsSubPg.redirecting", "Redirigiendo…")
                      : t("settingsSubPg.choosePlan", "Elegir este plan")}
                    <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
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
          <h2 className="text-lg font-semibold">{t("settingsSubPg.usage", "Uso del plan")}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm rowi-muted mb-1">{t("settingsSubPg.conversations", "Conversaciones este mes")}</p>
            <p className="text-2xl font-bold">
              {data?.usage.conversations || 0}
              <span className="text-sm font-normal rowi-muted ml-1">
                / {data?.usage.conversationsLimit || t("settingsSubPg.unlimited", "Ilimitado")}
              </span>
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm rowi-muted mb-1">{t("settingsSubPg.invites", "Invitaciones enviadas")}</p>
            <p className="text-2xl font-bold">
              {data?.usage.invites || 0}
              <span className="text-sm font-normal rowi-muted ml-1">
                / {data?.usage.invitesLimit || t("settingsSubPg.unlimited", "Ilimitado")}
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
            <h2 className="text-lg font-semibold">{t("settingsSubPg.billing", "Facturación")}</h2>
          </div>

          <div className="space-y-3">
            {data.subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="text-sm">{t("settingsSubPg.nextBilling", "Próximo cobro")}</span>
                <span className="font-medium">
                  {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}

            <button
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              onClick={async () => {
                try {
                  const res = await fetch("/api/stripe/portal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ returnUrl: window.location.href }),
                  });
                  const json = await res.json();
                  if (json.url) window.location.href = json.url;
                } catch {
                  /* el portal requiere un customer de Stripe; si falla, no-op */
                }
              }}
            >
              <span className="text-sm">{t("settingsSubPg.manageBilling", "Gestionar facturación")}</span>
              <ExternalLink size={16} className="rowi-muted" />
            </button>
          </div>
        </motion.section>
      )}
    </main>
  );
}
