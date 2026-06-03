"use client";

import CMSPageRenderer from "@/components/public/CMSPageRenderer";
import {
  HeroSection,
  FeaturesSection,
  StatsSection,
  CTASection,
  HowItWorksSection,
  TestimonialsSection,
} from "@/components/public/sections";
import RowiEvolution from "@/components/public/RowiEvolution";
import PublicWorldMap from "@/components/public/PublicWorldMap";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import PainSection from "@/components/public/PainSection";
import UseCasesSection from "@/components/public/UseCasesSection";
import FloatingCTA from "@/components/public/FloatingCTA";
import { useI18n } from "@/lib/i18n/useI18n";

/**
 * 🏠 HomeClient — render del contenido de la home.
 *
 * Las secciones del CMS se resuelven AHORA en el servidor (ver page.tsx) y
 * llegan como props ya decididas. Este componente solo pinta: si hay
 * secciones CMS, las renderiza; si no, cae al contenido estático. Ya no hay
 * fetch ni spinner client-side — el HTML va completo en la respuesta inicial
 * (mejor SEO, mejor LCP).
 */

export interface Section {
  id: string;
  type: string;
  order: number;
  config?: Record<string, any>;
  content: Record<string, any>;
}

export default function HomeClient({ sections }: { sections: Section[] }) {
  // Si tenemos secciones del CMS, renderizarlas
  if (sections.length > 0) {
    return (
      <>
        <PublicNavbar />
        <main style={{ paddingTop: "calc(4rem + var(--banner-height, 0px))" }}>
          <CMSPageRenderer sections={sections} pageType="home" />
        </main>
        <PublicFooter />
      </>
    );
  }

  // Fallback con contenido estático
  return <FallbackHomePage />;
}

function FallbackHomePage() {
  const { t } = useI18n();

  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-[var(--rowi-bg,#f7f9fb)]" style={{ paddingTop: "calc(4rem + var(--banner-height, 0px))" }}>
        {/* Hero — sell transformation */}
        <HeroSection
          content={{
            badge: t("landing.hero.badge"),
            title1: t("landing.hero.title1"),
            title2: t("landing.hero.title2"),
            subtitle: t("landing.hero.subtitle"),
            ctaPrimary: t("landing.hero.cta.primary"),
            ctaSecondary: t("landing.hero.cta.secondary"),
            ctaSecondaryHref: "/demo",
            image: "/rowivectors/Rowi-06.webp",
            trustBadges: [
              { icon: "shield", text: t("landing.hero.trust.security") },
              { icon: "globe", text: t("landing.hero.trust.methodology") },
              { icon: "star", text: t("landing.hero.trust.users") },
            ],
          }}
          config={{
            layout: "split",
            showBadge: true,
            showTrustBadges: true,
            gradient: true,
          }}
        />

        {/* Problem before product */}
        <PainSection />

        {/* How it works — 5 steps */}
        <HowItWorksSection
          content={{
            title: t("landing.howItWorks.title"),
            subtitle: t("landing.howItWorks.subtitle"),
            steps: [
              { number: "1", title: t("landing.howItWorks.step1.title"), description: t("landing.howItWorks.step1.description") },
              { number: "2", title: t("landing.howItWorks.step2.title"), description: t("landing.howItWorks.step2.description") },
              { number: "3", title: t("landing.howItWorks.step3.title"), description: t("landing.howItWorks.step3.description") },
              { number: "4", title: t("landing.howItWorks.step4.title"), description: t("landing.howItWorks.step4.description") },
              { number: "5", title: t("landing.howItWorks.step5.title"), description: t("landing.howItWorks.step5.description") },
            ],
          }}
          config={{ layout: "timeline", showNumbers: true }}
        />

        {/* Features */}
        <FeaturesSection
          content={{
            title1: t("landing.features.title1"),
            title2: t("landing.features.title2"),
            subtitle: t("landing.features.subtitle"),
            features: [
              {
                icon: "sparkles",
                title: t("landing.features.coach.title"),
                description: t("landing.features.coach.description"),
                gradient: "from-pink-500 to-rose-500",
              },
              {
                icon: "brain",
                title: t("landing.features.sei.title"),
                description: t("landing.features.sei.description"),
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: "heart",
                title: t("landing.features.affinity.title"),
                description: t("landing.features.affinity.description"),
                gradient: "from-purple-500 to-violet-500",
              },
              {
                icon: "bar-chart",
                title: t("landing.features.dashboard.title"),
                description: t("landing.features.dashboard.description"),
                gradient: "from-green-500 to-emerald-500",
              },
              {
                icon: "users",
                title: t("landing.features.community.title"),
                description: t("landing.features.community.description"),
                gradient: "from-orange-500 to-amber-500",
              },
              {
                icon: "target",
                title: t("landing.features.goals.title"),
                description: t("landing.features.goals.description"),
                gradient: "from-indigo-500 to-blue-500",
              },
            ],
          }}
          config={{ columns: 3, showIcons: true }}
        />

        {/* Use cases — sense of momentum */}
        <UseCasesSection />

        {/* Global Map */}
        <PublicWorldMap />

        {/* Evolution */}
        <RowiEvolution />

        {/* Six Seconds reach — real, verifiable numbers */}
        <StatsSection
          content={{
            title: t("landing.stats.title"),
            subtitle: t("landing.stats.subtitle"),
            stats: [
              { value: "200", prefix: "+", label: t("landing.stats.countries") },
              { value: "500,000", prefix: "+", label: t("landing.stats.assessments") },
              { value: "27", label: t("landing.stats.languages") },
              { value: "1997", label: t("landing.stats.since") },
            ],
          }}
          config={{ layout: "gradient", columns: 4, animated: false }}
        />

        {/* Social proof — Six Seconds methodology */}
        <TestimonialsSection
          content={{
            title: t("landing.social.title"),
            subtitle: t("landing.social.subtitle"),
            testimonials: [
              { quote: t("landing.social.1.quote"), author: t("landing.social.1.author"), role: t("landing.social.1.role") },
              { quote: t("landing.social.2.quote"), author: t("landing.social.2.author"), role: t("landing.social.2.role") },
              { quote: t("landing.social.3.quote"), author: t("landing.social.3.author"), role: t("landing.social.3.role") },
            ],
          }}
          config={{ columns: 3 }}
        />

        {/* CTA */}
        <CTASection
          content={{
            title: t("landing.cta.title"),
            subtitle: t("landing.cta.subtitle"),
            buttonText: t("landing.cta.button"),
            buttonIcon: "heart",
          }}
          config={{ gradient: true }}
        />
      </main>
      <PublicFooter />
      <FloatingCTA />
    </>
  );
}
