"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  PricingSection,
  CTASection,
  StatsSection,
  FAQSection,
} from "./sections";
import RowiEvolution from "./RowiEvolution";

/**
 * 🎨 CMS Page Renderer
 * Renderiza secciones dinámicas cargadas desde el CMS
 * con soporte completo para i18n
 */

interface Section {
  id: string;
  type: string;
  order: number;
  config?: Record<string, any>;
  content: Record<string, any>;
}

interface CMSPageRendererProps {
  sections: Section[];
  pageType?: string;
}

export default function CMSPageRenderer({ sections, pageType }: CMSPageRendererProps) {
  const { lang } = useI18n();

  // Ordenar secciones por order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen">
      {sortedSections.map((section) => {
        // Obtener contenido en el idioma actual o fallback a español
        const content = section.content[lang] || section.content.es || section.content;
        const config = section.config || {};

        return (
          <div key={section.id} data-section-id={section.id} data-section-type={section.type}>
            {renderSection(section.type, content, config)}
          </div>
        );
      })}
    </div>
  );
}

function renderSection(type: string, content: any, config: any) {
  switch (type) {
    case "HERO":
      return <HeroSection content={content} config={config} />;

    case "FEATURES":
      return <FeaturesSection content={content} config={config} />;

    case "HOW_IT_WORKS":
      return <HowItWorksSection content={content} config={config} />;

    case "TESTIMONIALS":
      return <TestimonialsSection content={content} config={config} />;

    case "PRICING":
      return <PricingSection content={content} config={config} />;

    case "CTA":
      return <CTASection content={content} config={config} />;

    case "STATS":
      return <StatsSection content={content} config={config} />;

    case "FAQ":
      return <FAQSection content={content} config={config} />;

    case "EVOLUTION":
      return <RowiEvolution />;

    case "CUSTOM":
      // Para secciones personalizadas, renderizar HTML seguro
      return (
        <section className="py-20 px-4">
          <div
            className="max-w-7xl mx-auto prose prose-lg dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content.html || "" }}
          />
        </section>
      );

    default:
      // Sección desconocida - mostrar placeholder en dev
      if (process.env.NODE_ENV === "development") {
        return (
          <section className="py-10 px-4 bg-yellow-50 dark:bg-yellow-900/20">
            <div className="max-w-7xl mx-auto text-center">
              <p className="text-yellow-600 dark:text-yellow-400">
                ⚠️ Sección desconocida: {type}
              </p>
            </div>
          </section>
        );
      }
      return null;
  }
}
