"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Heart,
  MessageSquare,
  Bot,
  ArrowRight,
  Play,
  Sparkles,
  Brain,
  Users,
  TrendingUp,
  Building2,
  BarChart3,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Traducciones
========================================================= */
const translations = {
  es: {
    badge: "Tour Interactivo",
    title: "Explora Rowi",
    titleHighlight: "en acción",
    subtitle: "Descubre cómo Rowi puede ayudarte a desarrollar tu inteligencia emocional con datos de ejemplo reales.",
    startTour: "Comenzar tour",
    exploreModules: "Explorar módulos",

    // Módulos
    modulesTitle: "Módulos de la plataforma",
    modulesSubtitle: "Haz clic en cualquier módulo para ver una demostración interactiva",

    dashboard: {
      title: "Dashboard",
      desc: "Tu centro de control emocional con métricas SEI, competencias y evolución de tu Rowi.",
      features: ["Puntuación EQ total", "8 Competencias SEI", "Evolución del avatar"],
    },
    affinity: {
      title: "Affinity",
      desc: "Descubre tu compatibilidad emocional con otros miembros y mejora tus relaciones.",
      features: ["Compatibilidad emocional", "Estilos cerebrales", "Recomendaciones"],
    },
    eco: {
      title: "ECO",
      desc: "Optimiza tu comunicación emocional con mensajes adaptados a cada persona.",
      features: ["Comunicación adaptada", "Análisis de contexto", "Múltiples canales"],
    },
    coach: {
      title: "Rowi Coach",
      desc: "Tu coach de inteligencia emocional disponible 24/7 para guiarte en tu crecimiento.",
      features: ["Chat con IA", "Consejos personalizados", "Seguimiento continuo"],
    },
    tp: {
      title: "Benchmark TP",
      desc: "Demo real con 14,886 evaluaciones SEI de Teleperformance. Benchmarking corporativo en acción.",
      features: ["14,886 evaluaciones reales", "Insights por región y rol", "Perfiles cerebrales"],
    },

    viewDemo: "Ver demo",

    // CTA
    ctaTitle: "¿Te gustó lo que viste?",
    ctaSubtitle: "Crea tu cuenta gratis y comienza tu viaje hacia la inteligencia emocional.",
    ctaButton: "Crear cuenta gratis",
  },
  en: {
    badge: "Interactive Tour",
    title: "Explore Rowi",
    titleHighlight: "in action",
    subtitle: "Discover how Rowi can help you develop your emotional intelligence with real sample data.",
    startTour: "Start tour",
    exploreModules: "Explore modules",

    modulesTitle: "Platform modules",
    modulesSubtitle: "Click on any module to see an interactive demonstration",

    dashboard: {
      title: "Dashboard",
      desc: "Your emotional control center with SEI metrics, competencies and your Rowi's evolution.",
      features: ["Total EQ score", "8 SEI Competencies", "Avatar evolution"],
    },
    affinity: {
      title: "Affinity",
      desc: "Discover your emotional compatibility with other members and improve your relationships.",
      features: ["Emotional compatibility", "Brain styles", "Recommendations"],
    },
    eco: {
      title: "ECO",
      desc: "Optimize your emotional communication with messages adapted to each person.",
      features: ["Adapted communication", "Context analysis", "Multiple channels"],
    },
    coach: {
      title: "Rowi Coach",
      desc: "Your emotional intelligence coach available 24/7 to guide you in your growth.",
      features: ["AI Chat", "Personalized advice", "Continuous tracking"],
    },
    tp: {
      title: "TP Benchmark",
      desc: "Real demo with 14,886 SEI assessments from Teleperformance. Corporate benchmarking in action.",
      features: ["14,886 real assessments", "Insights by region & role", "Brain profiles"],
    },

    viewDemo: "View demo",

    ctaTitle: "Did you like what you saw?",
    ctaSubtitle: "Create your free account and start your journey towards emotional intelligence.",
    ctaButton: "Create free account",
  },
};

const modules = [
  {
    key: "dashboard",
    href: "/demo/dashboard",
    icon: LayoutDashboard,
    gradient: "from-violet-500 to-purple-600",
    image: "/rowivectors/Rowi-06.png",
  },
  {
    key: "affinity",
    href: "/demo/affinity",
    icon: Heart,
    gradient: "from-pink-500 to-rose-600",
    image: "/rowivectors/Rowi-05.png",
  },
  {
    key: "eco",
    href: "/demo/eco",
    icon: MessageSquare,
    gradient: "from-emerald-500 to-green-600",
    image: "/rowivectors/Rowi-04.png",
  },
  {
    key: "coach",
    href: "/demo/coach",
    icon: Bot,
    gradient: "from-blue-500 to-cyan-600",
    image: "/rowivectors/Rowi-03.png",
  },
  {
    key: "tp",
    href: "/hub/admin/tp",
    icon: BarChart3,
    gradient: "from-purple-600 to-pink-600",
    image: "/rowivectors/Rowi-01.png",
  },
];

export default function DemoPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  return (
    <div className="min-h-screen pt-16 bg-[var(--rowi-background)]">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full bg-gradient-to-br from-[var(--rowi-primary)]/20 via-purple-500/10 to-transparent blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--rowi-primary)]/20 to-purple-500/20 text-[var(--rowi-primary)] mb-6">
              <Play className="w-4 h-4" />
              {t.badge}
            </span>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t.title}{" "}
              <span className="bg-gradient-to-r from-[var(--rowi-primary)] to-purple-500 bg-clip-text text-transparent">
                {t.titleHighlight}
              </span>
            </h1>

            <p className="text-xl text-[var(--rowi-muted)] mb-8 max-w-2xl mx-auto">
              {t.subtitle}
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/demo/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--rowi-primary)] to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
              >
                {t.startTour}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#modules"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium"
              >
                {t.exploreModules}
              </a>
            </div>
          </motion.div>

          {/* Floating Rowi Images */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative h-48 mt-12"
          >
            {modules.map((mod, i) => (
              <motion.div
                key={mod.key}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute"
                style={{
                  left: `${15 + i * 22}%`,
                  top: i % 2 === 0 ? "10%" : "30%",
                }}
              >
                <div className="relative w-24 h-24">
                  <Image
                    src={mod.image}
                    alt={mod.key}
                    fill
                    className="object-contain drop-shadow-xl"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-20 px-4 bg-[var(--rowi-card)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              {t.modulesTitle}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-[var(--rowi-muted)]"
            >
              {t.modulesSubtitle}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {modules.map((mod, i) => {
              const moduleT = t[mod.key as keyof typeof t] as {
                title: string;
                desc: string;
                features: string[];
              };
              const Icon = mod.icon;

              return (
                <motion.div
                  key={mod.key}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onMouseEnter={() => setHoveredModule(mod.key)}
                  onMouseLeave={() => setHoveredModule(null)}
                >
                  <Link href={mod.href}>
                    <div
                      className={`relative bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden group cursor-pointer`}
                    >
                      {/* Background gradient on hover */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                      />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-white`}
                          >
                            <Icon className="w-7 h-7" />
                          </div>
                          <div className="relative w-20 h-20">
                            <Image
                              src={mod.image}
                              alt={moduleT.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>

                        <h3 className="text-2xl font-bold mb-3">{moduleT.title}</h3>
                        <p className="text-[var(--rowi-muted)] mb-6">{moduleT.desc}</p>

                        <div className="space-y-2 mb-6">
                          {moduleT.features.map((feature, fi) => (
                            <div
                              key={fi}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Sparkles className="w-4 h-4 text-[var(--rowi-primary)]" />
                              {feature}
                            </div>
                          ))}
                        </div>

                        <div
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${mod.gradient} text-white text-sm font-medium`}
                        >
                          {t.viewDemo}
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Brain, value: "8", label: lang === "es" ? "Competencias SEI" : "SEI Competencies" },
              { icon: Users, value: "5", label: lang === "es" ? "Niveles de evolución" : "Evolution levels" },
              { icon: TrendingUp, value: "135", label: lang === "es" ? "Puntuación máxima EQ" : "Max EQ score" },
              { icon: Heart, value: "24/7", label: lang === "es" ? "Coach disponible" : "Coach available" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--rowi-primary)]/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-[var(--rowi-primary)]" />
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-[var(--rowi-muted)]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--rowi-primary)]/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl" />

            <div className="relative bg-gradient-to-br from-[var(--rowi-primary)] to-purple-600 rounded-3xl p-12 text-white">
              <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.ctaTitle}</h2>
              <p className="text-xl mb-8 opacity-90">{t.ctaSubtitle}</p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[var(--rowi-primary)] font-bold text-lg hover:bg-opacity-90 transition-all shadow-xl"
              >
                {t.ctaButton}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
