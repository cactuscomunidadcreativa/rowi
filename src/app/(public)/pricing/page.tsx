"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
import Link from "next/link";
import {
  ROWI_PLANS,
  getAllPlans,
  formatPrice,
  calculateYearlySavingsPercent,
  getTokensText,
  getSupportLevelName,
  type RowiPlan,
  type PlanSlug,
} from "@/domains/plans/lib/plans";

const PLAN_ICONS: Record<PlanSlug, React.ElementType> = {
  free: Sparkles,
  plus: Star,
  family: Users,
  pro: Rocket,
  business: Building2,
  enterprise: Cloud,
};

export default function PricingPage() {
  const { t, lang } = useI18n();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [expandedPlan, setExpandedPlan] = useState<PlanSlug | null>(null);
  const [showB2B, setShowB2B] = useState(false);

  const plans = getAllPlans();
  const b2cPlans = plans.filter(p => p.targetAudience === "B2C" || (p.targetAudience === "B2C/B2B" && !showB2B));
  const b2bPlans = plans.filter(p => p.targetAudience === "B2B" || p.targetAudience === "B2C/B2B");

  const displayedPlans = showB2B ? b2bPlans : b2cPlans;

  const getPrice = (plan: RowiPlan) => {
    if (plan.isCustomPricing) {
      return lang === "es" ? "Personalizado" : "Custom";
    }
    const price = billingPeriod === "yearly" ? plan.priceYearly : plan.priceMonthly;
    return formatPrice(price, plan.currency, lang);
  };

  const getPeriodText = (plan: RowiPlan) => {
    if (plan.isCustomPricing) return "";
    if (plan.priceMonthly === 0) return lang === "es" ? "/siempre" : "/forever";
    if (billingPeriod === "yearly") return lang === "es" ? "/año" : "/year";
    return lang === "es" ? "/mes" : "/month";
  };

  const getPerUserText = (plan: RowiPlan) => {
    if (plan.pricePerUser && plan.pricePerUser > 0) {
      const price = billingPeriod === "yearly" ? plan.pricePerUserYearly : plan.pricePerUser;
      return lang === "es"
        ? `${formatPrice(price || 0, plan.currency, lang)}/usuario`
        : `${formatPrice(price || 0, plan.currency, lang)}/user`;
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
            {lang === "es" ? "Planes transparentes" : "Transparent pricing"}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            {lang === "es" ? "Elige tu" : "Choose your"}{" "}
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent">
              {lang === "es" ? "plan perfecto" : "perfect plan"}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[var(--rowi-muted)] max-w-2xl mx-auto mb-8"
          >
            {lang === "es"
              ? "Comienza gratis y escala según tus necesidades. Todos los planes incluyen tu Rowi personal."
              : "Start free and scale as you grow. All plans include your personal Rowi."}
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
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !showB2B
                  ? "bg-[var(--rowi-primary)] text-white"
                  : "bg-[var(--rowi-card)] hover:bg-[var(--rowi-card-hover)]"
              }`}
            >
              {lang === "es" ? "👤 Personal y Familia" : "👤 Personal & Family"}
            </button>
            <button
              onClick={() => setShowB2B(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                showB2B
                  ? "bg-[var(--rowi-primary)] text-white"
                  : "bg-[var(--rowi-card)] hover:bg-[var(--rowi-card-hover)]"
              }`}
            >
              {lang === "es" ? "🏢 Empresas" : "🏢 Business"}
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
              {lang === "es" ? "Mensual" : "Monthly"}
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
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
              {lang === "es" ? "Anual" : "Yearly"}
            </span>
            {billingPeriod === "yearly" && (
              <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
                {lang === "es" ? "Ahorra hasta 17%" : "Save up to 17%"}
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
                    {lang === "es" ? plan.badge : plan.badgeEN}
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
                    <p className="text-sm text-[var(--rowi-muted)]">
                      {lang === "es" ? plan.description.split(".")[0] : plan.descriptionEN.split(".")[0]}
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
                      {plan.minUsers > 1 && ` (mín. ${plan.minUsers})`}
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
                  {(lang === "es" ? plan.features : plan.featuresEN).slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Expand/Collapse */}
                {(lang === "es" ? plan.features : plan.featuresEN).length > 4 && (
                  <button
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.slug)}
                    className="flex items-center gap-1 text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-text)] mb-4"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        {lang === "es" ? "Ver menos" : "See less"}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        {lang === "es"
                          ? `Ver ${(lang === "es" ? plan.features : plan.featuresEN).length - 4} más`
                          : `See ${(lang === "es" ? plan.features : plan.featuresEN).length - 4} more`}
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
                    {(lang === "es" ? plan.features : plan.featuresEN).slice(4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}

                    {/* Limitations */}
                    {(lang === "es" ? plan.limitations : plan.limitationsEN).length > 0 && (
                      <div className="pt-2 mt-2 border-t border-[var(--rowi-border)]">
                        <p className="text-xs font-semibold text-[var(--rowi-muted)] mb-2">
                          {lang === "es" ? "Limitaciones" : "Limitations"}
                        </p>
                        {(lang === "es" ? plan.limitations : plan.limitationsEN).map((limitation, i) => (
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
                <Link
                  href={plan.isCustomPricing ? "/contact" : `/register?plan=${plan.slug}`}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                    isHighlighted
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90"
                      : "bg-[var(--rowi-bg)] hover:bg-[var(--rowi-border)]"
                  }`}
                >
                  {plan.isCustomPricing
                    ? (lang === "es" ? "Contactar ventas" : "Contact sales")
                    : plan.priceMonthly === 0
                    ? (lang === "es" ? "Comenzar gratis" : "Start free")
                    : (lang === "es" ? "Comenzar ahora" : "Start now")
                  }
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Support Level */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--rowi-muted)]">
                  <MessageCircle className="w-3 h-3" />
                  {lang === "es" ? "Soporte:" : "Support:"} {getSupportLevelName(plan.supportLevel, lang)}
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
                {lang === "es" ? "¿Qué son los tokens IA?" : "What are AI tokens?"}
              </h3>
              <p className="text-[var(--rowi-muted)] mb-4">
                {lang === "es"
                  ? "Los tokens IA son unidades de conversación con tu Rowi. Cada interacción consume tokens según su complejidad. Tus tokens se renuevan cada mes."
                  : "AI tokens are conversation units with your Rowi. Each interaction consumes tokens based on complexity. Your tokens renew monthly."}
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-white/50 dark:bg-zinc-900/50">
                  <p className="font-semibold text-sm mb-1">🆓 Free (10 tokens)</p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {lang === "es" ? "Exploración básica" : "Basic exploration"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/50 dark:bg-zinc-900/50">
                  <p className="font-semibold text-sm mb-1">⭐ ROWI+ (150 tokens)</p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {lang === "es" ? "Conversación profunda + resúmenes" : "Deep conversation + summaries"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/50 dark:bg-zinc-900/50">
                  <p className="font-semibold text-sm mb-1">🚀 Pro (500 tokens)</p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {lang === "es" ? "IA copiloto para coaching" : "AI copilot for coaching"}
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
            {lang === "es" ? "Comparación detallada" : "Detailed comparison"}
          </h2>
          <p className="text-[var(--rowi-muted)] mb-8">
            {lang === "es"
              ? "Todos los planes incluyen tu Rowi personal con IA y acceso a la comunidad"
              : "All plans include your personal Rowi with AI and community access"}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--rowi-border)]">
                  <th className="py-4 px-4 text-left font-semibold">
                    {lang === "es" ? "Característica" : "Feature"}
                  </th>
                  {getAllPlans().map(plan => (
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
                  <td className="py-3 px-4 font-medium">{lang === "es" ? "Tokens IA/mes" : "AI tokens/month"}</td>
                  {getAllPlans().map(plan => (
                    <td key={plan.slug} className="py-3 px-2 text-center">
                      {plan.tokensOrganization || plan.tokensMonthly}
                      {plan.tokensShared && " 🔗"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--rowi-border)]">
                  <td className="py-3 px-4 font-medium">{lang === "es" ? "Usuarios máx." : "Max users"}</td>
                  {getAllPlans().map(plan => (
                    <td key={plan.slug} className="py-3 px-2 text-center">
                      {plan.maxUsers >= 999 ? "∞" : plan.maxUsers}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--rowi-border)]">
                  <td className="py-3 px-4 font-medium">SEI {lang === "es" ? "incluido" : "included"}</td>
                  {getAllPlans().map(plan => (
                    <td key={plan.slug} className="py-3 px-2 text-center">
                      {plan.seiIncluded ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--rowi-border)]">
                  <td className="py-3 px-4 font-medium">API</td>
                  {getAllPlans().map(plan => (
                    <td key={plan.slug} className="py-3 px-2 text-center">
                      {plan.apiAccess ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">{lang === "es" ? "Integraciones" : "Integrations"}</td>
                  {getAllPlans().map(plan => (
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
            {lang === "es" ? "Preguntas frecuentes" : "Frequently asked questions"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              {
                q: lang === "es" ? "¿Puedo cambiar de plan?" : "Can I change plans?",
                a: lang === "es"
                  ? "Sí, puedes actualizar o degradar tu plan cuando quieras. Los cambios se aplican en tu próximo ciclo."
                  : "Yes, you can upgrade or downgrade anytime. Changes apply on your next billing cycle.",
              },
              {
                q: lang === "es" ? "¿Hay período de prueba?" : "Is there a free trial?",
                a: lang === "es"
                  ? "El plan Free es gratuito para siempre. Los planes de pago incluyen 14 días de garantía."
                  : "The Free plan is free forever. Paid plans include a 14-day money-back guarantee.",
              },
              {
                q: lang === "es" ? "¿Qué pasa si agoto mis tokens?" : "What if I run out of tokens?",
                a: lang === "es"
                  ? "Puedes comprar tokens adicionales o esperar a que se renueven el próximo mes."
                  : "You can purchase additional tokens or wait for them to renew next month.",
              },
              {
                q: lang === "es" ? "¿Cómo funciona el plan Family?" : "How does the Family plan work?",
                a: lang === "es"
                  ? "Los 500 tokens se comparten entre hasta 6 miembros. Cada uno tiene su propia cuenta Rowi."
                  : "The 500 tokens are shared among up to 6 members. Each has their own Rowi account.",
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
            {lang === "es" ? "¿Tienes preguntas?" : "Have questions?"}
          </h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            {lang === "es"
              ? "Nuestro equipo está listo para ayudarte a elegir el plan perfecto para ti o tu organización."
              : "Our team is ready to help you choose the perfect plan for you or your organization."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 transition-all"
            >
              {lang === "es" ? "Contactar equipo" : "Contact team"}
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all"
            >
              {lang === "es" ? "Comenzar gratis" : "Start free"}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
