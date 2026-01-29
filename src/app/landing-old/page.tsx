"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  Users,
  MessageCircle,
  BarChart3,
  Target,
  Heart,
  Zap,
  ArrowRight,
  CheckCircle,
  Play,
  Star,
  Globe,
  Shield,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   🏠 ROWI — Landing Page (100% Traducible + CMS)
   ---------------------------------------------------------
   La página carga contenido del CMS si está disponible.
   Si no hay CMS, usa las traducciones i18n como fallback.
========================================================= */

interface LandingSection {
  id: string;
  type: string;
  order: number;
  config: Record<string, any>;
  content: Record<string, any>;
}

// Mapeo de iconos por nombre
const ICON_MAP: Record<string, React.ReactNode> = {
  brain: <Brain className="w-6 h-6" />,
  "message-circle": <MessageCircle className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  "bar-chart": <BarChart3 className="w-6 h-6" />,
  target: <Target className="w-6 h-6" />,
  shield: <Shield className="w-5 h-5 text-green-500" />,
  globe: <Globe className="w-5 h-5 text-[var(--rowi-g2)]" />,
  star: <Star className="w-5 h-5 text-yellow-500" />,
  heart: <Heart className="w-6 h-6" />,
};

export default function LandingPage() {
  const { data: session } = useSession();
  const { t, ready, lang } = useI18n();
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [cmsLoaded, setCmsLoaded] = useState(false);

  // Cargar secciones del CMS
  useEffect(() => {
    async function loadCMS() {
      try {
        const res = await fetch("/api/landing/sections");
        const data = await res.json();
        if (data.ok && data.sections?.length > 0) {
          setSections(data.sections);
          setCmsLoaded(true);
        }
      } catch {
        // Si falla, usamos las traducciones estáticas
      }
    }
    loadCMS();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--rowi-bg)]">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--rowi-g1)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Helper para obtener contenido del CMS o fallback a i18n
  const getContent = (sectionType: string, key: string, fallback: string) => {
    if (cmsLoaded) {
      const section = sections.find((s) => s.type === sectionType);
      if (section && section.content[lang]) {
        const value = section.content[lang][key];
        if (value !== undefined) return value;
      }
    }
    return fallback;
  };

  const getConfig = (sectionType: string, key: string, defaultValue: any) => {
    if (cmsLoaded) {
      const section = sections.find((s) => s.type === sectionType);
      if (section && section.config[key] !== undefined) {
        return section.config[key];
      }
    }
    return defaultValue;
  };

  // Si tenemos CMS, renderizamos dinámicamente
  if (cmsLoaded && sections.length > 0) {
    return (
      <main className="min-h-screen bg-[var(--rowi-bg)] text-[var(--rowi-fg)] overflow-x-hidden">
        {sections.map((section) => (
          <DynamicSection
            key={section.id}
            section={section}
            lang={lang}
            session={session}
          />
        ))}
      </main>
    );
  }

  // Fallback: Render estático con traducciones i18n
  return (
    <main className="min-h-screen bg-[var(--rowi-bg)] text-[var(--rowi-fg)] overflow-x-hidden">
      {/* ============ NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[var(--rowi-bg)]/80 border-b border-[var(--rowi-card-border)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] bg-clip-text text-transparent">
              Rowi
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-[var(--rowi-muted)] hover:text-[var(--rowi-fg)] transition">
              {t("landing.nav.features")}
            </a>
            <a href="#how-it-works" className="text-[var(--rowi-muted)] hover:text-[var(--rowi-fg)] transition">
              {t("landing.nav.howItWorks")}
            </a>
            <a href="#pricing" className="text-[var(--rowi-muted)] hover:text-[var(--rowi-fg)] transition">
              {t("landing.nav.pricing")}
            </a>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white shadow-lg hover:shadow-xl transition-all"
              >
                {t("landing.nav.dashboard")}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 rounded-full text-sm font-medium text-[var(--rowi-muted)] hover:text-[var(--rowi-fg)] transition"
                >
                  {t("landing.nav.login")}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {t("landing.nav.getStarted")}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[var(--rowi-g1)]/20 via-[var(--rowi-g2)]/20 to-[var(--rowi-g3)]/20 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--rowi-chip)] text-sm mb-8"
          >
            <Sparkles className="w-4 h-4 text-[var(--rowi-g1)]" />
            <span>{t("landing.hero.badge")}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            {t("landing.hero.title1")}{" "}
            <span className="bg-gradient-to-r from-[var(--rowi-g1)] via-[var(--rowi-g3)] to-[var(--rowi-g2)] bg-clip-text text-transparent">
              {t("landing.hero.title2")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-[var(--rowi-muted)] max-w-3xl mx-auto mb-10"
          >
            {t("landing.hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-semibold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              {t("landing.hero.cta.primary")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-medium border-2 border-[var(--rowi-card-border)] hover:border-[var(--rowi-g2)] transition-colors">
              <Play className="w-5 h-5 text-[var(--rowi-g2)]" />
              {t("landing.hero.cta.secondary")}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-[var(--rowi-muted)]"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span>{t("landing.hero.trust.security")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[var(--rowi-g2)]" />
              <span>{t("landing.hero.trust.methodology")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{t("landing.hero.trust.users")}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FEATURES SECTION ============ */}
      <section id="features" className="py-24 px-6 bg-[var(--rowi-card)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("landing.features.title1")}{" "}
              <span className="bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] bg-clip-text text-transparent">
                {t("landing.features.title2")}
              </span>
            </h2>
            <p className="text-xl text-[var(--rowi-muted)] max-w-2xl mx-auto">
              {t("landing.features.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title={t("landing.features.sei.title")}
              description={t("landing.features.sei.description")}
              gradient="from-[var(--rowi-g1)] to-[var(--rowi-g3)]"
            />
            <FeatureCard
              icon={<MessageCircle className="w-6 h-6" />}
              title={t("landing.features.coach.title")}
              description={t("landing.features.coach.description")}
              gradient="from-[var(--rowi-g2)] to-[var(--rowi-g3)]"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title={t("landing.features.affinity.title")}
              description={t("landing.features.affinity.description")}
              gradient="from-[var(--rowi-g3)] to-[var(--rowi-g1)]"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title={t("landing.features.eco.title")}
              description={t("landing.features.eco.description")}
              gradient="from-[var(--rowi-g1)] to-[var(--rowi-g2)]"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title={t("landing.features.dashboard.title")}
              description={t("landing.features.dashboard.description")}
              gradient="from-[var(--rowi-g2)] to-[var(--rowi-g1)]"
            />
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title={t("landing.features.goals.title")}
              description={t("landing.features.goals.description")}
              gradient="from-[var(--rowi-g3)] to-[var(--rowi-g2)]"
            />
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("landing.howItWorks.title")}
            </h2>
            <p className="text-xl text-[var(--rowi-muted)]">
              {t("landing.howItWorks.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title={t("landing.howItWorks.step1.title")}
              description={t("landing.howItWorks.step1.description")}
            />
            <StepCard
              number="2"
              title={t("landing.howItWorks.step2.title")}
              description={t("landing.howItWorks.step2.description")}
            />
            <StepCard
              number="3"
              title={t("landing.howItWorks.step3.title")}
              description={t("landing.howItWorks.step3.description")}
            />
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-24 px-6 bg-gradient-to-br from-[var(--rowi-g1)]/10 via-transparent to-[var(--rowi-g2)]/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("landing.testimonials.title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote={t("landing.testimonials.1.quote")}
              author={t("landing.testimonials.1.author")}
              role={t("landing.testimonials.1.role")}
            />
            <TestimonialCard
              quote={t("landing.testimonials.2.quote")}
              author={t("landing.testimonials.2.author")}
              role={t("landing.testimonials.2.role")}
            />
            <TestimonialCard
              quote={t("landing.testimonials.3.quote")}
              author={t("landing.testimonials.3.author")}
              role={t("landing.testimonials.3.role")}
            />
          </div>
        </div>
      </section>

      {/* ============ PRICING PREVIEW ============ */}
      <section id="pricing" className="py-24 px-6 bg-[var(--rowi-card)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t("landing.pricing.title")}
          </h2>
          <p className="text-xl text-[var(--rowi-muted)] mb-12">
            {t("landing.pricing.subtitle")}
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl border-2 border-[var(--rowi-card-border)] bg-[var(--rowi-bg)]">
              <div className="text-sm font-medium text-[var(--rowi-muted)] mb-2">
                {t("landing.pricing.free.name")}
              </div>
              <div className="text-4xl font-bold mb-6">
                {t("landing.pricing.free.price")}
                <span className="text-lg font-normal text-[var(--rowi-muted)]">
                  {t("landing.pricing.free.period")}
                </span>
              </div>
              <ul className="space-y-3 text-left mb-8">
                <PricingFeature text={t("landing.pricing.free.feature1")} />
                <PricingFeature text={t("landing.pricing.free.feature2")} />
                <PricingFeature text={t("landing.pricing.free.feature3")} />
                <PricingFeature text={t("landing.pricing.free.feature4")} />
              </ul>
              <Link
                href="/register"
                className="block w-full py-3 rounded-full text-center font-medium border-2 border-[var(--rowi-card-border)] hover:border-[var(--rowi-g2)] transition"
              >
                {t("landing.pricing.free.cta")}
              </Link>
            </div>

            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-[var(--rowi-g1)] text-sm font-medium">
                {t("landing.pricing.pro.badge")}
              </div>
              <div className="text-sm font-medium text-white/80 mb-2">
                {t("landing.pricing.pro.name")}
              </div>
              <div className="text-4xl font-bold mb-6">
                {t("landing.pricing.pro.price")}
                <span className="text-lg font-normal text-white/80">
                  {t("landing.pricing.pro.period")}
                </span>
              </div>
              <ul className="space-y-3 text-left mb-8">
                <PricingFeature text={t("landing.pricing.pro.feature1")} light />
                <PricingFeature text={t("landing.pricing.pro.feature2")} light />
                <PricingFeature text={t("landing.pricing.pro.feature3")} light />
                <PricingFeature text={t("landing.pricing.pro.feature4")} light />
                <PricingFeature text={t("landing.pricing.pro.feature5")} light />
              </ul>
              <Link
                href="/register?plan=pro"
                className="block w-full py-3 rounded-full text-center font-medium bg-white text-[var(--rowi-g1)] hover:bg-white/90 transition"
              >
                {t("landing.pricing.pro.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t("landing.cta.title")}
          </h2>
          <p className="text-xl text-[var(--rowi-muted)] mb-10">
            {t("landing.cta.subtitle")}
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-full text-xl font-semibold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            {t("landing.cta.button")}
            <Heart className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="py-12 px-6 border-t border-[var(--rowi-card-border)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] bg-clip-text text-transparent">
                Rowi SIA
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-[var(--rowi-muted)]">
              <a href="#" className="hover:text-[var(--rowi-fg)] transition">
                {t("landing.footer.terms")}
              </a>
              <a href="#" className="hover:text-[var(--rowi-fg)] transition">
                {t("landing.footer.privacy")}
              </a>
              <a href="#" className="hover:text-[var(--rowi-fg)] transition">
                {t("landing.footer.contact")}
              </a>
            </div>

            <div className="text-sm text-[var(--rowi-muted)]">
              © {new Date().getFullYear()} {t("landing.footer.copyright")}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   🎨 DynamicSection — Renderiza sección desde CMS
========================================================= */
function DynamicSection({
  section,
  lang,
  session
}: {
  section: LandingSection;
  lang: string;
  session: any;
}) {
  const content = section.content[lang] || section.content["es"] || {};
  const config = section.config || {};

  switch (section.type) {
    case "NAVBAR":
      return <CMSNavbar content={content} config={config} session={session} />;
    case "HERO":
      return <CMSHero content={content} config={config} />;
    case "FEATURES":
      return <CMSFeatures content={content} config={config} />;
    case "HOW_IT_WORKS":
      return <CMSHowItWorks content={content} config={config} />;
    case "TESTIMONIALS":
      return <CMSTestimonials content={content} config={config} />;
    case "PRICING":
      return <CMSPricing content={content} config={config} />;
    case "CTA":
      return <CMSCTA content={content} config={config} />;
    case "FOOTER":
      return <CMSFooter content={content} config={config} />;
    default:
      return null;
  }
}

/* =========================================================
   📦 CMS Section Components
========================================================= */

function CMSNavbar({ content, config, session }: { content: any; config: any; session: any }) {
  return (
    <nav className={`${config.fixed ? 'fixed' : 'relative'} top-0 left-0 right-0 z-50 ${config.blur ? 'backdrop-blur-xl' : ''} bg-[var(--rowi-bg)]/80 border-b border-[var(--rowi-card-border)]`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] bg-clip-text text-transparent">
            {content.brand || "Rowi"}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm">
          {content.links?.map((link: any, i: number) => (
            <a key={i} href={link.href} className="text-[var(--rowi-muted)] hover:text-[var(--rowi-fg)] transition">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/dashboard" className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white shadow-lg">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className="px-4 py-2 rounded-full text-sm font-medium text-[var(--rowi-muted)] hover:text-[var(--rowi-fg)]">
                {content.loginText || "Login"}
              </Link>
              <Link href="/register" className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white shadow-lg">
                {content.ctaText || "Get Started"}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function CMSHero({ content, config }: { content: any; config: any }) {
  return (
    <section className="relative pt-32 pb-20 px-6">
      {config.gradient && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[var(--rowi-g1)]/20 via-[var(--rowi-g2)]/20 to-[var(--rowi-g3)]/20 blur-3xl" />
        </div>
      )}

      <div className="max-w-5xl mx-auto text-center">
        {config.showBadge && content.badge && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--rowi-chip)] text-sm mb-8">
            <Sparkles className="w-4 h-4 text-[var(--rowi-g1)]" />
            <span>{content.badge}</span>
          </motion.div>
        )}

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          {content.title1}{" "}
          <span className="bg-gradient-to-r from-[var(--rowi-g1)] via-[var(--rowi-g3)] to-[var(--rowi-g2)] bg-clip-text text-transparent">
            {content.title2}
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl md:text-2xl text-[var(--rowi-muted)] max-w-3xl mx-auto mb-10">
          {content.subtitle}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="group inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-semibold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white shadow-xl hover:scale-105 transition-all">
            {content.ctaPrimary}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          {content.ctaSecondary && (
            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-medium border-2 border-[var(--rowi-card-border)] hover:border-[var(--rowi-g2)] transition-colors">
              <Play className="w-5 h-5 text-[var(--rowi-g2)]" />
              {content.ctaSecondary}
            </button>
          )}
        </motion.div>

        {config.showTrustBadges && content.trustBadges && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-[var(--rowi-muted)]">
            {content.trustBadges.map((badge: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                {ICON_MAP[badge.icon] || <CheckCircle className="w-5 h-5" />}
                <span>{badge.text}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function CMSFeatures({ content, config }: { content: any; config: any }) {
  const cols = config.columns || 3;
  return (
    <section id="features" className="py-24 px-6 bg-[var(--rowi-card)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {content.title1}{" "}
            <span className="bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] bg-clip-text text-transparent">
              {content.title2}
            </span>
          </h2>
          <p className="text-xl text-[var(--rowi-muted)] max-w-2xl mx-auto">{content.subtitle}</p>
        </div>

        <div className={`grid md:grid-cols-2 lg:grid-cols-${cols} gap-6`}>
          {content.features?.map((feature: any, i: number) => (
            <FeatureCard
              key={i}
              icon={ICON_MAP[feature.icon] || <Sparkles className="w-6 h-6" />}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient || "from-[var(--rowi-g1)] to-[var(--rowi-g2)]"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CMSHowItWorks({ content, config }: { content: any; config: any }) {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{content.title}</h2>
          <p className="text-xl text-[var(--rowi-muted)]">{content.subtitle}</p>
        </div>

        <div className={`grid md:grid-cols-${config.columns || 3} gap-8`}>
          {content.steps?.map((step: any, i: number) => (
            <StepCard key={i} number={step.number} title={step.title} description={step.description} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CMSTestimonials({ content, config }: { content: any; config: any }) {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-[var(--rowi-g1)]/10 via-transparent to-[var(--rowi-g2)]/10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{content.title}</h2>
        </div>

        <div className={`grid md:grid-cols-${config.columns || 3} gap-6`}>
          {content.testimonials?.map((t: any, i: number) => (
            <TestimonialCard key={i} quote={t.quote} author={t.author} role={t.role} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CMSPricing({ content, config }: { content: any; config: any }) {
  return (
    <section id="pricing" className="py-24 px-6 bg-[var(--rowi-card)]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">{content.title}</h2>
        <p className="text-xl text-[var(--rowi-muted)] mb-12">{content.subtitle}</p>

        <div className={`grid md:grid-cols-${content.plans?.length || 2} gap-8 max-w-3xl mx-auto`}>
          {content.plans?.map((plan: any, i: number) => (
            <div key={i} className={`p-8 rounded-2xl ${plan.highlighted ? 'bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white relative' : 'border-2 border-[var(--rowi-card-border)] bg-[var(--rowi-bg)]'}`}>
              {plan.badge && plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-[var(--rowi-g1)] text-sm font-medium">
                  {plan.badge}
                </div>
              )}
              <div className={`text-sm font-medium ${plan.highlighted ? 'text-white/80' : 'text-[var(--rowi-muted)]'} mb-2`}>
                {plan.name}
              </div>
              <div className="text-4xl font-bold mb-6">
                {plan.price}
                <span className={`text-lg font-normal ${plan.highlighted ? 'text-white/80' : 'text-[var(--rowi-muted)]'}`}>
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-3 text-left mb-8">
                {plan.features?.map((f: string, j: number) => (
                  <PricingFeature key={j} text={f} light={plan.highlighted} />
                ))}
              </ul>
              <Link
                href={plan.highlighted ? "/register?plan=pro" : "/register"}
                className={`block w-full py-3 rounded-full text-center font-medium ${plan.highlighted ? 'bg-white text-[var(--rowi-g1)]' : 'border-2 border-[var(--rowi-card-border)] hover:border-[var(--rowi-g2)]'} transition`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CMSCTA({ content, config }: { content: any; config: any }) {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">{content.title}</h2>
        <p className="text-xl text-[var(--rowi-muted)] mb-10">{content.subtitle}</p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-10 py-5 rounded-full text-xl font-semibold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105"
        >
          {content.buttonText}
          {ICON_MAP[content.buttonIcon] || <Heart className="w-6 h-6" />}
        </Link>
      </div>
    </section>
  );
}

function CMSFooter({ content, config }: { content: any; config: any }) {
  return (
    <footer className="py-12 px-6 border-t border-[var(--rowi-card-border)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] bg-clip-text text-transparent">
              {content.brand || "Rowi"}
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-[var(--rowi-muted)]">
            {content.links?.map((link: any, i: number) => (
              <a key={i} href={link.href} className="hover:text-[var(--rowi-fg)] transition">
                {link.label}
              </a>
            ))}
          </div>

          <div className="text-sm text-[var(--rowi-muted)]">
            © {new Date().getFullYear()} {content.copyright}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================
   🧩 Shared Components
========================================================= */

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group p-6 rounded-2xl bg-[var(--rowi-bg)] border border-[var(--rowi-card-border)] hover:border-transparent hover:shadow-xl transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-[var(--rowi-muted)]">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-[var(--rowi-muted)]">{description}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-[var(--rowi-card)] border border-[var(--rowi-card-border)]">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        ))}
      </div>
      <p className="text-[var(--rowi-muted)] mb-4 italic">&ldquo;{quote}&rdquo;</p>
      <div>
        <div className="font-semibold">{author}</div>
        <div className="text-sm text-[var(--rowi-muted)]">{role}</div>
      </div>
    </div>
  );
}

function PricingFeature({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${light ? "text-white" : "text-green-500"}`} />
      <span className={light ? "text-white/90" : ""}>{text}</span>
    </li>
  );
}
