"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getProviders } from "next-auth/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  Users,
  BarChart3,
  Globe2,
  Crown,
  Clock,
  CreditCard,
  Mail,
  Building2,
  Loader2,
  Star,
  Rocket,
  Cloud,
  Brain,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  ROWI_PLANS,
  getAllPlans,
  formatPrice,
  getTokensText,
  getSupportLevelName,
  type RowiPlan,
  type PlanSlug,
} from "@/domains/plans/lib/plans";

/* =========================================================
   🌍 Traducciones locales
========================================================= */
const translations = {
  es: {
    steps: {
      plan: "Plan",
      account: "Cuenta",
      profile: "Perfil",
      sei: "SEI",
      confirm: "Confirmar",
    },
    planSelection: {
      title: "Elige tu plan perfecto",
      description: "Todos los planes incluyen tu Rowi personal con inteligencia artificial",
      personalFamily: "👤 Personal y Familia",
      business: "🏢 Empresas",
      monthly: "Mensual",
      yearly: "Anual",
      perUser: "por usuario",
      min: "mín.",
      seeLess: "Ver menos",
      more: "más",
      continue: "Continuar",
    },
    account: {
      title: "Crea tu cuenta",
      description: "Elige cómo quieres registrarte",
      continueWith: "Continuar con",
      or: "o regístrate con email",
      namePlaceholder: "Tu nombre completo",
      emailPlaceholder: "tu@email.com",
      createAccount: "Crear cuenta",
      back: "Atrás",
    },
    profile: {
      title: "Completa tu perfil",
      description: "Cuéntanos un poco más sobre ti",
      selectCountry: "Selecciona tu país",
      otherCountry: "Otro",
      referralCode: "Código de referido",
      referralCodePlaceholder: "Ingresa código de referido",
      couponCode: "Código de cupón",
      couponCodePlaceholder: "Ingresa código de cupón",
      optional: "opcional",
      continue: "Continuar",
      back: "Atrás",
    },
    sei: {
      title: "Evaluación SEI",
      description: "El SEI mide tu inteligencia emocional",
      included: "¡SEI incluido en tu plan!",
      includedDescription: "Tu plan incluye una evaluación SEI de Six Seconds",
      takeSeiNow: "Quiero hacer el SEI ahora",
      takeSeiNowDescription: "Te guiaremos paso a paso después del registro",
      skipForNow: "Lo haré más tarde",
      skipForNowDescription: "Puedes tomar el SEI cuando quieras desde tu dashboard",
      notIncluded: "SEI no incluido",
      upgradeToInclude: "Mejora tu plan para incluirlo",
      continue: "Continuar",
      back: "Atrás",
    },
    confirm: {
      title: "Confirma tu registro",
      description: "Revisa los detalles antes de continuar",
      orderSummary: "Resumen de tu pedido",
      plan: "Plan",
      billing: "Facturación",
      aiTokens: "Tokens IA",
      name: "Nombre",
      email: "Email",
      seiYes: "Sí, después del registro",
      seiLater: "Más tarde",
      total: "Total",
      terms: "Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad",
      startFree: "Comenzar gratis",
      proceedToPayment: "Ir al pago",
      contactSales: "Contactar ventas",
      back: "Atrás",
    },
    errors: {
      oauth: "Error al conectar con el proveedor",
      requiredFields: "Por favor completa todos los campos requeridos",
      general: "Ocurrió un error. Inténtalo de nuevo.",
      checkout: "Error al procesar el pago",
    },
    success: {
      emailSent: "¡Revisa tu email para confirmar tu cuenta!",
    },
    price: {
      custom: "Personalizado",
      forever: "/siempre",
      year: "/año",
      month: "/mes",
    },
  },
  en: {
    steps: {
      plan: "Plan",
      account: "Account",
      profile: "Profile",
      sei: "SEI",
      confirm: "Confirm",
    },
    planSelection: {
      title: "Choose your perfect plan",
      description: "All plans include your personal Rowi with artificial intelligence",
      personalFamily: "👤 Personal & Family",
      business: "🏢 Business",
      monthly: "Monthly",
      yearly: "Yearly",
      perUser: "per user",
      min: "min.",
      seeLess: "See less",
      more: "more",
      continue: "Continue",
    },
    account: {
      title: "Create your account",
      description: "Choose how you want to sign up",
      continueWith: "Continue with",
      or: "or sign up with email",
      namePlaceholder: "Your full name",
      emailPlaceholder: "you@email.com",
      createAccount: "Create account",
      back: "Back",
    },
    profile: {
      title: "Complete your profile",
      description: "Tell us a bit more about yourself",
      selectCountry: "Select your country",
      otherCountry: "Other",
      referralCode: "Referral code",
      referralCodePlaceholder: "Enter referral code",
      couponCode: "Coupon code",
      couponCodePlaceholder: "Enter coupon code",
      optional: "optional",
      continue: "Continue",
      back: "Back",
    },
    sei: {
      title: "SEI Assessment",
      description: "The SEI measures your emotional intelligence",
      included: "SEI included in your plan!",
      includedDescription: "Your plan includes a Six Seconds SEI assessment",
      takeSeiNow: "I want to take the SEI now",
      takeSeiNowDescription: "We'll guide you step by step after registration",
      skipForNow: "I'll do it later",
      skipForNowDescription: "You can take the SEI anytime from your dashboard",
      notIncluded: "SEI not included",
      upgradeToInclude: "Upgrade your plan to include it",
      continue: "Continue",
      back: "Back",
    },
    confirm: {
      title: "Confirm your registration",
      description: "Review the details before continuing",
      orderSummary: "Order summary",
      plan: "Plan",
      billing: "Billing",
      aiTokens: "AI Tokens",
      name: "Name",
      email: "Email",
      seiYes: "Yes, after registration",
      seiLater: "Later",
      total: "Total",
      terms: "By continuing, you accept our Terms of Service and Privacy Policy",
      startFree: "Start free",
      proceedToPayment: "Proceed to payment",
      contactSales: "Contact sales",
      back: "Back",
    },
    errors: {
      oauth: "Error connecting to provider",
      requiredFields: "Please complete all required fields",
      general: "An error occurred. Please try again.",
      checkout: "Error processing payment",
    },
    success: {
      emailSent: "Check your email to confirm your account!",
    },
    price: {
      custom: "Custom",
      forever: "/forever",
      year: "/year",
      month: "/month",
    },
  },
};

/* =========================================================
   🚀 Rowi Registration — Multi-step Onboarding
   ---------------------------------------------------------
   Step 0: Plan Selection
   Step 1: Account Creation (OAuth or Email)
   Step 2: Profile Setup
   Step 3: SEI Decision
   Step 4: Confirmation
========================================================= */

const STEPS = [
  { key: "plan", icon: CreditCard },
  { key: "account", icon: Mail },
  { key: "profile", icon: Users },
  { key: "sei", icon: Zap },
  { key: "confirm", icon: Check },
];

const PLAN_ICONS: Record<PlanSlug, React.ElementType> = {
  free: Sparkles,
  plus: Star,
  family: Users,
  pro: Rocket,
  business: Building2,
  enterprise: Cloud,
};

// Loading fallback for Suspense
function RegisterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--rowi-g2)]" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [showB2B, setShowB2B] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<PlanSlug | null>(null);

  // Form data
  const [selectedPlan, setSelectedPlan] = useState<RowiPlan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    country: "",
    language: lang,
    wantsSei: true,
    referralCode: searchParams.get("ref") || "",
    couponCode: searchParams.get("coupon") || "",
  });

  // Get plans from constants
  const allPlans = getAllPlans();
  const b2cPlans = allPlans.filter(p => p.targetAudience === "B2C" || (p.targetAudience === "B2C/B2B" && !showB2B));
  const b2bPlans = allPlans.filter(p => p.targetAudience === "B2B" || p.targetAudience === "B2C/B2B");
  const displayedPlans = showB2B ? b2bPlans : b2cPlans;

  // Load providers and pre-select plan from URL
  useEffect(() => {
    loadProviders();

    // Pre-select plan from URL if provided
    const planSlug = searchParams.get("plan") as PlanSlug;
    if (planSlug && ROWI_PLANS[planSlug]) {
      setSelectedPlan(ROWI_PLANS[planSlug]);
      // If B2B plan, show B2B section
      if (ROWI_PLANS[planSlug].targetAudience === "B2B") {
        setShowB2B(true);
      }
    }
  }, [searchParams]);

  // Update form language when app language changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, language: lang }));
  }, [lang]);

  async function loadProviders() {
    try {
      const prov = await getProviders();
      setProviders(prov);
    } catch (error) {
      console.error("Error loading providers:", error);
    }
  }

  function nextStep() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  }

  function prevStep() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  async function handleOAuthSignIn(providerId: string) {
    setLoading(true);
    try {
      // Store registration data in sessionStorage for after OAuth
      sessionStorage.setItem(
        "rowi_registration",
        JSON.stringify({
          selectedPlan,
          formData,
          billingPeriod,
        })
      );
      await signIn(providerId, { callbackUrl: "/register/complete" });
    } catch (error) {
      toast.error(t.errors.oauth);
      setLoading(false);
    }
  }

  async function handleEmailRegistration() {
    if (!formData.email || !formData.name || !formData.password) {
      toast.error(t.errors.requiredFields);
      return;
    }

    if (formData.password.length < 8) {
      toast.error(lang === "es" ? "La contraseña debe tener al menos 8 caracteres" : "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          planSlug: selectedPlan?.slug,
          billingPeriod,
          country: formData.country,
          language: formData.language,
          wantsSei: formData.wantsSei,
          referralCode: formData.referralCode,
          couponCode: formData.couponCode,
          utmSource: searchParams.get("utm_source"),
          utmMedium: searchParams.get("utm_medium"),
          utmCampaign: searchParams.get("utm_campaign"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      // Auto-login después del registro exitoso
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Si falla el auto-login, mostrar mensaje y redirigir a login
        toast.success(lang === "es" ? "Cuenta creada. Por favor inicia sesión." : "Account created. Please sign in.");
        router.push("/login");
      } else {
        // Auto-login exitoso, ir a settings/profile para completar perfil y ver SEI
        toast.success(lang === "es" ? "¡Bienvenido a Rowi! Completa tu perfil." : "Welcome to Rowi! Complete your profile.");
        router.push("/settings/profile");
      }
    } catch (error: any) {
      const errorMsg = error.message === "email_already_exists"
        ? (lang === "es" ? "Este email ya está registrado" : "This email is already registered")
        : error.message || t.errors.general;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (!selectedPlan || selectedPlan.priceMonthly === 0) {
      // Plan gratuito - ir directo al dashboard
      router.push("/dashboard");
      return;
    }

    if (selectedPlan.isCustomPricing) {
      // Enterprise - ir a contacto
      router.push("/contact?plan=enterprise");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: selectedPlan.slug,
          billingPeriod,
          successUrl: `${window.location.origin}/register/success`,
          cancelUrl: `${window.location.origin}/register?step=plan`,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || t.errors.checkout);
      setLoading(false);
    }
  }

  const getPrice = (plan: RowiPlan) => {
    if (plan.isCustomPricing) {
      return t.price.custom;
    }
    const price = billingPeriod === "yearly" ? plan.priceYearly : plan.priceMonthly;
    return formatPrice(price, plan.currency, lang);
  };

  const getPeriodText = (plan: RowiPlan) => {
    if (plan.isCustomPricing) return "";
    if (plan.priceMonthly === 0) return t.price.forever;
    if (billingPeriod === "yearly") return t.price.year;
    return t.price.month;
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      {/* Step Indicator */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.key}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  i === step
                    ? "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white"
                    : i < step
                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t.steps[s.key as keyof typeof t.steps]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 0: Plan Selection */}
          {step === 0 && (
            <StepContainer key="plan">
              <StepHeader
                title={t.planSelection.title}
                description={t.planSelection.description}
              />

              {/* Toggle B2C / B2B */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setShowB2B(false)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    !showB2B
                      ? "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white"
                      : "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {t.planSelection.personalFamily}
                </button>
                <button
                  onClick={() => setShowB2B(true)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    showB2B
                      ? "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white"
                      : "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {t.planSelection.business}
                </button>
              </div>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <span className={`text-sm ${billingPeriod === "monthly" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                  {t.planSelection.monthly}
                </span>
                <button
                  onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    billingPeriod === "yearly" ? "bg-green-500" : "bg-gray-300 dark:bg-zinc-700"
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                    animate={{ left: billingPeriod === "yearly" ? "calc(100% - 22px)" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
                <span className={`text-sm ${billingPeriod === "yearly" ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                  {t.planSelection.yearly}
                </span>
                {billingPeriod === "yearly" && (
                  <span className="ml-1 px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-medium rounded-full">
                    -17%
                  </span>
                )}
              </div>

              {/* Plans Grid */}
              <div className={`grid gap-4 mt-8 ${
                displayedPlans.length <= 3
                  ? "md:grid-cols-3"
                  : "md:grid-cols-2 lg:grid-cols-4"
              }`}>
                {displayedPlans.map((plan, index) => {
                  const Icon = PLAN_ICONS[plan.slug];
                  const isSelected = selectedPlan?.slug === plan.slug;
                  const isExpanded = expandedPlan === plan.slug;
                  const isHighlighted = plan.badge === "Popular" || plan.badge === "Recomendado";

                  return (
                    <motion.div
                      key={plan.slug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      onClick={() => setSelectedPlan(plan)}
                      className={`relative rounded-2xl p-5 cursor-pointer transition-all ${
                        isSelected
                          ? "border-2 border-[var(--rowi-g2)] bg-[var(--rowi-g2)]/5 shadow-lg"
                          : isHighlighted
                          ? "border-2 border-blue-500/50 bg-white dark:bg-zinc-900"
                          : "border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-[var(--rowi-g2)]/50"
                      }`}
                    >
                      {/* Badge */}
                      {plan.badge && (
                        <div
                          className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: plan.color }}
                        >
                          {lang === "es" ? plan.badge : plan.badgeEN}
                        </div>
                      )}

                      {/* Selected Check */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[var(--rowi-g2)] flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Icon & Name */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                          style={{ backgroundColor: plan.color }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold">{plan.name}</h3>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">{getPrice(plan)}</span>
                          <span className="text-sm text-gray-500">{getPeriodText(plan)}</span>
                        </div>
                        {plan.pricePerUser && plan.pricePerUser > 0 && (
                          <p className="text-xs text-gray-500">
                            {t.planSelection.perUser}
                            {plan.minUsers > 1 && ` (${t.planSelection.min} ${plan.minUsers})`}
                          </p>
                        )}
                      </div>

                      {/* Tokens */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 mb-3">
                        <Brain className="w-4 h-4" style={{ color: plan.color }} />
                        <span className="text-xs font-medium">{getTokensText(plan, lang)}</span>
                      </div>

                      {/* Key Features (3) */}
                      <ul className="space-y-1.5 text-sm">
                        {(lang === "es" ? plan.features : plan.featuresEN).slice(0, 3).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 mt-0.5 text-green-500 shrink-0" />
                            <span className="text-xs">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Expand/Collapse */}
                      {(lang === "es" ? plan.features : plan.featuresEN).length > 3 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedPlan(isExpanded ? null : plan.slug);
                          }}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-2"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded
                            ? t.planSelection.seeLess
                            : `+${(lang === "es" ? plan.features : plan.featuresEN).length - 3} ${t.planSelection.more}`
                          }
                        </button>
                      )}

                      {/* Expanded Features */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-1.5 mt-2 overflow-hidden"
                          >
                            {(lang === "es" ? plan.features : plan.featuresEN).slice(3).map((feature, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 mt-0.5 text-green-500 shrink-0" />
                                <span className="text-xs">{feature}</span>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>

                      {/* Support */}
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-zinc-800 flex items-center gap-1 text-xs text-gray-500">
                        <MessageCircle className="w-3 h-3" />
                        {getSupportLevelName(plan.supportLevel, lang)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Selected Plan Summary */}
              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 border border-[var(--rowi-g2)]/20"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedPlan.emoji}</span>
                      <div>
                        <p className="font-semibold">{selectedPlan.name}</p>
                        <p className="text-sm text-gray-500">
                          {getPrice(selectedPlan)}{getPeriodText(selectedPlan)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={nextStep}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                      {t.planSelection.continue}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </StepContainer>
          )}

          {/* Step 1: Account Creation */}
          {step === 1 && (
            <StepContainer key="account">
              <StepHeader
                title={t.account.title}
                description={t.account.description}
              />

              <div className="max-w-md mx-auto mt-8 space-y-4">
                {/* OAuth Providers */}
                {providers &&
                  Object.values(providers)
                    .filter((p: any) => p.id !== "email")
                    .map((provider: any) => (
                      <button
                        key={provider.id}
                        onClick={() => handleOAuthSignIn(provider.id)}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <ProviderIcon provider={provider.id} />
                            {t.account.continueWith} {provider.name}
                          </>
                        )}
                      </button>
                    ))}

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-gray-50 dark:bg-zinc-900 text-gray-500">
                      {t.account.or}
                    </span>
                  </div>
                </div>

                {/* Email Form */}
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder={t.account.namePlaceholder}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:border-[var(--rowi-g2)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/20"
                  />
                  <input
                    type="email"
                    placeholder={t.account.emailPlaceholder}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:border-[var(--rowi-g2)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/20"
                  />
                  <input
                    type="password"
                    placeholder={lang === "es" ? "Contraseña (mínimo 8 caracteres)" : "Password (minimum 8 characters)"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:border-[var(--rowi-g2)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/20"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8 max-w-md mx-auto">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.account.back}
                </button>
                <button
                  onClick={handleEmailRegistration}
                  disabled={loading || !formData.email || !formData.name || !formData.password || formData.password.length < 8}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t.account.createAccount}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </StepContainer>
          )}

          {/* Step 2: Profile Setup */}
          {step === 2 && (
            <StepContainer key="profile">
              <StepHeader
                title={t.profile.title}
                description={t.profile.description}
              />

              <div className="max-w-md mx-auto mt-8 space-y-4">
                <select
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:border-[var(--rowi-g2)] focus:outline-none"
                >
                  <option value="">{t.profile.selectCountry}</option>
                  <option value="PE">Peru</option>
                  <option value="MX">Mexico</option>
                  <option value="CO">Colombia</option>
                  <option value="AR">Argentina</option>
                  <option value="CL">Chile</option>
                  <option value="ES">Spain</option>
                  <option value="US">United States</option>
                  <option value="other">{t.profile.otherCountry}</option>
                </select>

                {/* Referral Code */}
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    {t.profile.referralCode} ({t.profile.optional})
                  </label>
                  <input
                    type="text"
                    placeholder={t.profile.referralCodePlaceholder}
                    value={formData.referralCode}
                    onChange={(e) =>
                      setFormData({ ...formData, referralCode: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:border-[var(--rowi-g2)] focus:outline-none"
                  />
                </div>

                {/* Coupon Code */}
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    {t.profile.couponCode} ({t.profile.optional})
                  </label>
                  <input
                    type="text"
                    placeholder={t.profile.couponCodePlaceholder}
                    value={formData.couponCode}
                    onChange={(e) =>
                      setFormData({ ...formData, couponCode: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:border-[var(--rowi-g2)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8 max-w-md mx-auto">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.profile.back}
                </button>
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  {t.profile.continue}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </StepContainer>
          )}

          {/* Step 3: SEI Decision */}
          {step === 3 && (
            <StepContainer key="sei">
              <StepHeader
                title={t.sei.title}
                description={t.sei.description}
              />

              <div className="max-w-lg mx-auto mt-8">
                {selectedPlan?.seiIncluded ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 border border-[var(--rowi-g2)]/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {t.sei.included}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {t.sei.includedDescription}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 cursor-pointer hover:border-[var(--rowi-g2)] transition-colors">
                        <input
                          type="radio"
                          name="sei"
                          checked={formData.wantsSei}
                          onChange={() =>
                            setFormData({ ...formData, wantsSei: true })
                          }
                          className="w-4 h-4 text-[var(--rowi-g2)]"
                        />
                        <div>
                          <p className="font-medium">
                            {t.sei.takeSeiNow}
                          </p>
                          <p className="text-sm text-gray-500">
                            {t.sei.takeSeiNowDescription}
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 cursor-pointer hover:border-[var(--rowi-g2)] transition-colors">
                        <input
                          type="radio"
                          name="sei"
                          checked={!formData.wantsSei}
                          onChange={() =>
                            setFormData({ ...formData, wantsSei: false })
                          }
                          className="w-4 h-4 text-[var(--rowi-g2)]"
                        />
                        <div>
                          <p className="font-medium">
                            {t.sei.skipForNow}
                          </p>
                          <p className="text-sm text-gray-500">
                            {t.sei.skipForNowDescription}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500">
                          {t.sei.notIncluded}
                        </p>
                        <p className="text-sm text-gray-400">
                          {selectedPlan?.seiDiscountPercent && selectedPlan.seiDiscountPercent > 0
                            ? `${selectedPlan.seiDiscountPercent}% ${lang === "es" ? "de descuento disponible" : "discount available"}`
                            : t.sei.upgradeToInclude}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-8 max-w-lg mx-auto">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.sei.back}
                </button>
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  {t.sei.continue}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </StepContainer>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <StepContainer key="confirm">
              <StepHeader
                title={t.confirm.title}
                description={t.confirm.description}
              />

              <div className="max-w-md mx-auto mt-8">
                {/* Order Summary */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="text-xl">{selectedPlan?.emoji}</span>
                    {t.confirm.orderSummary}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {t.confirm.plan}
                      </span>
                      <span className="font-medium">{selectedPlan?.name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {t.confirm.billing}
                      </span>
                      <span className="font-medium">
                        {billingPeriod === "yearly"
                          ? t.planSelection.yearly
                          : t.planSelection.monthly}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {t.confirm.aiTokens}
                      </span>
                      <span className="font-medium">
                        {selectedPlan && getTokensText(selectedPlan, lang)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {t.confirm.name}
                      </span>
                      <span className="font-medium">{formData.name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {t.confirm.email}
                      </span>
                      <span className="font-medium">{formData.email}</span>
                    </div>

                    {selectedPlan?.seiIncluded && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">SEI</span>
                        <span className="font-medium">
                          {formData.wantsSei
                            ? t.confirm.seiYes
                            : t.confirm.seiLater}
                        </span>
                      </div>
                    )}

                    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-zinc-800">
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">
                          {t.confirm.total}
                        </span>
                        <span className="font-bold text-[var(--rowi-g2)]">
                          {selectedPlan && getPrice(selectedPlan)}
                          {selectedPlan && getPeriodText(selectedPlan)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  {t.confirm.terms}
                </p>
              </div>

              <div className="flex justify-between mt-8 max-w-md mx-auto">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.confirm.back}
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {selectedPlan?.isCustomPricing
                        ? t.confirm.contactSales
                        : selectedPlan?.priceMonthly === 0
                        ? t.confirm.startFree
                        : t.confirm.proceedToPayment}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </StepContainer>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// =========================================================
// Helper Components
// =========================================================

function StepContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

function StepHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold rowi-gradient-text">
        {title}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2">{description}</p>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: string }) {
  switch (provider) {
    case "google":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      );
    default:
      return <Mail className="w-5 h-5" />;
  }
}
