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
  const { lang } = useI18n();
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
          badge: lang === "en" ? "🔌 Integrations" : "🔌 Integraciones",
          title1: lang === "en" ? "Connect Rowi with" : "Conecta Rowi con",
          title2: lang === "en" ? "your tools" : "tus herramientas",
          subtitle: lang === "en"
            ? "Integrate emotional intelligence into your daily workflow. Slack, Teams, calendars and more."
            : "Integra la inteligencia emocional en tu flujo de trabajo diario. Slack, Teams, calendarios y más.",
          ctaPrimary: lang === "en" ? "View integrations" : "Ver integraciones",
          ctaPrimaryHref: "/contact",
          image: "/rowivectors/Rowi-06.png",
        }}
        config={{ layout: "split", showBadge: true, gradient: true }}
      />

      <FeaturesSection
        content={{
          title1: lang === "en" ? "Available" : "Integraciones",
          title2: lang === "en" ? "integrations" : "disponibles",
          subtitle: lang === "en" ? "Rowi where you need it" : "Rowi donde lo necesites",
          features: [
            {
              icon: "message-circle",
              title: "Slack",
              description: lang === "en"
                ? "Receive EI reminders and tips directly in your workspace"
                : "Recibe recordatorios y tips de IE directamente en tu workspace",
              gradient: "from-purple-500 to-violet-500"
            },
            {
              icon: "users",
              title: "Microsoft Teams",
              description: lang === "en"
                ? "Native integration for teams using the Microsoft ecosystem"
                : "Integración nativa para equipos que usan el ecosistema Microsoft",
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              icon: "zap",
              title: "Zapier",
              description: lang === "en"
                ? "Connect Rowi with 5,000+ apps without code"
                : "Conecta Rowi con más de 5,000 aplicaciones sin código",
              gradient: "from-orange-500 to-amber-500"
            },
            {
              icon: "bar-chart",
              title: "Google Workspace",
              description: lang === "en"
                ? "Sync with Calendar, Meet and more Google tools"
                : "Sincroniza con Calendar, Meet y más herramientas de Google",
              gradient: "from-green-500 to-emerald-500"
            },
            {
              icon: "shield",
              title: "REST API",
              description: lang === "en"
                ? "Custom integration for specific needs"
                : "Integración personalizada para necesidades específicas",
              gradient: "from-pink-500 to-rose-500"
            },
            {
              icon: "globe",
              title: "Webhooks",
              description: lang === "en"
                ? "Receive real-time notifications of important events"
                : "Recibe notificaciones en tiempo real de eventos importantes",
              gradient: "from-indigo-500 to-blue-500"
            },
          ],
        }}
        config={{ columns: 3, showIcons: true }}
      />

      <CTASection
        content={{
          title: lang === "en" ? "Need a specific integration?" : "¿Necesitas una integración específica?",
          subtitle: lang === "en"
            ? "Contact us and let's discuss how to connect Rowi with your existing systems."
            : "Contáctanos y conversemos sobre cómo conectar Rowi con tus sistemas existentes.",
          buttonText: lang === "en" ? "Contact team" : "Contactar equipo",
          buttonIcon: "zap",
        }}
        config={{ gradient: true }}
      />
    </div>
  );
}
