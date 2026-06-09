"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import CMSPageRenderer from "@/components/public/CMSPageRenderer";
import { HeroSection, FeaturesSection, CTASection } from "@/components/public/sections";

interface Section {
  id: string;
  type: string;
  order: number;
  config?: Record<string, any>;
  content: Record<string, any>;
}

export default function ProductIntegrationsPage() {
  const { t } = useI18n();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    async function loadSections() {
      try {
        const res = await fetch("/api/public/pages/product-integrations");
        const data = await res.json();

        if (data.ok && data.sections?.length > 0) {
          setSections(data.sections);
        } else {
          setUseFallback(true);
        }
      } catch (error) {
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
    return <CMSPageRenderer sections={sections} pageType="product-integrations" />;
  }

  return (
    <div className="min-h-screen pt-16">
      <HeroSection
        content={{
          badge: t("productIntegrations.hero.badge", "🔌 Integraciones"),
          title1: t("productIntegrations.hero.title1", "Conecta Rowi con"),
          title2: t("productIntegrations.hero.title2", "tus herramientas"),
          subtitle: t(
            "productIntegrations.hero.subtitle",
            "Integra la inteligencia emocional en tu flujo de trabajo diario. Slack, Teams, calendarios y más."
          ),
          ctaPrimary: t("productIntegrations.hero.cta", "Ver integraciones"),
          ctaPrimaryHref: "/contact",
          image: "/rowivectors/Rowi-06.webp",
        }}
        config={{ layout: "split", showBadge: true, gradient: true }}
      />

      <FeaturesSection
        content={{
          title1: t("productIntegrations.features.title1", "Integraciones"),
          title2: t("productIntegrations.features.title2", "disponibles"),
          subtitle: t("productIntegrations.features.subtitle", "Rowi donde lo necesites"),
          features: [
            {
              icon: "message-circle",
              title: "Slack",
              description: t(
                "productIntegrations.features.slack",
                "Recibe recordatorios y tips de inteligencia emocional directamente en tu workspace"
              ),
              gradient: "from-purple-500 to-violet-500"
            },
            {
              icon: "users",
              title: "Microsoft Teams",
              description: t(
                "productIntegrations.features.teams",
                "Integración nativa para equipos que usan el ecosistema Microsoft"
              ),
              gradient: "from-violet-600 to-purple-500"
            },
            {
              icon: "zap",
              title: "Zapier",
              description: t(
                "productIntegrations.features.zapier",
                "Conecta Rowi con más de 5,000 aplicaciones sin código"
              ),
              gradient: "from-orange-500 to-amber-500"
            },
            {
              icon: "bar-chart",
              title: "Google Workspace",
              description: t(
                "productIntegrations.features.google",
                "Sincroniza con Calendar, Meet y más herramientas de Google"
              ),
              gradient: "from-green-500 to-emerald-500"
            },
            {
              icon: "shield",
              title: "REST API",
              description: t(
                "productIntegrations.features.api",
                "Integración personalizada para necesidades específicas"
              ),
              gradient: "from-pink-500 to-rose-500"
            },
            {
              icon: "globe",
              title: "Webhooks",
              description: t(
                "productIntegrations.features.webhooks",
                "Recibe notificaciones en tiempo real de eventos importantes"
              ),
              gradient: "from-violet-500 to-purple-600"
            },
          ],
        }}
        config={{ columns: 3, showIcons: true }}
      />

      <CTASection
        content={{
          title: t("productIntegrations.cta.title", "¿Necesitas una integración específica?"),
          subtitle: t(
            "productIntegrations.cta.subtitle",
            "Contáctanos y conversemos sobre cómo conectar Rowi con tus sistemas existentes."
          ),
          buttonText: t("productIntegrations.cta.button", "Contactar equipo"),
          buttonIcon: "zap",
        }}
        config={{ gradient: true }}
      />
    </div>
  );
}
