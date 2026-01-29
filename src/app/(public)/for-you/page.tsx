"use client";

import { useEffect, useState } from "react";
import CMSPageRenderer from "@/components/public/CMSPageRenderer";
import { HeroSection, FeaturesSection, TestimonialsSection, CTASection } from "@/components/public/sections";
import RowiEvolution from "@/components/public/RowiEvolution";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function ForYouPage() {
  const { t, lang } = useI18n();
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
          badge: lang === "en" ? "👤 For You" : "👤 Para ti",
          title1: lang === "en" ? "Your space for" : "Tu espacio de",
          title2: lang === "en" ? "personal growth" : "crecimiento personal",
          subtitle: lang === "en"
            ? "A safe place to explore your emotions, develop your potential and connect with like-minded people."
            : "Un lugar seguro donde explorar tus emociones, desarrollar tu potencial y conectar con personas afines.",
          ctaPrimary: lang === "en" ? "Start free" : "Comenzar gratis",
          ctaSecondary: lang === "en" ? "See plans" : "Ver planes",
          ctaSecondaryHref: "/pricing",
          image: "/rowivectors/Rowi-06.png"
        }}
        config={{ layout: "split", showBadge: true, gradient: true }}
      />
      <RowiEvolution />
      <FeaturesSection
        content={{
          title1: lang === "en" ? "The Complete" : "La Experiencia",
          title2: lang === "en" ? "Experience" : "Completa",
          subtitle: lang === "en"
            ? "Everything you need for your emotional development"
            : "Todo lo que necesitas para tu desarrollo emocional",
          features: [
            {
              icon: "sparkles",
              title: lang === "en" ? "Personal Rowi" : "Rowi Personal",
              description: lang === "en"
                ? "Your AI coach that knows you and accompanies you on your journey"
                : "Tu coach de IA que te conoce y te acompaña en tu viaje",
              gradient: "from-pink-500 to-rose-500"
            },
            {
              icon: "heart",
              title: lang === "en" ? "Emotional Matches" : "Matches Emocionales",
              description: lang === "en"
                ? "Connect with people who vibrate on your same frequency"
                : "Conecta con personas que vibran en tu misma frecuencia",
              gradient: "from-purple-500 to-violet-500"
            },
            {
              icon: "bar-chart",
              title: lang === "en" ? "Your Dashboard" : "Tu Dashboard",
              description: lang === "en"
                ? "Visualize your progress and celebrate your achievements"
                : "Visualiza tu progreso y celebra tus logros",
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              icon: "target",
              title: lang === "en" ? "Personal Goals" : "Metas Personales",
              description: lang === "en"
                ? "Define and achieve emotional development objectives"
                : "Define y alcanza objetivos de desarrollo emocional",
              gradient: "from-green-500 to-emerald-500"
            },
            {
              icon: "users",
              title: lang === "en" ? "Communities" : "Comunidades",
              description: lang === "en"
                ? "Join interest groups and grow together"
                : "Únete a grupos de interés y crecimiento conjunto",
              gradient: "from-orange-500 to-amber-500"
            },
            {
              icon: "star",
              title: lang === "en" ? "Gamification" : "Gamificación",
              description: lang === "en"
                ? "Watch your Rowi evolve as you grow"
                : "Observa a tu Rowi evolucionar mientras creces",
              gradient: "from-indigo-500 to-blue-500"
            },
          ]
        }}
        config={{ columns: 3, showIcons: true }}
      />
      <TestimonialsSection
        content={{
          title: lang === "en" ? "What our users say" : "Lo que dicen nuestros usuarios",
          testimonials: [
            {
              quote: lang === "en"
                ? "Rowi has helped me better understand my emotions and communicate more effectively."
                : "Rowi me ha ayudado a entender mejor mis emociones y a comunicarme de manera más efectiva.",
              author: "María García",
              role: lang === "en" ? "Designer" : "Diseñadora",
              rating: 5
            },
            {
              quote: lang === "en"
                ? "Gamification makes personal development fun. My Rowi is already a young one!"
                : "La gamificación hace que el desarrollo personal sea divertido. ¡Mi Rowi ya es un joven!",
              author: "Carlos López",
              role: lang === "en" ? "Developer" : "Desarrollador",
              rating: 5
            },
            {
              quote: lang === "en"
                ? "Emotional matches connected me with amazing people who are now close friends."
                : "Los matches emocionales me conectaron con personas increíbles que ahora son amigos cercanos.",
              author: "Ana Martínez",
              role: lang === "en" ? "Entrepreneur" : "Emprendedora",
              rating: 5
            },
          ]
        }}
        config={{ columns: 3, showRating: true }}
      />
      <CTASection
        content={{
          title: lang === "en" ? "Start your journey today" : "Comienza tu viaje hoy",
          subtitle: lang === "en"
            ? "It's free and only takes 2 minutes to create your account."
            : "Es gratis y solo toma 2 minutos crear tu cuenta.",
          buttonText: lang === "en" ? "Meet my Rowi" : "Conocer a mi Rowi",
          buttonIcon: "heart"
        }}
        config={{ gradient: true }}
      />
    </div>
  );
}
