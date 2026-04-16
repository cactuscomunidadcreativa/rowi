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
  const { lang } = useI18n();
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
          badge: lang !== "es" ? "🏢 For Business" : "🏢 Para empresas",
          title1: lang !== "es" ? "Emotional intelligence" : "Inteligencia emocional",
          title2: lang !== "es" ? "for your organization" : "para tu organización",
          subtitle: lang === "en"
            ? "Boost your team's wellbeing and performance with data-driven emotional development tools."
            : "Potencia el bienestar y rendimiento de tu equipo con herramientas de desarrollo emocional basadas en datos.",
          ctaPrimary: lang !== "es" ? "Request demo" : "Solicitar demo",
          ctaSecondary: lang !== "es" ? "See success stories" : "Ver casos de éxito",
          image: "/rowivectors/Rowi-06.png",
        }}
        config={{ layout: "split", showBadge: true, gradient: true }}
      />

      <StatsSection
        content={{
          stats: [
            { value: "32", suffix: "%", label: lang !== "es" ? "Communication improvement" : "Mejora en comunicación" },
            { value: "45", suffix: "%", label: lang !== "es" ? "Conflict reduction" : "Reducción de conflictos" },
            { value: "28", suffix: "%", label: lang !== "es" ? "Productivity increase" : "Aumento de productividad" },
            { value: "3", suffix: "x", label: lang !== "es" ? "Average ROI" : "ROI promedio" },
          ],
        }}
        config={{ layout: "gradient", columns: 4 }}
      />

      <FeaturesSection
        content={{
          title1: lang !== "es" ? "B2B" : "Soluciones",
          title2: lang !== "es" ? "Solutions" : "B2B",
          subtitle: lang === "en"
            ? "Enterprise tools for organizations of any size"
            : "Herramientas enterprise para organizaciones de cualquier tamaño",
          features: [
            {
              icon: "users",
              title: lang !== "es" ? "Team Assessments" : "Evaluaciones de Equipo",
              description: lang === "en"
                ? "Map your organization's emotional intelligence with group SEI assessments"
                : "Mapea la inteligencia emocional de tu organización con evaluaciones SEI grupales",
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              icon: "bar-chart",
              title: lang !== "es" ? "Advanced Analytics" : "Analytics Avanzados",
              description: lang === "en"
                ? "Executive dashboards with real-time EI metrics"
                : "Dashboards ejecutivos con métricas de IE en tiempo real",
              gradient: "from-purple-500 to-violet-500"
            },
            {
              icon: "heart",
              title: lang !== "es" ? "Team Affinity" : "Team Affinity",
              description: lang === "en"
                ? "Optimize team composition by emotional affinity"
                : "Optimiza la composición de equipos por afinidad emocional",
              gradient: "from-pink-500 to-rose-500"
            },
            {
              icon: "shield",
              title: lang !== "es" ? "SSO & Security" : "SSO & Seguridad",
              description: lang === "en"
                ? "Enterprise integration with the highest security standards"
                : "Integración empresarial con los más altos estándares de seguridad",
              gradient: "from-green-500 to-emerald-500"
            },
            {
              icon: "sparkles",
              title: lang !== "es" ? "Corporate Rowi" : "Rowi Corporativo",
              description: lang === "en"
                ? "Personalized AI coach for every member of your organization"
                : "Coach IA personalizado para cada colaborador de tu organización",
              gradient: "from-orange-500 to-amber-500"
            },
            {
              icon: "zap",
              title: lang !== "es" ? "API & Integrations" : "API & Integraciones",
              description: lang === "en"
                ? "Connect with Slack, Teams, HRIS and more existing tools"
                : "Conecta con Slack, Teams, HRIS y más herramientas existentes",
              gradient: "from-indigo-500 to-blue-500"
            },
          ],
        }}
        config={{ columns: 3, showIcons: true }}
      />

      <TestimonialsSection
        content={{
          title: lang !== "es" ? "Companies that trust Rowi" : "Empresas que confían en Rowi",
          testimonials: [
            {
              quote: lang === "en"
                ? "Rowi transformed our team dynamics. Productivity increased and conflicts decreased significantly."
                : "Rowi transformó la dinámica de nuestros equipos. La productividad aumentó y los conflictos disminuyeron notablemente.",
              author: "María González",
              role: "VP de People",
              company: "TechCorp",
              rating: 5
            },
            {
              quote: lang === "en"
                ? "The ROI was evident in the first 3 months. Our leaders now have concrete tools to manage teams."
                : "El ROI fue evidente en los primeros 3 meses. Nuestros líderes ahora tienen herramientas concretas para gestionar equipos.",
              author: "Carlos Ruiz",
              role: "CEO",
              company: "Innovatech",
              rating: 5
            },
            {
              quote: lang === "en"
                ? "Integration was simple and support exceptional. I recommend Rowi to any organization serious about wellbeing."
                : "La integración fue sencilla y el soporte excepcional. Recomiendo Rowi a cualquier organización seria sobre bienestar.",
              author: "Ana Martínez",
              role: "CHRO",
              company: "Global Solutions",
              rating: 5
            },
          ],
        }}
        config={{ columns: 3, showRating: true }}
      />

      <CTASection
        content={{
          title: lang !== "es" ? "Ready to transform your organization?" : "¿Listo para transformar tu organización?",
          subtitle: lang === "en"
            ? "Schedule a personalized demo and discover how Rowi can help your team."
            : "Agenda una demo personalizada y descubre cómo Rowi puede ayudar a tu equipo.",
          buttonText: lang !== "es" ? "Request demo" : "Solicitar demo",
          buttonIcon: "rocket",
          secondaryButtonText: lang !== "es" ? "Download brochure" : "Descargar brochure",
        }}
        config={{ gradient: true }}
      />
    </div>
  );
}
