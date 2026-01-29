"use client";
import { HeroSection, FeaturesSection, CTASection } from "@/components/public/sections";

export default function ProductInsightsPage() {
  return (
    <div className="min-h-screen pt-16">
      <HeroSection
        content={{ badge: "📊 Insights", title1: "Datos que impulsan", title2: "tu crecimiento", subtitle: "Visualiza tu progreso emocional con métricas claras, tendencias y recomendaciones personalizadas basadas en ciencia.", ctaPrimary: "Ver mi progreso", image: "/owl.png" }}
        config={{ layout: "split", showBadge: true, gradient: true }}
      />
      <FeaturesSection
        content={{ title1: "Métricas", title2: "que importan", features: [
          { icon: "bar-chart", title: "Dashboard personal", description: "Visualiza tu EQ score y su evolución en el tiempo" },
          { icon: "trending-up", title: "Tendencias", description: "Identifica patrones en tu desarrollo emocional" },
          { icon: "target", title: "Objetivos claros", description: "Metas medibles basadas en tu perfil SEI" },
          { icon: "brain", title: "Recomendaciones IA", description: "Sugerencias personalizadas para mejorar áreas específicas" },
          { icon: "star", title: "Logros y badges", description: "Celebra tu progreso con recompensas visuales" },
          { icon: "zap", title: "Alertas inteligentes", description: "Notificaciones cuando detectamos oportunidades de mejora" },
        ]}}
        config={{ columns: 3, showIcons: true }}
      />
      <CTASection
        content={{ title: "Conoce tus métricas", subtitle: "El primer paso para mejorar es medir.", buttonText: "Ver mi dashboard", buttonIcon: "bar-chart" }}
        config={{ gradient: true }}
      />
    </div>
  );
}
