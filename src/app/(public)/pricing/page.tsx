"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  Check,
  X,
  Sparkles,
  Star,
  Users,
  Rocket,
  Building2,
  Cloud,
  Zap,
  Brain,
  MessageCircle,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useDbPlanOverrides } from "@/domains/plans/lib/useDbPlans";
import Link from "next/link";
import {
  ROWI_PLANS,
  getAllPlans,
  formatPrice,
  calculateYearlySavingsPercent,
  getTokensText,
  getSupportLevelName,
  localizedPlan,
  relationalDepthForPlan,
  relationalDepthLabel,
  type RowiPlan,
  type PlanSlug,
} from "@/domains/plans/lib/plans";

const PLAN_ICONS: Record<PlanSlug, React.ElementType> = {
  free: Sparkles,
  sei: Star,
  plus: Star,
  family: Users,
  pro: Rocket,
  business: Building2,
  enterprise: Cloud,
};

export default function PricingPage() {
  const { t, lang } = useI18n();
  const { data: session } = useSession();
  const isLogged = !!session?.user?.email;
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [expandedPlan, setExpandedPlan] = useState<PlanSlug | null>(null);
  const [showB2B, setShowB2B] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { withDbPrices } = useDbPlanOverrides();

  // Usuario YA logueado que mejora plan: ir directo a Stripe checkout, NO a
  // /register (que es el flujo de alta de cuenta nueva). Visitante anónimo:
  // mantener /register?plan=slug.
  async function goToCheckout(slug: string) {
    setCheckoutLoading(slug);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: slug,
          billingPeriod,
          successUrl: `${window.location.origin}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing?cancelled=true`,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        // Sin URL (p.ej. plan sin Stripe configurado): caer al portal de planes.
        window.location.href = "/settings/subscription";
      }
    } catch {
      window.location.href = "/settings/subscription";
    } finally {
      setCheckoutLoading(null);
    }
  }

  // Precios/entitlements reales desde la DB (lo que Stripe cobra); plans.ts
  // aporta solo el copy. Cierra el P0 "precio anunciado ≠ precio cobrado".
  const plans = getAllPlans().map(withDbPrices);
  const b2cPlans = plans.filter(p => p.targetAudience === "B2C" || (p.targetAudience === "B2C/B2B" && !showB2B));
  const b2bPlans = plans.filter(p => p.targetAudience === "B2B" || p.targetAudience === "B2C/B2B");

  const displayedPlans = showB2B ? b2bPlans : b2cPlans;

  const getPrice = (plan: RowiPlan) => {
    if (plan.isCustomPricing) {
      return t("pricingPage.price.custom", "Personalizado");
    }
    const price = billingPeriod === "yearly" ? plan.priceYearly : plan.priceMonthly;
    return formatPrice(price, plan.currency, lang);
  };

  const getPeriodText = (plan: RowiPlan) => {
    if (plan.isCustomPricing) return "";
    if (plan.priceMonthly === 0) return t("pricingPage.period.forever", "/siempre");
    if (billingPeriod === "yearly") return t("pricingPage.period.year", "/año");
    return t("pricingPage.period.month", "/mes");
  };

  const getPerUserText = (plan: RowiPlan) => {
    if (plan.pricePerUser && plan.pricePerUser > 0) {
      const price = billingPeriod === "yearly" ? plan.pricePerUserYearly : plan.pricePerUser;
      return `${formatPrice(price || 0, plan.currency, lang)}/${t("pricingPage.perUser.user", "usuario")}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 mb-4"
          >
            <Zap className="w-4 h-4 text-yellow-500" />
            {t("pricingPage.badge", "Planes transparentes")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            {t("pricingPage.title.choose", "Elige tu")}{" "}
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent">
              {t("pricingPage.title.perfectPlan", "plan perfecto")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[var(--rowi-muted)] max-w-2xl mx-auto mb-8"
          >
            {t("pricingPage.subtitle", "Comienza gratis y escala según tus necesidades. Todos los planes incluyen tu Rowi personal.")}
          </motion.p>

          {/* Toggle B2C / B2B */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 mb-8"
          >
            <button
              onClick={() => setShowB2B(false)}
              aria-pressed={!showB2B}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !showB2B
                  ? "bg-[var(--rowi-primary)] text-white"
                  : "bg-[var(--rowi-card)] hover:bg-[var(--rowi-card-hover)]"
              }`}
            >
              {t("pricingPage.toggle.personalFamily", "👤 Personal y Familia")}
            </button>
            <button
              onClick={() => setShowB2B(true)}
              aria-pressed={showB2B}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                showB2B
                  ? "bg-[var(--rowi-primary)] text-white"
                  : "bg-[var(--rowi-card)] hover:bg-[var(--rowi-card-hover)]"
              }`}
            >
              {t("pricingPage.toggle.business", "🏢 Empresas")}
            </button>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3"
          >
            <span className={`text-sm ${billingPeriod === "monthly" ? "text-[var(--rowi-text)]" : "text-[var(--rowi-muted)]"}`}>
              {t("pricingPage.billing.monthly", "Mensual")}
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
              role="switch"
              aria-checked={billingPeriod === "yearly"}
              aria-label={t("pricingPage.billing.switchYearlyAria", "Cambiar a facturación anual")}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingPeriod === "yearly" ? "bg-green-500" : "bg-[var(--rowi-border)]"
              }`}
            >
              <motion.div
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                animate={{ left: billingPeriod === "yearly" ? "calc(100% - 24px)" : "4px" }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm ${billingPeriod === "yearly" ? "text-[var(--rowi-text)]" : "text-[var(--rowi-muted)]"}`}>
              {t("pricingPage.billing.yearly", "Anual")}
            </span>
            {billingPeriod === "yearly" && (
              <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
                {t("pricingPage.billing.saveBadge", "Ahorra hasta 17%")}
              </span>
            )}
          </motion.div>
        </div>

        {/* Plans Grid */}
        <div className={`grid gap-6 ${
          displayedPlans.length <= 3
            ? "md:grid-cols-3"
            : displayedPlans.length === 4
            ? "md:grid-cols-2 lg:grid-cols-4"
            : "md:grid-cols-2 lg:grid-cols-3"
        }`}>
          {displayedPlans.map((plan, index) => {
            const Icon = PLAN_ICONS[plan.slug];
            const isExpanded = expandedPlan === plan.slug;
            const savings = calculateYearlySavingsPercent(plan);
            const isHighlighted = plan.badge === "Popular" || plan.badge === "Recomendado";
            // Textos del plan resueltos vía i18n (pt/it incluidos).
            const lp = localizedPlan(plan, t);

            return (
              <motion.div
                key={plan.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`relative rounded-3xl p-6 transition-all ${
                  isHighlighted
                    ? "bg-gradient-to-b from-white to-blue-50 dark:from-zinc-900 dark:to-blue-950/30 border-2 border-blue-500 shadow-xl scale-105"
                    : "bg-[var(--rowi-card)] border border-[var(--rowi-border)] hover:shadow-lg"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: plan.color }}
                  >
                    {lp.badge}
                  </div>
                )}

                {/* Yearly Savings Badge */}
                {billingPeriod === "yearly" && savings > 0 && (
                  <div className="absolute -top-3 right-4 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                    -{savings}%
                  </div>
                )}

                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                    style={{ backgroundColor: plan.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{plan.name}</h3>
                    {/* Profundidad relacional: qué nivel de la cadena SIA
                        desbloquea este plan (no cambia el precio). */}
                    <span
                      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1"
                      style={{ backgroundColor: `${plan.color}1A`, color: plan.color }}
                    >
                      {relationalDepthLabel(relationalDepthForPlan(plan), lang)}
                    </span>
                    <p className="text-sm text-[var(--rowi-muted)]">
                      {lp.description.split(".")[0]}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{getPrice(plan)}</span>
                    <span className="text-[var(--rowi-muted)]">{getPeriodText(plan)}</span>
                  </div>
                  {getPerUserText(plan) && (
                    <p className="text-sm text-[var(--rowi-muted)] mt-1">
                      {getPerUserText(plan)}
                      {plan.minUsers > 1 && ` (${t("pricingPage.minUsers", "mín.")} ${plan.minUsers})`}
                    </p>
                  )}
                </div>

                {/* Tokens */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--rowi-bg)] mb-4">
                  <Brain className="w-5 h-5" style={{ color: plan.color }} />
                  <span className="text-sm font-medium">{getTokensText(plan, lang)}</span>
                </div>

                {/* Key Features (collapsed) */}
                <ul className="space-y-2 mb-4">
                  {lp.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Expand/Collapse */}
                {lp.features.length > 4 && (
                  <button
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.slug)}
                    className="flex items-center gap-1 text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-text)] mb-4"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        {t("pricingPage.features.seeLess", "Ver menos")}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        {t("pricingPage.features.seeMore", "Ver {n} más").replace(
                          "{n}",
                          String(lp.features.length - 4)
                        )}
                      </>
                    )}
                  </button>
                )}

                {/* Expanded Features */}
                {isExpanded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-2 mb-4"
                  >
                    {lp.features.slice(4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}

                    {/* Limitations */}
                    {lp.limitations.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-[var(--rowi-border)]">
                        <p className="text-xs font-semibold text-[var(--rowi-muted)] mb-2">
                          {t("pricingPage.limitations.title", "Limitaciones")}
                        </p>
                        {lp.limitations.map((limitation, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[var(--rowi-muted)]">
                            <X className="w-4 h-4 mt-0.5 text-red-400 shrink-0" />
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </div>
                    )}
                  </motion.ul>
                )}

                {/* CTA Button */}
                {(() => {
                  const ctaClass = `w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                    isHighlighted
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90"
                      : "bg-[var(--rowi-bg)] hover:bg-[var(--rowi-border)]"
                  }`;
                  const isPaid = !plan.isCustomPricing && plan.priceMonthly > 0;
                  // Logueado + plan de pago → checkout directo (no /register).
                  if (isLogged && isPaid) {
                    return (
                      <button
                        type="button"
                        disabled={checkoutLoading === plan.slug}
                        onClick={() => goToCheckout(plan.slug)}
                        className={`${ctaClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {checkoutLoading === plan.slug
                          ? t("pricingPage.cta.redirecting", "Redirigiendo…")
                          : t("pricingPage.cta.upgrade", "Mejorar a este plan")}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    );
                  }
                  // Visitante anónimo o plan free/custom → flujo de registro/contacto.
                  // CTA por intención: el copy dice exactamente qué pasa al
                  // hacer clic (crear cuenta gratis vs empezar prueba vs hablar
                  // con ventas) — sube conversión vs un "Comenzar" genérico.
                  return (
                    <Link
                      href={plan.isCustomPricing ? "/contact" : `/register?plan=${plan.slug}`}
                      className={ctaClass}
                    >
                      {plan.isCustomPricing
                        ? t("pricing.cta.custom", "Agendar demo")
                        : plan.priceMonthly === 0
                        ? t("pricing.cta.free", "Crear mi Rowi gratis")
                        : t("pricing.cta.paid", "Empezar prueba")}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  );
                })()}

                {/* Support Level */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--rowi-muted)]">
                  <MessageCircle className="w-3 h-3" />
                  {t("pricingPage.support.label", "Soporte:")} {getSupportLevelName(plan.supportLevel, lang)}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tokens Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">
                {t("pricingPage.tokens.title", "¿Qué son los tokens IA?")}
              </h3>
              <p className="text-[var(--rowi-muted)] mb-4">
                {t("pricingPage.tokens.desc", "Los tokens IA son unidades de conversación con tu Rowi. Cada interacción consume tokens según su complejidad. Tus tokens se renuevan cada mes.")}
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-white/50 dark:bg-zinc-900/50">
                  <p className="font-semibold text-sm mb-1">{t("pricingPage.tokens.freeLabel", "🆓 Free (10 tokens)")}</p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("pricingPage.tokens.freeDesc", "Exploración básica")}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/50 dark:bg-zinc-900/50">
                  <p className="font-semibold text-sm mb-1">{t("pricingPage.tokens.plusLabel", "⭐ ROWI+ (150 tokens)")}</p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("pricingPage.tokens.plusDesc", "Conversación profunda + resúmenes")}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/50 dark:bg-zinc-900/50">
                  <p className="font-semibold text-sm mb-1">{t("pricingPage.tokens.proLabel", "🚀 Pro (500 tokens)")}</p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("pricingPage.tokens.proDesc", "IA copiloto para coaching")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comparison Table Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">
            {t("pricingPage.comparison.title", "Comparación detallada")}
          </h2>
          <p className="text-[var(--rowi-muted)] mb-8">
            {t("pricingPage.comparison.subtitle", "Todos los planes incluyen tu Rowi personal con IA y acceso a la comunidad")}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--rowi-border)]">
                  <th className="py-4 px-4 text-left font-semibold">
                    {t("pricingPage.comparison.feature", "Característica")}
                  </th>
                  {plans.map(plan => (
                    <th key={plan.slug} className="py-4 px-2 text-center">
                      <span className="text-lg">{plan.emoji}</span>
                      <br />
                      <span className="font-semibold" style={{ color: plan.color }}>{plan.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--rowi-border)]">
                  <td className="py-3 px-4 font-medium">{t("pricingPage.comparison.tokensMonth", "Tokens IA/mes")}</td>
                  {plans.map(plan => (
                    <td key={plan.slug} className="py-3 px-2 text-center">
                      {plan.tokensOrganization || plan.tokensMonthly}
                      {plan.tokensShared && " 🔗"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--rowi-border)]">
                  <td className="py-3 px-4 font-medium">{t("pricingPage.comparison.maxUsers", "Usuarios máx.")}</td>
                  {plans.map(plan => (
                    <td key={plan.slug} className="py-3 px-2 text-center">
                      {plan.maxUsers >= 999 ? "∞" : plan.maxUsers}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--rowi-border)]">
                  <td className="py-3 px-4 font-medium">SEI {t("pricingPage.comparison.seiIncluded", "incluido")}</td>
                  {plans.map(plan => (
                    <td key={plan.slug} className="py-3 px-2 text-center">
                      {plan.seiIncluded ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--rowi-border)]">
                  <td className="py-3 px-4 font-medium">API</td>
                  {plans.map(plan => (
                    <td key={plan.slug} className="py-3 px-2 text-center">
                      {plan.apiAccess ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">{t("pricingPage.comparison.integrations", "Integraciones")}</td>
                  {plans.map(plan => (
                    <td key={plan.slug} className="py-3 px-2 text-center">
                      {plan.integrations.slack || plan.integrations.teams ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-center mb-8">
            {t("pricingPage.faq.title", "Preguntas frecuentes")}
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              {
                q: t("pricingPage.faq.q1", "¿Quién puede ver mis datos emocionales?"),
                a: t("pricingPage.faq.a1", "Tus datos individuales son privados y solo tuyos. Las vistas de equipo u organización son siempre agregadas y anónimas (mínimo 5 personas), nunca individuales. Nuestro piso de privacidad es el GDPR, adaptado a cada jurisdicción."),
              },
              {
                q: t("pricingPage.faq.q2", "¿Cómo usa Rowi la inteligencia artificial?"),
                a: t("pricingPage.faq.a2", "La IA te da insights accionables a partir de tus check-ins, sin sustituir el juicio humano. No vendemos tus datos ni los usamos para entrenar modelos de terceros. Puedes desactivar las funciones de IA en cualquier momento."),
              },
              {
                q: t("pricingPage.faq.q3", "¿En qué metodología se basa Rowi?"),
                a: t("pricingPage.faq.a3", "Rowi se apoya en el marco de Six Seconds, con instrumentos validados internacionalmente (SEI, talentos cerebrales) y el modelo de Vital Signs. Combinamos ciencia de inteligencia emocional con una experiencia digital continua."),
              },
              {
                q: t("pricingPage.faq.q4", "¿Puedo cambiar de plan?"),
                a: t("pricingPage.faq.a4", "Sí, puedes actualizar o degradar tu plan cuando quieras. Los cambios se aplican en tu próximo ciclo."),
              },
              {
                q: t("pricingPage.faq.q5", "¿Cómo cancelo mi suscripción?"),
                a: t("pricingPage.faq.a5", "Puedes cancelar cuando quieras desde los ajustes de tu cuenta, sin llamadas ni trámites. Conservas el acceso hasta el final del periodo ya pagado."),
              },
              {
                q: t("pricingPage.faq.q6", "¿Hay período de prueba?"),
                a: t("pricingPage.faq.a6", "El plan Free es gratuito para siempre. Los planes de pago incluyen 14 días de garantía."),
              },
              {
                q: t("pricingPage.faq.q7", "¿Qué pasa si agoto mis tokens?"),
                a: t("pricingPage.faq.a7", "Puedes comprar tokens adicionales o esperar a que se renueven el próximo mes."),
              },
              {
                q: t("pricingPage.faq.q8", "¿Cómo funciona el plan Family?"),
                a: t("pricingPage.faq.a8", "Los 500 tokens se comparten entre hasta 6 miembros. Cada uno tiene su propia cuenta Rowi."),
              },
            ].map((faq, i) => (
              <div key={i} className="p-5 rounded-2xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  {faq.q}
                </h4>
                <p className="text-sm text-[var(--rowi-muted)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center p-8 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {t("pricingPage.contact.title", "¿Tienes preguntas?")}
          </h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            {t("pricingPage.contact.subtitle", "Nuestro equipo está listo para ayudarte a elegir el plan perfecto para ti o tu organización.")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 transition-all"
            >
              {t("pricingPage.contact.contactTeam", "Contactar equipo")}
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all"
            >
              {t("pricingPage.contact.startFree", "Comenzar gratis")}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
