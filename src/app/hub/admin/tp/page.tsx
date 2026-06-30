"use client";

import { useState, useEffect } from "react";
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

const TP_BENCHMARK_ID = "tp-all-assessments-2025";

export default function TPAdminHub() {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const { t } = useI18n();

  // --- Live data from the real benchmark API ---
  const [avgEQ, setAvgEQ] = useState<number | null>(null);
  const [totalAssessments, setTotalAssessments] = useState<number | null>(null);
  const [countryCount, setCountryCount] = useState<number | null>(null);
  const [brainStyleCount, setBrainStyleCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [statsRes, countryRes, brainRes] = await Promise.all([
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats`),
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=country`),
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=brainStyle`),
        ]);
        const statsJson = await statsRes.json();
        const countryJson = await countryRes.json();
        const brainJson = await brainRes.json();
        if (cancelled) return;
        if (statsJson.ok) {
          const eq = (statsJson.statistics ?? []).find((s: { metricKey: string }) => s.metricKey === "eqTotal");
          if (eq) {
            setAvgEQ(eq.mean ?? null);
            setTotalAssessments(eq.n ?? null);
          }
        }
        if (countryJson.ok) setCountryCount(countryJson.totalGroups ?? null);
        if (brainJson.ok) setBrainStyleCount(brainJson.totalGroups ?? null);
      } catch (e) {
        console.error("Error loading TP hub stats:", e);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const fmt = (v: number | null, digits = 0) =>
    v === null ? t("tpHome.noData", "—") : digits ? v.toFixed(digits) : v.toLocaleString();

  const TP_QUICK_STATS = [
    { icon: Activity, value: fmt(avgEQ, 1), label: t("tpHome.statAvgEQ", "EQ Promedio"), color: "#7B2D8E" },
    { icon: Users, value: fmt(totalAssessments), label: t("tpHome.statAssessments", "Evaluaciones"), color: "#3b82f6" },
    { icon: Globe, value: fmt(countryCount), label: t("tpHome.statCountries", "Países"), color: "#10b981" },
    { icon: Brain, value: fmt(brainStyleCount), label: t("tpHome.statBrainProfiles", "Perfiles Cerebrales"), color: "#f59e0b" },
  ];

  const modules = [
    {
      key: "dashboard",
      href: "/hub/admin/tp/dashboard",
      icon: LayoutDashboard,
      gradient: "from-violet-500 to-purple-600",
      image: "/rowivectors/Rowi-06.webp",
      title: t("tpHome.dashboardTitle", "Dashboard EQ"),
      desc: t("tpHome.dashboardDesc", "Vista completa de métricas SEI con puntajes EQ individuales y de equipo, pursuits y competencias."),
      features: [
        t("tpHome.dashboardFeat1", "Puntaje Total EQ"),
        t("tpHome.dashboardFeat2", "8 Competencias SEI"),
        t("tpHome.dashboardFeat3", "3 Pursuits"),
        t("tpHome.dashboardFeat4", "Resultados de Vida"),
      ],
    },
    {
      key: "benchmark",
      href: "/hub/admin/tp/benchmark",
      icon: BarChart3,
      gradient: "from-violet-500 to-purple-600",
      image: "/rowivectors/Rowi-01.webp",
      title: t("tpHome.benchmarkTitle", "Benchmark TP"),
      desc: t("tpHome.benchmarkDesc", "{count} evaluaciones SEI reales analizadas. Benchmarking corporativo por regiones, roles y departamentos.").replace("{count}", fmt(totalAssessments)),
      features: [
        t("tpHome.benchmarkFeat1", "{count} Evaluaciones").replace("{count}", fmt(totalAssessments)),
        t("tpHome.benchmarkFeat2", "42 Países"),
        t("tpHome.benchmarkFeat3", "Insights Regionales"),
        t("tpHome.benchmarkFeat4", "Perfiles Cerebrales"),
      ],
    },
    {
      key: "affinity",
      href: "/hub/admin/tp/affinity",
      icon: Heart,
      gradient: "from-pink-500 to-rose-600",
      image: "/rowivectors/Rowi-05.webp",
      title: t("tpHome.affinityTitle", "Afinidad de Equipo"),
      desc: t("tpHome.affinityDesc", "Descubre la compatibilidad emocional entre equipos TP. Optimiza la colaboración con matching de estilos cerebrales."),
      features: [
        t("tpHome.affinityFeat1", "Compatibilidad de Equipo"),
        t("tpHome.affinityFeat2", "Match de Estilo Cerebral"),
        t("tpHome.affinityFeat3", "Equipos Multi-región"),
        t("tpHome.affinityFeat4", "Insights de Colaboración"),
      ],
    },
    {
      key: "eco",
      href: "/hub/admin/tp/eco",
      icon: MessageSquare,
      gradient: "from-emerald-500 to-green-600",
      image: "/rowivectors/Rowi-04.webp",
      title: t("tpHome.ecoTitle", "Comunicación ECO"),
      desc: t("tpHome.ecoDesc", "Optimiza la comunicación emocional en la fuerza laboral global de TP con mensajería adaptada por IA."),
      features: [
        t("tpHome.ecoFeat1", "Mensajería Adaptada"),
        t("tpHome.ecoFeat2", "Multi-canal"),
        t("tpHome.ecoFeat3", "Estilo Cerebral Aware"),
        t("tpHome.ecoFeat4", "Contexto Cultural"),
      ],
    },
    {
      key: "coach",
      href: "/hub/admin/tp/coach",
      icon: Bot,
      gradient: "from-violet-500 to-purple-600",
      image: "/rowivectors/Rowi-03.webp",
      title: t("tpHome.coachTitle", "Rowi Coach"),
      desc: t("tpHome.coachDesc", "Coaching de inteligencia emocional 24/7 con IA para empleados de TP, contextualizado con datos SEI."),
      features: [
        t("tpHome.coachFeat1", "Tu Guía por chat"),
        t("tpHome.coachFeat2", "Basado en SEI"),
        t("tpHome.coachFeat3", "Seguimiento de Progreso"),
        t("tpHome.coachFeat4", "Ejercicios Personalizados"),
      ],
    },
    {
      key: "community",
      href: "/hub/admin/tp/community",
      icon: Users,
      gradient: "from-amber-500 to-orange-600",
      image: "/rowivectors/Rowi-02.webp",
      title: t("tpHome.communityTitle", "Comunidad EQ TP"),
      desc: t("tpHome.communityDesc", "La comunidad de inteligencia emocional de Teleperformance. Eventos, leaderboards y aprendizaje entre pares."),
      features: [
        t("tpHome.communityFeat1", "Leaderboard EQ"),
        t("tpHome.communityFeat2", "Eventos y Desafíos"),
        t("tpHome.communityFeat3", "Aprendizaje entre Pares"),
        t("tpHome.communityFeat4", "Reconocimiento"),
      ],
    },
    {
      key: "onboarding",
      href: "/hub/admin/tp/onboarding",
      icon: GraduationCap,
      gradient: "from-indigo-500 to-violet-600",
      image: "/rowivectors/Rowi-06.webp",
      title: t("tpHome.onboardingTitle", "Onboarding TP"),
      desc: t("tpHome.onboardingDesc", "Flujo de onboarding de empleados con evaluación SEI, perfil cerebral y matching de equipo."),
      features: [
        t("tpHome.onboardingFeat1", "Evaluación SEI"),
        t("tpHome.onboardingFeat2", "Perfil Cerebral"),
        t("tpHome.onboardingFeat3", "Matching de Equipo"),
        t("tpHome.onboardingFeat4", "Plan de Crecimiento"),
      ],
    },
    {
      key: "people",
      href: "/hub/admin/tp/people",
      icon: GitCompareArrows,
      gradient: "from-violet-500 to-purple-600",
      image: "/rowivectors/Rowi-01.webp",
      title: t("tpHome.peopleTitle", "Comparador de Personas"),
      desc: t("tpHome.peopleDesc", "Compara perfiles EQ lado a lado. Analiza fortalezas complementarias y estilos cerebrales entre dos personas."),
      features: [
        t("tpHome.peopleFeat1", "Comparación 1 vs 1"),
        t("tpHome.peopleFeat2", "Radar de Competencias"),
        t("tpHome.peopleFeat3", "Análisis Complementario"),
        t("tpHome.peopleFeat4", "12 Perfiles Mock"),
      ],
    },
    {
      key: "teams",
      href: "/hub/admin/tp/teams",
      icon: Users,
      gradient: "from-teal-500 to-emerald-600",
      image: "/rowivectors/Rowi-02.webp",
      title: t("tpHome.teamsTitle", "Team Analytics"),
      desc: t("tpHome.teamsDesc", "Análisis profundo de equipos con indicadores de salud, heatmaps de competencias y comparación inter-equipos."),
      features: [
        t("tpHome.teamsFeat1", "8 Equipos Mock"),
        t("tpHome.teamsFeat2", "Indicadores de Salud"),
        t("tpHome.teamsFeat3", "Heatmap Competencias"),
        t("tpHome.teamsFeat4", "Comparación Inter-equipos"),
      ],
    },
    {
      key: "selection",
      href: "/hub/admin/tp/selection",
      icon: UserCheck,
      gradient: "from-lime-500 to-green-600",
      image: "/rowivectors/Rowi-03.webp",
      title: t("tpHome.selectionTitle", "Selección y Contratación"),
      desc: t("tpHome.selectionDesc", "Evalúa candidatos contra benchmarks de rol con fit scores, gap analysis y recomendaciones IA."),
      features: [
        t("tpHome.selectionFeat1", "Fit Score 0-100%"),
        t("tpHome.selectionFeat2", "5 Roles Benchmark"),
        t("tpHome.selectionFeat3", "Gap Analysis"),
        t("tpHome.selectionFeat4", "Recomendación IA"),
      ],
    },
    {
      key: "evolution",
      href: "/hub/admin/tp/evolution",
      icon: LineChart,
      gradient: "from-violet-500 to-purple-600",
      image: "/rowivectors/Rowi-04.webp",
      title: t("tpHome.evolutionTitle", "Curva de Evolución"),
      desc: t("tpHome.evolutionDesc", "Rastrea el crecimiento EQ a lo largo del tiempo con assessments múltiples, predicciones y análisis de tendencias."),
      features: [
        t("tpHome.evolutionFeat1", "Timeline Interactivo"),
        t("tpHome.evolutionFeat2", "Before/After"),
        t("tpHome.evolutionFeat3", "Predicción EQ"),
        t("tpHome.evolutionFeat4", "Growth Rate"),
      ],
    },
    {
      key: "roi",
      href: "/hub/admin/tp/roi",
      icon: Target,
      gradient: "from-yellow-500 to-amber-600",
      image: "/rowivectors/Rowi-05.webp",
      title: t("tpHome.roiTitle", "Calculadora de ROI"),
      desc: t("tpHome.roiDesc", "Simula el retorno de inversión en programas EQ con escenarios, correlaciones y benchmarks industriales."),
      features: [
        t("tpHome.roiFeat1", "Simulador Budget"),
        t("tpHome.roiFeat2", "3 Escenarios"),
        t("tpHome.roiFeat3", "Correlaciones Reales"),
        t("tpHome.roiFeat4", "Benchmark Industria"),
      ],
    },
    {
      key: "world",
      href: "/hub/admin/tp/world",
      icon: Globe,
      gradient: "from-emerald-500 to-teal-600",
      image: "/rowivectors/Rowi-06.webp",
      title: t("tpHome.worldTitle", "Benchmark Global"),
      desc: t("tpHome.worldDesc", "Compara TP vs el mundo: Six Seconds global, industria BPO, top 10% mundial y patrones de éxito."),
      features: [
        t("tpHome.worldFeat1", "TP vs Global"),
        t("tpHome.worldFeat2", "TP vs BPO"),
        t("tpHome.worldFeat3", "Top 10% Mundial"),
        t("tpHome.worldFeat4", "Success Patterns"),
      ],
    },
    {
      key: "alerts",
      href: "/hub/admin/tp/alerts",
      icon: AlertTriangle,
      gradient: "from-red-500 to-rose-600",
      image: "/rowivectors/Rowi-01.webp",
      title: t("tpHome.alertsTitle", "Alertas y Monitoreo"),
      desc: t("tpHome.alertsDesc", "Sistema de alertas inteligentes para EQ bajo, tendencias declinantes, salud de equipos y anomalías."),
      features: [
        t("tpHome.alertsFeat1", "Alertas por Severidad"),
        t("tpHome.alertsFeat2", "Salud de Equipos"),
        t("tpHome.alertsFeat3", "Tendencias"),
        t("tpHome.alertsFeat4", "Configuración Umbrales"),
      ],
    },
    {
      key: "dataQuality",
      href: "/hub/admin/tp/data-quality",
      icon: Database,
      gradient: "from-slate-500 to-gray-600",
      image: "/rowivectors/Rowi-02.webp",
      title: t("tpHome.dataQualityTitle", "Calidad de Datos"),
      desc: t("tpHome.dataQualityDesc", "Análisis de integridad de datos: duplicados, outliers, completeness y score de calidad general."),
      features: [
        t("tpHome.dataQualityFeat1", "Score de Calidad"),
        t("tpHome.dataQualityFeat2", "Detección Duplicados"),
        t("tpHome.dataQualityFeat3", "Outlier Detection"),
        t("tpHome.dataQualityFeat4", "Completeness"),
      ],
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{t("tpHome.pageTitle", "Hub de Gestión")}</h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500">
                {t("tpHome.enterpriseBadge", "Enterprise")}
              </span>
            </div>
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("tpHome.subtitle", "Plataforma de Inteligencia EQ — Powered by Rowi × Six Seconds")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)]">
          <Shield className="w-3 h-3 text-emerald-500" />
          <span>{t("tpHome.protectedAccess", "Acceso por plan + rol de administración")}</span>
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
          {t("tpHome.modulesTitle", "Módulos TP")}
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
                        {t("tpHome.openButton", "Abrir")}
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
          <p>{t("tpHome.footerText", "Este es un entorno de demostración en vivo que utiliza datos reales agregados de {count} evaluaciones SEI de Teleperformance. Todos los datos individuales están anonimizados. Powered by Rowi × Six Seconds.").replace("{count}", fmt(totalAssessments))}</p>
          <p className="text-xs mt-1 text-purple-400">
            Rowi &copy; {new Date().getFullYear()} &mdash; {t("tpHome.footerCopyright", "Rowi — Plataforma de Inteligencia Emocional con IA")}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
