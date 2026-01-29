"use client";

import { useEffect, useState } from "react";
import CMSPageRenderer from "@/components/public/CMSPageRenderer";
import { HeroSection, FeaturesSection, StatsSection, CTASection } from "@/components/public/sections";
import RowiEvolution from "@/components/public/RowiEvolution";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { useI18n } from "@/lib/i18n/useI18n";

/**
 * 🏠 Página de Inicio - Home
 * Nueva landing page con diseño estilo Rowi
 */

interface Section {
  id: string;
  type: string;
  order: number;
  config?: Record<string, any>;
  content: Record<string, any>;
}

export default function HomePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    async function loadSections() {
      try {
        const res = await fetch("/api/public/pages/home");
        const data = await res.json();

        if (data.ok && data.sections?.length > 0) {
          setSections(data.sections);
        } else {
          setUseFallback(true);
        }
      } catch (error) {
        console.error("Error loading page sections:", error);
        setUseFallback(true);
      } finally {
        setLoading(false);
      }
    }

    loadSections();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--rowi-background)]">
        <div className="w-16 h-16 border-4 border-[var(--rowi-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Si tenemos secciones del CMS, renderizarlas
  if (!useFallback && sections.length > 0) {
    return (
      <>
        <PublicNavbar />
        <main className="pt-16">
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
      <main className="pt-16 min-h-screen bg-[var(--rowi-background)]">
        {/* Hero */}
        <HeroSection
          content={{
            badge: t("landing.hero.badge"),
            title1: t("landing.hero.title1"),
            title2: t("landing.hero.title2"),
            subtitle: t("landing.hero.subtitle"),
            ctaPrimary: t("landing.hero.cta.primary"),
            ctaSecondary: t("landing.hero.cta.secondary"),
            trustBadges: [
              { icon: "shield", text: t("landing.hero.trust.security") },
              { icon: "globe", text: t("landing.hero.trust.methodology") },
              { icon: "star", text: t("landing.hero.trust.users") },
            ],
          }}
          config={{
            layout: "centered",
            showBadge: true,
            showTrustBadges: true,
            gradient: true,
          }}
        />

        {/* Stats */}
        <StatsSection
          content={{
            stats: [
              { value: "10,000", suffix: "+", label: t("landing.stats.activeUsers") },
              { value: "50,000", suffix: "+", label: t("landing.stats.conversations") },
              { value: "95", suffix: "%", label: t("landing.stats.satisfaction") },
              { value: "24", suffix: "/7", label: t("landing.stats.availability") },
            ],
          }}
          config={{ layout: "gradient", columns: 4 }}
        />

        {/* Evolution */}
        <RowiEvolution />

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
    </>
  );
}
