"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  LayoutDashboard,
  Heart,
  MessageSquare,
  Bot,
  ArrowRight,
  Sparkles,
  Brain,
  Users,
  TrendingUp,
  Building2,
  BarChart3,
  Globe,
  Activity,
  Award,
  Zap,
  PieChart,
  GraduationCap,
  Shield,
} from "lucide-react";

/* =========================================================
   TP Admin Hub — Main Dashboard
   Protected route for @6seconds.org users
========================================================= */

const translations = {
  es: {
    // Header
    pageTitle: "Teleperformance",
    enterpriseBadge: "Enterprise",
    subtitle: "Plataforma de Inteligencia EQ — Powered by Rowi × Six Seconds",
    protectedAccess: "Protegido — acceso solo @6seconds.org",

    // Quick Stats
    statAvgEQ: "EQ Promedio",
    statAssessments: "Evaluaciones",
    statCountries: "Países",
    statBrainProfiles: "Perfiles Cerebrales",

    // Modules section
    modulesTitle: "Módulos TP",
    openButton: "Abrir",

    // Module: Dashboard
    dashboardTitle: "Dashboard EQ",
    dashboardDesc: "Vista completa de métricas SEI con puntajes EQ individuales y de equipo, pursuits y competencias.",
    dashboardFeat1: "Puntaje Total EQ",
    dashboardFeat2: "8 Competencias SEI",
    dashboardFeat3: "3 Pursuits",
    dashboardFeat4: "Resultados de Vida",

    // Module: Benchmark
    benchmarkTitle: "Benchmark TP",
    benchmarkDesc: "14,886 evaluaciones SEI reales analizadas. Benchmarking corporativo por regiones, roles y departamentos.",
    benchmarkFeat1: "14,886 Evaluaciones",
    benchmarkFeat2: "42 Países",
    benchmarkFeat3: "Insights Regionales",
    benchmarkFeat4: "Perfiles Cerebrales",

    // Module: Affinity
    affinityTitle: "Afinidad de Equipo",
    affinityDesc: "Descubre la compatibilidad emocional entre equipos TP. Optimiza la colaboración con matching de estilos cerebrales.",
    affinityFeat1: "Compatibilidad de Equipo",
    affinityFeat2: "Match de Estilo Cerebral",
    affinityFeat3: "Equipos Multi-región",
    affinityFeat4: "Insights de Colaboración",

    // Module: ECO
    ecoTitle: "Comunicación ECO",
    ecoDesc: "Optimiza la comunicación emocional en la fuerza laboral global de TP con mensajería adaptada por IA.",
    ecoFeat1: "Mensajería Adaptada",
    ecoFeat2: "Multi-canal",
    ecoFeat3: "Estilo Cerebral Aware",
    ecoFeat4: "Contexto Cultural",

    // Module: Coach
    coachTitle: "Rowi Coach",
    coachDesc: "Coaching de inteligencia emocional 24/7 con IA para empleados de TP, contextualizado con datos SEI.",
    coachFeat1: "Coach IA por Chat",
    coachFeat2: "Basado en SEI",
    coachFeat3: "Seguimiento de Progreso",
    coachFeat4: "Ejercicios Personalizados",

    // Module: Community
    communityTitle: "Comunidad EQ TP",
    communityDesc: "La comunidad de inteligencia emocional de Teleperformance. Eventos, leaderboards y aprendizaje entre pares.",
    communityFeat1: "Leaderboard EQ",
    communityFeat2: "Eventos y Desafíos",
    communityFeat3: "Aprendizaje entre Pares",
    communityFeat4: "Reconocimiento",

    // Module: Onboarding
    onboardingTitle: "Onboarding TP",
    onboardingDesc: "Flujo de onboarding de empleados con evaluación SEI, perfil cerebral y matching de equipo.",
    onboardingFeat1: "Evaluación SEI",
    onboardingFeat2: "Perfil Cerebral",
    onboardingFeat3: "Matching de Equipo",
    onboardingFeat4: "Plan de Crecimiento",

    // Footer
    footerText:
      "Este es un entorno de demostración en vivo que utiliza datos reales agregados de 14,886 evaluaciones SEI de Teleperformance. Todos los datos individuales están anonimizados. Powered by Rowi SIA × Six Seconds.",
    footerCopyright: "Rowi SIA — Plataforma de Inteligencia Emocional con IA",
  },
  en: {
    // Header
    pageTitle: "Teleperformance",
    enterpriseBadge: "Enterprise",
    subtitle: "EQ Intelligence Platform — Powered by Rowi × Six Seconds",
    protectedAccess: "Protected — @6seconds.org access only",

    // Quick Stats
    statAvgEQ: "Avg EQ",
    statAssessments: "Assessments",
    statCountries: "Countries",
    statBrainProfiles: "Brain Profiles",

    // Modules section
    modulesTitle: "TP Modules",
    openButton: "Open",

    // Module: Dashboard
    dashboardTitle: "EQ Dashboard",
    dashboardDesc: "Complete SEI metrics view with individual and team-level EQ scores, pursuits, and competencies.",
    dashboardFeat1: "Total EQ Score",
    dashboardFeat2: "8 SEI Competencies",
    dashboardFeat3: "3 Pursuits",
    dashboardFeat4: "Life Outcomes",

    // Module: Benchmark
    benchmarkTitle: "TP Benchmark",
    benchmarkDesc: "14,886 real SEI assessments analyzed. Corporate benchmarking across regions, roles, and departments.",
    benchmarkFeat1: "14,886 Assessments",
    benchmarkFeat2: "42 Countries",
    benchmarkFeat3: "Regional Insights",
    benchmarkFeat4: "Brain Profiles",

    // Module: Affinity
    affinityTitle: "Team Affinity",
    affinityDesc: "Discover emotional compatibility across TP teams. Optimize collaboration with brain style matching.",
    affinityFeat1: "Team Compatibility",
    affinityFeat2: "Brain Style Match",
    affinityFeat3: "Cross-region Teams",
    affinityFeat4: "Collaboration Insights",

    // Module: ECO
    ecoTitle: "ECO Communication",
    ecoDesc: "Optimize emotional communication across TP's global workforce with AI-adapted messaging.",
    ecoFeat1: "Adapted Messaging",
    ecoFeat2: "Multi-channel",
    ecoFeat3: "Brain Style Aware",
    ecoFeat4: "Cultural Context",

    // Module: Coach
    coachTitle: "Rowi Coach",
    coachDesc: "24/7 AI-powered emotional intelligence coaching for TP employees, contextualized with SEI data.",
    coachFeat1: "AI Chat Coach",
    coachFeat2: "SEI-Aware",
    coachFeat3: "Progress Tracking",
    coachFeat4: "Personalized Exercises",

    // Module: Community
    communityTitle: "TP EQ Community",
    communityDesc: "The Teleperformance emotional intelligence community. Events, leaderboards, and peer learning.",
    communityFeat1: "EQ Leaderboard",
    communityFeat2: "Events & Challenges",
    communityFeat3: "Peer Learning",
    communityFeat4: "Recognition",

    // Module: Onboarding
    onboardingTitle: "TP Onboarding",
    onboardingDesc: "Employee onboarding flow with SEI assessment, brain profiling, and team matching.",
    onboardingFeat1: "SEI Assessment",
    onboardingFeat2: "Brain Profile",
    onboardingFeat3: "Team Matching",
    onboardingFeat4: "Growth Plan",

    // Footer
    footerText:
      "This is a live demo environment using real aggregated data from 14,886 Teleperformance SEI assessments. All individual data is anonymized. Powered by Rowi SIA × Six Seconds.",
    footerCopyright: "Rowi SIA — Emotional Intelligence AI Platform",
  },
};

export default function TPAdminHub() {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const TP_QUICK_STATS = [
    { icon: Activity, value: "98.7", label: t.statAvgEQ, color: "#7B2D8E" },
    { icon: Users, value: "14,886", label: t.statAssessments, color: "#3b82f6" },
    { icon: Globe, value: "42", label: t.statCountries, color: "#10b981" },
    { icon: Brain, value: "7", label: t.statBrainProfiles, color: "#f59e0b" },
  ];

  const modules = [
    {
      key: "dashboard",
      href: "/hub/admin/tp/dashboard",
      icon: LayoutDashboard,
      gradient: "from-violet-500 to-purple-600",
      image: "/rowivectors/Rowi-06.png",
      title: t.dashboardTitle,
      desc: t.dashboardDesc,
      features: [t.dashboardFeat1, t.dashboardFeat2, t.dashboardFeat3, t.dashboardFeat4],
    },
    {
      key: "benchmark",
      href: "/hub/admin/tp/benchmark",
      icon: BarChart3,
      gradient: "from-purple-600 to-pink-600",
      image: "/rowivectors/Rowi-01.png",
      title: t.benchmarkTitle,
      desc: t.benchmarkDesc,
      features: [t.benchmarkFeat1, t.benchmarkFeat2, t.benchmarkFeat3, t.benchmarkFeat4],
    },
    {
      key: "affinity",
      href: "/hub/admin/tp/affinity",
      icon: Heart,
      gradient: "from-pink-500 to-rose-600",
      image: "/rowivectors/Rowi-05.png",
      title: t.affinityTitle,
      desc: t.affinityDesc,
      features: [t.affinityFeat1, t.affinityFeat2, t.affinityFeat3, t.affinityFeat4],
    },
    {
      key: "eco",
      href: "/hub/admin/tp/eco",
      icon: MessageSquare,
      gradient: "from-emerald-500 to-green-600",
      image: "/rowivectors/Rowi-04.png",
      title: t.ecoTitle,
      desc: t.ecoDesc,
      features: [t.ecoFeat1, t.ecoFeat2, t.ecoFeat3, t.ecoFeat4],
    },
    {
      key: "coach",
      href: "/hub/admin/tp/coach",
      icon: Bot,
      gradient: "from-blue-500 to-cyan-600",
      image: "/rowivectors/Rowi-03.png",
      title: t.coachTitle,
      desc: t.coachDesc,
      features: [t.coachFeat1, t.coachFeat2, t.coachFeat3, t.coachFeat4],
    },
    {
      key: "community",
      href: "/hub/admin/tp/community",
      icon: Users,
      gradient: "from-amber-500 to-orange-600",
      image: "/rowivectors/Rowi-02.png",
      title: t.communityTitle,
      desc: t.communityDesc,
      features: [t.communityFeat1, t.communityFeat2, t.communityFeat3, t.communityFeat4],
    },
    {
      key: "onboarding",
      href: "/hub/admin/tp/onboarding",
      icon: GraduationCap,
      gradient: "from-indigo-500 to-violet-600",
      image: "/rowivectors/Rowi-06.png",
      title: t.onboardingTitle,
      desc: t.onboardingDesc,
      features: [t.onboardingFeat1, t.onboardingFeat2, t.onboardingFeat3, t.onboardingFeat4],
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{t.pageTitle}</h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500">
                {t.enterpriseBadge}
              </span>
            </div>
            <p className="text-sm text-[var(--rowi-muted)]">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)]">
          <Shield className="w-3 h-3 text-emerald-500" />
          <span>{t.protectedAccess}</span>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TP_QUICK_STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${stat.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
              <div className="text-xs text-[var(--rowi-muted)]">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          {t.modulesTitle}
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => {
            const Icon = mod.icon;

            return (
              <motion.div
                key={mod.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onMouseEnter={() => setHoveredModule(mod.key)}
                onMouseLeave={() => setHoveredModule(null)}
              >
                <Link href={mod.href}>
                  <div className="relative bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden group cursor-pointer h-full">
                    {/* Background gradient on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-white`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="relative w-14 h-14">
                          <Image src={mod.image} alt={mod.title} fill className="object-contain" />
                        </div>
                      </div>

                      <h3 className="text-lg font-bold mb-2">{mod.title}</h3>
                      <p className="text-sm text-[var(--rowi-muted)] mb-4 line-clamp-2">{mod.desc}</p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {mod.features.map((feature, fi) => (
                          <span key={fi} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)]">
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${mod.gradient} text-white text-sm font-medium`}>
                        {t.openButton}
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

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-sm text-[var(--rowi-muted)]"
      >
        <Shield className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
        <div>
          <p>{t.footerText}</p>
          <p className="text-xs mt-1 text-purple-400">
            Rowi SIA &copy; {new Date().getFullYear()} &mdash; {t.footerCopyright}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
