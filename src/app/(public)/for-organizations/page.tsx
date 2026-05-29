"use client";

import { useEffect, useState } from "react";
import CMSPageRenderer from "@/components/public/CMSPageRenderer";
import { HeroSection, FeaturesSection, StatsSection, TestimonialsSection, CTASection } from "@/components/public/sections";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface Section {
  id: string;
  type: string;
  order: number;
  config?: Record<string, any>;
  content: Record<string, any>;
}

export default function ForOrganizationsPage() {
  const { t } = useI18n();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    async function loadSections() {
      try {
        const res = await fetch("/api/public/pages/for-organizations");
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--rowi-g2)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!useFallback && sections.length > 0) {
    return <CMSPageRenderer sections={sections} pageType="for-organizations" />;
  }

  return (
    <div className="min-h-screen pt-16">
      <HeroSection
        content={{
          badge: t("forOrg.hero.badge"),
          title1: t("forOrg.hero.title1"),
          title2: t("forOrg.hero.title2"),
          subtitle: t("forOrg.hero.subtitle"),
          ctaPrimary: t("forOrg.hero.cta.primary"),
          ctaSecondary: t("forOrg.hero.cta.secondary"),
          ctaSecondaryHref: "#cases",
          image: "/rowivectors/Rowi-06.png",
        }}
        config={{ layout: "split", showBadge: true, gradient: true }}
      />

      {/* Six Seconds case-study evidence — real, citable figures */}
      <StatsSection
        content={{
          title: t("forOrg.stats.title"),
          subtitle: t("forOrg.stats.subtitle"),
          stats: [
            { value: "22", suffix: "x", label: t("forOrg.stats.highPerf") },
            { value: "63", suffix: "%", label: t("forOrg.stats.turnover") },
            { value: "47", suffix: "%", label: t("forOrg.stats.managerial") },
            { value: "50", suffix: "+", label: t("forOrg.stats.cases") },
          ],
        }}
        config={{ layout: "gradient", columns: 4, animated: false }}
      />

      <FeaturesSection
        content={{
          title1: t("forOrg.features.title1"),
          title2: t("forOrg.features.title2"),
          subtitle: t("forOrg.features.subtitle"),
          features: [
            {
              icon: "users",
              title: t("forOrg.features.assessments.title"),
              description: t("forOrg.features.assessments.description"),
              gradient: "from-blue-500 to-cyan-500",
            },
            {
              icon: "bar-chart",
              title: t("forOrg.features.analytics.title"),
              description: t("forOrg.features.analytics.description"),
              gradient: "from-purple-500 to-violet-500",
            },
            {
              icon: "heart",
              title: t("forOrg.features.affinity.title"),
              description: t("forOrg.features.affinity.description"),
              gradient: "from-pink-500 to-rose-500",
            },
            {
              icon: "shield",
              title: t("forOrg.features.security.title"),
              description: t("forOrg.features.security.description"),
              gradient: "from-green-500 to-emerald-500",
            },
            {
              icon: "sparkles",
              title: t("forOrg.features.corporate.title"),
              description: t("forOrg.features.corporate.description"),
              gradient: "from-orange-500 to-amber-500",
            },
            {
              icon: "zap",
              title: t("forOrg.features.api.title"),
              description: t("forOrg.features.api.description"),
              gradient: "from-indigo-500 to-blue-500",
            },
          ],
        }}
        config={{ columns: 3, showIcons: true }}
      />

      {/* Social proof — Six Seconds case studies (not invented companies) */}
      <div id="cases">
        <TestimonialsSection
          content={{
            title: t("forOrg.social.title"),
            subtitle: t("forOrg.social.subtitle"),
            testimonials: [
              { quote: t("forOrg.social.1.quote"), author: t("forOrg.social.1.author"), role: t("forOrg.social.1.role") },
              { quote: t("forOrg.social.2.quote"), author: t("forOrg.social.2.author"), role: t("forOrg.social.2.role") },
              { quote: t("forOrg.social.3.quote"), author: t("forOrg.social.3.author"), role: t("forOrg.social.3.role") },
            ],
          }}
          config={{ columns: 3 }}
        />
      </div>

      <CTASection
        content={{
          title: t("forOrg.cta.title"),
          subtitle: t("forOrg.cta.subtitle"),
          buttonText: t("forOrg.cta.button"),
          buttonIcon: "rocket",
        }}
        config={{ gradient: true }}
      />
    </div>
  );
}
