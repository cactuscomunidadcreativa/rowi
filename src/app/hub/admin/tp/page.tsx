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
  GitCompareArrows,
  UserCheck,
  LineChart,
  Target,
  AlertTriangle,
  Database,
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

    // Module: People
    peopleTitle: "Comparador de Personas",
    peopleDesc: "Compara perfiles EQ lado a lado. Analiza fortalezas complementarias y estilos cerebrales entre dos personas.",
    peopleFeat1: "Comparación 1 vs 1",
    peopleFeat2: "Radar de Competencias",
    peopleFeat3: "Análisis Complementario",
    peopleFeat4: "12 Perfiles Mock",

    // Module: Teams
    teamsTitle: "Team Analytics",
    teamsDesc: "Análisis profundo de equipos con indicadores de salud, heatmaps de competencias y comparación inter-equipos.",
    teamsFeat1: "8 Equipos Mock",
    teamsFeat2: "Indicadores de Salud",
    teamsFeat3: "Heatmap Competencias",
    teamsFeat4: "Comparación Inter-equipos",

    // Module: Selection
    selectionTitle: "Selección y Contratación",
    selectionDesc: "Evalúa candidatos contra benchmarks de rol con fit scores, gap analysis y recomendaciones IA.",
    selectionFeat1: "Fit Score 0-100%",
    selectionFeat2: "5 Roles Benchmark",
    selectionFeat3: "Gap Analysis",
    selectionFeat4: "Recomendación IA",

    // Module: Evolution
    evolutionTitle: "Curva de Evolución",
    evolutionDesc: "Rastrea el crecimiento EQ a lo largo del tiempo con assessments múltiples, predicciones y análisis de tendencias.",
    evolutionFeat1: "Timeline Interactivo",
    evolutionFeat2: "Before/After",
    evolutionFeat3: "Predicción EQ",
    evolutionFeat4: "Growth Rate",

    // Module: ROI
    roiTitle: "Calculadora de ROI",
    roiDesc: "Simula el retorno de inversión en programas EQ con escenarios, correlaciones y benchmarks industriales.",
    roiFeat1: "Simulador Budget",
    roiFeat2: "3 Escenarios",
    roiFeat3: "Correlaciones Reales",
    roiFeat4: "Benchmark Industria",

    // Module: World
    worldTitle: "Benchmark Global",
    worldDesc: "Compara TP vs el mundo: Six Seconds global, industria BPO, top 10% mundial y patrones de éxito.",
    worldFeat1: "TP vs Global",
    worldFeat2: "TP vs BPO",
    worldFeat3: "Top 10% Mundial",
    worldFeat4: "Success Patterns",

    // Module: Alerts
    alertsTitle: "Alertas y Monitoreo",
    alertsDesc: "Sistema de alertas inteligentes para EQ bajo, tendencias declinantes, salud de equipos y anomalías.",
    alertsFeat1: "Alertas por Severidad",
    alertsFeat2: "Salud de Equipos",
    alertsFeat3: "Tendencias",
    alertsFeat4: "Configuración Umbrales",

    // Module: Data Quality
    dataQualityTitle: "Calidad de Datos",
    dataQualityDesc: "Análisis de integridad de datos: duplicados, outliers, completeness y score de calidad general.",
    dataQualityFeat1: "Score de Calidad",
    dataQualityFeat2: "Detección Duplicados",
    dataQualityFeat3: "Outlier Detection",
    dataQualityFeat4: "Completeness",

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

    // Module: People
    peopleTitle: "Person Comparator",
    peopleDesc: "Compare EQ profiles side by side. Analyze complementary strengths and brain styles between two people.",
    peopleFeat1: "1 vs 1 Comparison",
    peopleFeat2: "Competency Radar",
    peopleFeat3: "Complementary Analysis",
    peopleFeat4: "12 Mock Profiles",

    // Module: Teams
    teamsTitle: "Team Analytics",
    teamsDesc: "Deep team analysis with health indicators, competency heatmaps, and inter-team comparison.",
    teamsFeat1: "8 Mock Teams",
    teamsFeat2: "Health Indicators",
    teamsFeat3: "Competency Heatmap",
    teamsFeat4: "Inter-team Comparison",

    // Module: Selection
    selectionTitle: "Hiring & Selection",
    selectionDesc: "Evaluate candidates against role benchmarks with fit scores, gap analysis, and AI recommendations.",
    selectionFeat1: "Fit Score 0-100%",
    selectionFeat2: "5 Role Benchmarks",
    selectionFeat3: "Gap Analysis",
    selectionFeat4: "AI Recommendation",

    // Module: Evolution
    evolutionTitle: "Evolution Curve",
    evolutionDesc: "Track EQ growth over time with multiple assessments, predictions, and trend analysis.",
    evolutionFeat1: "Interactive Timeline",
    evolutionFeat2: "Before/After",
    evolutionFeat3: "EQ Prediction",
    evolutionFeat4: "Growth Rate",

    // Module: ROI
    roiTitle: "ROI Calculator",
    roiDesc: "Simulate return on investment in EQ programs with scenarios, correlations, and industry benchmarks.",
    roiFeat1: "Budget Simulator",
    roiFeat2: "3 Scenarios",
    roiFeat3: "Real Correlations",
    roiFeat4: "Industry Benchmark",

    // Module: World
    worldTitle: "Global Benchmark",
    worldDesc: "Compare TP vs the world: Six Seconds global, BPO industry, top 10% worldwide, and success patterns.",
    worldFeat1: "TP vs Global",
    worldFeat2: "TP vs BPO",
    worldFeat3: "Top 10% Worldwide",
    worldFeat4: "Success Patterns",

    // Module: Alerts
    alertsTitle: "Alerts & Monitoring",
    alertsDesc: "Smart alert system for low EQ, declining trends, team health, and anomalies.",
    alertsFeat1: "Severity Alerts",
    alertsFeat2: "Team Health",
    alertsFeat3: "Trends",
    alertsFeat4: "Threshold Config",

    // Module: Data Quality
    dataQualityTitle: "Data Quality",
    dataQualityDesc: "Data integrity analysis: duplicates, outliers, completeness, and overall quality score.",
    dataQualityFeat1: "Quality Score",
    dataQualityFeat2: "Duplicate Detection",
    dataQualityFeat3: "Outlier Detection",
    dataQualityFeat4: "Completeness",

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
    {
      key: "people",
      href: "/hub/admin/tp/people",
      icon: GitCompareArrows,
      gradient: "from-cyan-500 to-blue-600",
      image: "/rowivectors/Rowi-01.png",
      title: t.peopleTitle,
      desc: t.peopleDesc,
      features: [t.peopleFeat1, t.peopleFeat2, t.peopleFeat3, t.peopleFeat4],
    },
    {
      key: "teams",
      href: "/hub/admin/tp/teams",
      icon: Users,
      gradient: "from-teal-500 to-emerald-600",
      image: "/rowivectors/Rowi-02.png",
      title: t.teamsTitle,
      desc: t.teamsDesc,
      features: [t.teamsFeat1, t.teamsFeat2, t.teamsFeat3, t.teamsFeat4],
    },
    {
      key: "selection",
      href: "/hub/admin/tp/selection",
      icon: UserCheck,
      gradient: "from-lime-500 to-green-600",
      image: "/rowivectors/Rowi-03.png",
      title: t.selectionTitle,
      desc: t.selectionDesc,
      features: [t.selectionFeat1, t.selectionFeat2, t.selectionFeat3, t.selectionFeat4],
    },
    {
      key: "evolution",
      href: "/hub/admin/tp/evolution",
      icon: LineChart,
      gradient: "from-sky-500 to-blue-600",
      image: "/rowivectors/Rowi-04.png",
      title: t.evolutionTitle,
      desc: t.evolutionDesc,
      features: [t.evolutionFeat1, t.evolutionFeat2, t.evolutionFeat3, t.evolutionFeat4],
    },
    {
      key: "roi",
      href: "/hub/admin/tp/roi",
      icon: Target,
      gradient: "from-yellow-500 to-amber-600",
      image: "/rowivectors/Rowi-05.png",
      title: t.roiTitle,
      desc: t.roiDesc,
      features: [t.roiFeat1, t.roiFeat2, t.roiFeat3, t.roiFeat4],
    },
    {
      key: "world",
      href: "/hub/admin/tp/world",
      icon: Globe,
      gradient: "from-emerald-500 to-teal-600",
      image: "/rowivectors/Rowi-06.png",
      title: t.worldTitle,
      desc: t.worldDesc,
      features: [t.worldFeat1, t.worldFeat2, t.worldFeat3, t.worldFeat4],
    },
    {
      key: "alerts",
      href: "/hub/admin/tp/alerts",
      icon: AlertTriangle,
      gradient: "from-red-500 to-rose-600",
      image: "/rowivectors/Rowi-01.png",
      title: t.alertsTitle,
      desc: t.alertsDesc,
      features: [t.alertsFeat1, t.alertsFeat2, t.alertsFeat3, t.alertsFeat4],
    },
    {
      key: "dataQuality",
      href: "/hub/admin/tp/data-quality",
      icon: Database,
      gradient: "from-slate-500 to-gray-600",
      image: "/rowivectors/Rowi-02.png",
      title: t.dataQualityTitle,
      desc: t.dataQualityDesc,
      features: [t.dataQualityFeat1, t.dataQualityFeat2, t.dataQualityFeat3, t.dataQualityFeat4],
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
