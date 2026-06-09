"use client";

import { useEffect, useState } from "react";
import CMSPageRenderer from "@/components/public/CMSPageRenderer";
import { HeroSection, FeaturesSection, TestimonialsSection, CTASection } from "@/components/public/sections";
import RowiEvolution from "@/components/public/RowiEvolution";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function ForYouPage() {
  const { t } = useI18n();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    fetch("/api/public/pages/for-you")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.sections?.length > 0) setSections(data.sections);
        else setUseFallback(true);
      })
      .catch(() => setUseFallback(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--rowi-g2)] border-t-transparent rounded-full animate-spin" /></div>;
  if (!useFallback && sections.length > 0) return <CMSPageRenderer sections={sections} pageType="for-you" />;

  return (
    <div className="min-h-screen pt-16">
      <HeroSection
        content={{
          badge: t("forYou.hero.badge", "👤 Para ti"),
          title1: t("forYou.hero.title1", "Tu espacio de"),
          title2: t("forYou.hero.title2", "crecimiento personal"),
          subtitle: t("forYou.hero.subtitle", "Un lugar seguro donde explorar tus emociones, desarrollar tu potencial y conectar con personas afines."),
          ctaPrimary: t("forYou.hero.ctaPrimary", "Comenzar gratis"),
          ctaSecondary: t("forYou.hero.ctaSecondary", "Ver planes"),
          ctaSecondaryHref: "/pricing",
          image: "/rowivectors/Rowi-06.webp"
        }}
        config={{ layout: "split", showBadge: true, gradient: true }}
      />
      <RowiEvolution />
      <FeaturesSection
        content={{
          title1: t("forYou.features.title1", "La Experiencia"),
          title2: t("forYou.features.title2", "Completa"),
          subtitle: t("forYou.features.subtitle", "Todo lo que necesitas para tu desarrollo emocional"),
          features: [
            {
              icon: "sparkles",
              title: t("forYou.features.personalRowi.title", "Rowi Personal"),
              description: t("forYou.features.personalRowi.desc", "Tu coach de IA que te conoce y te acompaña en tu viaje"),
              gradient: "from-pink-500 to-rose-500"
            },
            {
              icon: "heart",
              title: t("forYou.features.matches.title", "Matches Emocionales"),
              description: t("forYou.features.matches.desc", "Conecta con personas que vibran en tu misma frecuencia"),
              gradient: "from-purple-500 to-violet-500"
            },
            {
              icon: "bar-chart",
              title: t("forYou.features.dashboard.title", "Tu Dashboard"),
              description: t("forYou.features.dashboard.desc", "Visualiza tu progreso y celebra tus logros"),
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              icon: "target",
              title: t("forYou.features.goals.title", "Metas Personales"),
              description: t("forYou.features.goals.desc", "Define y alcanza objetivos de desarrollo emocional"),
              gradient: "from-green-500 to-emerald-500"
            },
            {
              icon: "users",
              title: t("forYou.features.communities.title", "Comunidades"),
              description: t("forYou.features.communities.desc", "Únete a grupos de interés y crecimiento conjunto"),
              gradient: "from-orange-500 to-amber-500"
            },
            {
              icon: "star",
              title: t("forYou.features.becoming.title", "Tu evolución"),
              description: t("forYou.features.becoming.desc", "Observa a tu Rowi evolucionar mientras creces"),
              gradient: "from-indigo-500 to-blue-500"
            },
          ]
        }}
        config={{ columns: 3, showIcons: true }}
      />
      <TestimonialsSection
        content={{
          title: t("forYou.testimonials.title", "Lo que dicen nuestros usuarios"),
          testimonials: [
            {
              quote: t("forYou.testimonials.t1.quote", "Rowi me ha ayudado a entender mejor mis emociones y a comunicarme de manera más efectiva."),
              author: "María García",
              role: t("forYou.testimonials.t1.role", "Diseñadora"),
              rating: 5
            },
            {
              quote: t("forYou.testimonials.t2.quote", "Ver a mi Rowi evolucionar hace que mi crecimiento personal sea motivador. ¡Mi Rowi ya es un joven!"),
              author: "Carlos López",
              role: t("forYou.testimonials.t2.role", "Desarrollador"),
              rating: 5
            },
            {
              quote: t("forYou.testimonials.t3.quote", "Los matches emocionales me conectaron con personas increíbles que ahora son amigos cercanos."),
              author: "Ana Martínez",
              role: t("forYou.testimonials.t3.role", "Emprendedora"),
              rating: 5
            },
          ]
        }}
        config={{ columns: 3, showRating: true }}
      />
      <CTASection
        content={{
          title: t("forYou.cta.title", "Comienza tu viaje hoy"),
          subtitle: t("forYou.cta.subtitle", "Es gratis y solo toma 2 minutos crear tu cuenta."),
          buttonText: t("forYou.cta.button", "Conocer a mi Rowi"),
          buttonIcon: "heart"
        }}
        config={{ gradient: true }}
      />
    </div>
  );
}
