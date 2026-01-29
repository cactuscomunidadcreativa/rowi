"use client";
import { HeroSection, FeaturesSection, CTASection } from "@/components/public/sections";
import RowiEvolution from "@/components/public/RowiEvolution";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function ProductRowiPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen pt-16">
      <HeroSection
        content={{
          badge: t("product.rowi.badge", "🦉 Conoce a Rowi"),
          title1: t("product.rowi.title1", "Tu coach de"),
          title2: t("product.rowi.title2", "inteligencia emocional"),
          subtitle: t("product.rowi.subtitle", "Rowi es una IA conversacional diseñada para ayudarte a desarrollar tu inteligencia emocional a través de conversaciones profundas y significativas."),
          ctaPrimary: t("product.rowi.cta", "Conocer a mi Rowi"),
          image: "/rowivectors/Rowi-06.png"
        }}
        config={{ layout: "split", showBadge: true, gradient: true }}
      />
      <RowiEvolution />
      <FeaturesSection
        content={{
          title1: t("product.rowi.features.title1", "Capacidades"),
          title2: t("product.rowi.features.title2", "de Rowi"),
          subtitle: t("product.rowi.features.subtitle", "Un compañero que crece contigo"),
          features: [
            { icon: "brain", title: t("product.rowi.feature1.title", "Comprensión emocional"), description: t("product.rowi.feature1.desc", "Rowi entiende el contexto emocional de tus palabras") },
            { icon: "heart", title: t("product.rowi.feature2.title", "Empatía genuina"), description: t("product.rowi.feature2.desc", "Respuestas que reflejan comprensión real de tus sentimientos") },
            { icon: "sparkles", title: t("product.rowi.feature3.title", "Consejos personalizados"), description: t("product.rowi.feature3.desc", "Recomendaciones basadas en tu perfil SEI") },
            { icon: "trending-up", title: t("product.rowi.feature4.title", "Seguimiento de progreso"), description: t("product.rowi.feature4.desc", "Observa tu crecimiento emocional en el tiempo") },
            { icon: "shield", title: t("product.rowi.feature5.title", "Espacio seguro"), description: t("product.rowi.feature5.desc", "Conversaciones 100% privadas y confidenciales") },
            { icon: "zap", title: t("product.rowi.feature6.title", "Disponible 24/7"), description: t("product.rowi.feature6.desc", "Tu coach siempre listo cuando lo necesites") },
          ]
        }}
        config={{ columns: 3, showIcons: true }}
      />
      <CTASection
        content={{
          title: t("product.rowi.cta.title", "Conoce a tu Rowi hoy"),
          subtitle: t("product.rowi.cta.subtitle", "Comienza tu viaje de desarrollo emocional."),
          buttonText: t("product.rowi.cta.button", "Crear mi cuenta gratis"),
          buttonIcon: "heart"
        }}
        config={{ gradient: true }}
      />
    </div>
  );
}
