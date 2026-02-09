"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, BarChart3, Brain, Building2, Globe, Heart,
  Layers, Sparkles, Target, TrendingUp, Users, Zap, Shield, Award,
  Activity, PieChart,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   TP Benchmark — Full Benchmark Analysis (moved from demo)
   14,886 real SEI assessments
========================================================= */

const translations = {
  es: {
    // Header
    backToHub: "TP Hub",
    badgeLabel: "Benchmark Teleperformance",
    pageTitle: "Benchmark EQ — Teleperformance",
    pageSubtitle: "14,886 evaluaciones SEI analizadas en 42 países. Benchmarking corporativo en acción.",

    // Section tabs
    tabOverview: "Resumen",
    tabCompetencies: "Competencias",
    tabOutcomes: "Resultados",
    tabBrainProfiles: "Perfiles Cerebrales",
    tabInsights: "Hallazgos",

    // Overview section
    sectionOverview: "Resumen",
    statAvgEQ: "EQ Promedio",
    statAssessments: "Evaluaciones",
    statCountries: "Países",
    statStrongestCompetency: "Competencia más fuerte",
    globalAverage: "Promedio Global TP",
    seiScale: "Escala SEI: 65–135",
    threePursuits: "Tres Propósitos",
    regionalDistribution: "Distribución Regional",
    assessments: "evaluaciones",

    // Pursuits
    pursuitKnow: "Conócete",
    pursuitChoose: "Elígete",
    pursuitGive: "Entrégate",

    // Competencies section
    sectionCompetencies: "Competencias SEI",
    legendAverage: "Promedio",
    legendTopPerformer: "Mejor desempeño",
    byJobFunction: "Por Función Laboral",

    // Competency names
    compEmotionalLiteracy: "Alfabetización Emocional",
    compRecognizePatterns: "Reconocer Patrones",
    compConsequentialThinking: "Pensamiento Consecuente",
    compNavigateEmotions: "Navegar Emociones",
    compIntrinsicMotivation: "Motivación Intrínseca",
    compExerciseOptimism: "Ejercitar el Optimismo",
    compIncreaseEmpathy: "Incrementar la Empatía",
    compPursueNobleGoals: "Perseguir Metas Nobles",

    // Outcomes section
    sectionOutcomes: "Resultados",
    outcomeEffectiveness: "Efectividad",
    outcomeRelationships: "Relaciones",
    outcomeWellbeing: "Bienestar",
    outcomeQualityOfLife: "Calidad de Vida",

    // Brain Profiles section
    sectionBrainProfiles: "Perfiles Cerebrales",
    brainScientist: "Científico",
    brainDeliverer: "Ejecutor",
    brainStrategist: "Estratega",
    brainInventor: "Inventor",
    brainGuardian: "Guardián",
    brainVisionary: "Visionario",
    brainSuperhero: "Superhéroe",

    // Job Functions
    jobCustomerService: "Atención al Cliente",
    jobSalesBusinessDev: "Ventas y Desarrollo",
    jobHumanResources: "Recursos Humanos",
    jobITTechnology: "TI y Tecnología",
    jobOperations: "Operaciones",

    // Regions
    regionNorthAmerica: "Norteamérica",
    regionAsiaPacific: "Asia Pacífico",
    regionEMEA: "EMEA",
    regionLatinAmerica: "Latinoamérica",

    // Insights section
    sectionInsights: "Hallazgos Clave",
    insight1: "Los mejores en Efectividad muestran +22% en Pensamiento Consecuente (ACT) vs. el promedio",
    insight2: "RRHH tiene el EQ promedio más alto (101.1), lo que sugiere una correlación entre EQ y roles de gestión de personas",
    insight3: "Motivación Intrínseca (IM) es la competencia más fuerte globalmente — clave para la retención",
    insight4: "El perfil cerebral 'Científico' domina (19%), lo que indica una cultura analítica orientada a datos",

    // Footer
    footerText: "Datos reales agregados de 14,886 evaluaciones SEI de Teleperformance. Todos los datos individuales están anonimizados.",
    footerPowered: "Powered by Rowi SIA × Six Seconds",

    // Navigation
    navDashboard: "Dashboard",
    navAffinity: "Afinidad",
  },
  en: {
    // Header
    backToHub: "TP Hub",
    badgeLabel: "Teleperformance Benchmark",
    pageTitle: "EQ Benchmark — Teleperformance",
    pageSubtitle: "14,886 SEI assessments analyzed across 42 countries. Corporate benchmarking in action.",

    // Section tabs
    tabOverview: "Overview",
    tabCompetencies: "Competencies",
    tabOutcomes: "Outcomes",
    tabBrainProfiles: "Brain Profiles",
    tabInsights: "Insights",

    // Overview section
    sectionOverview: "Overview",
    statAvgEQ: "Average EQ",
    statAssessments: "Assessments",
    statCountries: "Countries",
    statStrongestCompetency: "Strongest Competency",
    globalAverage: "TP Global Average",
    seiScale: "SEI Scale: 65–135",
    threePursuits: "Three Pursuits",
    regionalDistribution: "Regional Distribution",
    assessments: "assessments",

    // Pursuits
    pursuitKnow: "Know Yourself",
    pursuitChoose: "Choose Yourself",
    pursuitGive: "Give Yourself",

    // Competencies section
    sectionCompetencies: "SEI Competencies",
    legendAverage: "Average",
    legendTopPerformer: "Top Performer",
    byJobFunction: "By Job Function",

    // Competency names
    compEmotionalLiteracy: "Emotional Literacy",
    compRecognizePatterns: "Recognize Patterns",
    compConsequentialThinking: "Consequential Thinking",
    compNavigateEmotions: "Navigate Emotions",
    compIntrinsicMotivation: "Intrinsic Motivation",
    compExerciseOptimism: "Exercise Optimism",
    compIncreaseEmpathy: "Increase Empathy",
    compPursueNobleGoals: "Pursue Noble Goals",

    // Outcomes section
    sectionOutcomes: "Outcomes",
    outcomeEffectiveness: "Effectiveness",
    outcomeRelationships: "Relationships",
    outcomeWellbeing: "Wellbeing",
    outcomeQualityOfLife: "Quality of Life",

    // Brain Profiles section
    sectionBrainProfiles: "Brain Profiles",
    brainScientist: "Scientist",
    brainDeliverer: "Deliverer",
    brainStrategist: "Strategist",
    brainInventor: "Inventor",
    brainGuardian: "Guardian",
    brainVisionary: "Visionary",
    brainSuperhero: "Superhero",

    // Job Functions
    jobCustomerService: "Customer Service",
    jobSalesBusinessDev: "Sales & Business Dev",
    jobHumanResources: "Human Resources",
    jobITTechnology: "IT & Technology",
    jobOperations: "Operations",

    // Regions
    regionNorthAmerica: "North America",
    regionAsiaPacific: "Asia Pacific",
    regionEMEA: "EMEA",
    regionLatinAmerica: "Latin America",

    // Insights section
    sectionInsights: "Key Insights",
    insight1: "Top performers in Effectiveness show +22% in Consequential Thinking (ACT) vs. average",
    insight2: "HR has the highest average EQ (101.1), suggesting a correlation between EQ and people management roles",
    insight3: "Intrinsic Motivation (IM) is the strongest competency globally — key for retention",
    insight4: "The 'Scientist' brain profile dominates (19%), indicating a data-driven analytical culture",

    // Footer
    footerText: "Real aggregated data from 14,886 Teleperformance SEI assessments. All individual data is anonymized.",
    footerPowered: "Powered by Rowi SIA × Six Seconds",

    // Navigation
    navDashboard: "Dashboard",
    navAffinity: "Affinity",
  },
};

const TP_STATS = { totalAssessments: 14886, countries: 42, avgEQ: 98.7, avgEffectiveness: 101.2, avgRelationships: 99.8, avgWellbeing: 97.4, avgQualityOfLife: 98.1 };

/* Components */
function EQGauge({ score, color = "#7B2D8E" }: { score: number; color?: string }) {
  const percent = ((score - 65) / 70) * 100;
  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-zinc-800" />
        <motion.circle cx="50" cy="50" r="42" stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={`${percent * 2.64} ${264 - percent * 2.64}`}
          initial={{ strokeDasharray: "0 264" }}
          whileInView={{ strokeDasharray: `${percent * 2.64} ${264 - percent * 2.64}` }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score.toFixed(1)}</span>
        <span className="text-xs text-[var(--rowi-muted)]">/ 135</span>
      </div>
    </div>
  );
}

function CompetencyBar({ name, avg, topPerformer, color, index }: { name: string; avg: number; topPerformer: number; color: string; index: number }) {
  const avgPercent = ((avg - 65) / 70) * 100;
  const topPercent = ((topPerformer - 65) / 70) * 100;
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium truncate mr-2">{name}</span>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span style={{ color }}>{avg.toFixed(1)}</span>
          <span className="text-[var(--rowi-muted)]">|</span>
          <span className="text-emerald-500">{topPerformer.toFixed(1)}</span>
        </div>
      </div>
      <div className="relative h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div className="absolute h-full rounded-full" style={{ backgroundColor: `${color}40` }} initial={{ width: 0 }} whileInView={{ width: `${topPercent}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: index * 0.05 }} />
        <motion.div className="absolute h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} whileInView={{ width: `${avgPercent}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: index * 0.05 }} />
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, value, label, color, index }: { icon: any; value: string; label: string; color: string; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-shadow">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-[var(--rowi-muted)]">{label}</div>
    </motion.div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center"><Icon className="w-5 h-5 text-purple-500" /></div>
      <h2 className="text-2xl font-bold">{title}</h2>
    </motion.div>
  );
}

/* Main Page */
export default function TPBenchmarkPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const TP_COMPETENCIES = [
    { key: "EL", name: t.compEmotionalLiteracy, pursuit: "know", avg: 97.3, topPerformer: 118.2, color: "#3b82f6" },
    { key: "RP", name: t.compRecognizePatterns, pursuit: "know", avg: 99.1, topPerformer: 116.8, color: "#3b82f6" },
    { key: "ACT", name: t.compConsequentialThinking, pursuit: "know", avg: 98.4, topPerformer: 119.5, color: "#3b82f6" },
    { key: "NE", name: t.compNavigateEmotions, pursuit: "choose", avg: 96.8, topPerformer: 117.1, color: "#10b981" },
    { key: "IM", name: t.compIntrinsicMotivation, pursuit: "choose", avg: 100.2, topPerformer: 115.9, color: "#10b981" },
    { key: "OP", name: t.compExerciseOptimism, pursuit: "choose", avg: 99.5, topPerformer: 116.3, color: "#10b981" },
    { key: "EMP", name: t.compIncreaseEmpathy, pursuit: "give", avg: 98.9, topPerformer: 118.7, color: "#f59e0b" },
    { key: "NG", name: t.compPursueNobleGoals, pursuit: "give", avg: 97.6, topPerformer: 114.2, color: "#f59e0b" },
  ];

  const TP_PURSUITS = {
    know: { label: t.pursuitKnow, avg: 98.3, color: "#3b82f6", icon: Brain },
    choose: { label: t.pursuitChoose, avg: 98.8, color: "#10b981", icon: Target },
    give: { label: t.pursuitGive, avg: 98.2, color: "#f59e0b", icon: Heart },
  };

  const TP_OUTCOMES = [
    { key: "effectiveness", label: t.outcomeEffectiveness, avg: 101.2, icon: Zap, color: "#6366f1" },
    { key: "relationships", label: t.outcomeRelationships, avg: 99.8, icon: Users, color: "#ec4899" },
    { key: "wellbeing", label: t.outcomeWellbeing, avg: 97.4, icon: Heart, color: "#10b981" },
    { key: "qualityOfLife", label: t.outcomeQualityOfLife, avg: 98.1, icon: Award, color: "#f59e0b" },
  ];

  const TP_BRAIN_PROFILES = [
    { name: t.brainScientist, count: 2841, percent: 19.1, color: "#3b82f6", emoji: "🔬" },
    { name: t.brainDeliverer, count: 2673, percent: 18.0, color: "#10b981", emoji: "📦" },
    { name: t.brainStrategist, count: 2524, percent: 17.0, color: "#8b5cf6", emoji: "♟️" },
    { name: t.brainInventor, count: 2227, percent: 15.0, color: "#f59e0b", emoji: "💡" },
    { name: t.brainGuardian, count: 1935, percent: 13.0, color: "#ef4444", emoji: "🛡️" },
    { name: t.brainVisionary, count: 1489, percent: 10.0, color: "#ec4899", emoji: "🔮" },
    { name: t.brainSuperhero, count: 1197, percent: 7.9, color: "#14b8a6", emoji: "🦸" },
  ];

  const TP_REGIONS = [
    { name: t.regionNorthAmerica, count: 5214, avgEQ: 99.8, flag: "🇺🇸" },
    { name: t.regionAsiaPacific, count: 3872, avgEQ: 97.2, flag: "🇵🇭" },
    { name: t.regionEMEA, count: 3418, avgEQ: 99.1, flag: "🇬🇧" },
    { name: t.regionLatinAmerica, count: 2382, avgEQ: 98.4, flag: "🇲🇽" },
  ];

  const TP_JOB_FUNCTIONS = [
    { name: t.jobCustomerService, count: 6891, avgEQ: 97.9, icon: "💬" },
    { name: t.jobSalesBusinessDev, count: 3102, avgEQ: 100.3, icon: "📈" },
    { name: t.jobHumanResources, count: 1843, avgEQ: 101.1, icon: "👥" },
    { name: t.jobITTechnology, count: 1527, avgEQ: 98.5, icon: "💻" },
    { name: t.jobOperations, count: 1523, avgEQ: 98.1, icon: "⚙️" },
  ];

  const TP_KEY_INSIGHTS = [
    { text: t.insight1, icon: TrendingUp, color: "#6366f1" },
    { text: t.insight2, icon: Users, color: "#ec4899" },
    { text: t.insight3, icon: Zap, color: "#10b981" },
    { text: t.insight4, icon: Brain, color: "#3b82f6" },
  ];

  const sections = [
    { id: "overview", label: t.tabOverview, icon: BarChart3 },
    { id: "competencies", label: t.tabCompetencies, icon: Brain },
    { id: "outcomes", label: t.tabOutcomes, icon: Target },
    { id: "brainProfiles", label: t.tabBrainProfiles, icon: PieChart },
    { id: "insights", label: t.tabInsights, icon: Sparkles },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-purple-500/20 text-purple-500">
              <Building2 className="w-4 h-4" /> {t.badgeLabel}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 font-mono">
              {TP_STATS.totalAssessments.toLocaleString()} SEI
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
          <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
        </motion.div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => { setActiveSection(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeSection === s.id ? "bg-purple-500 text-white shadow-lg" : "text-[var(--rowi-muted)] hover:bg-gray-100 dark:hover:bg-zinc-800"}`}>
              <Icon className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-16">
        {/* Overview */}
        <section id="overview">
          <SectionHeader title={t.sectionOverview} icon={BarChart3} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard icon={Activity} value={TP_STATS.avgEQ.toFixed(1)} label={t.statAvgEQ} color="#7B2D8E" index={0} />
            <StatCard icon={Users} value={TP_STATS.totalAssessments.toLocaleString()} label={t.statAssessments} color="#3b82f6" index={1} />
            <StatCard icon={Globe} value={TP_STATS.countries.toString()} label={t.statCountries} color="#10b981" index={2} />
            <StatCard icon={Zap} value="IM" label={t.statStrongestCompetency} color="#f59e0b" index={3} />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800">
              <h3 className="text-lg font-semibold mb-6 text-center">{t.globalAverage}</h3>
              <EQGauge score={TP_STATS.avgEQ} />
              <p className="text-center text-xs text-[var(--rowi-muted)] mt-4">{t.seiScale}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800">
              <h3 className="text-lg font-semibold mb-6">{t.threePursuits}</h3>
              <div className="space-y-6">
                {Object.entries(TP_PURSUITS).map(([key, p], i) => {
                  const Icon = p.icon;
                  const percent = ((p.avg - 65) / 70) * 100;
                  return (
                    <motion.div key={key} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><Icon className="w-4 h-4" style={{ color: p.color }} /><span className="font-medium text-sm">{p.label}</span></div>
                        <span className="font-mono text-sm font-bold" style={{ color: p.color }}>{p.avg.toFixed(1)}</span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: p.color }} initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.15 }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-purple-500" /> {t.regionalDistribution}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TP_REGIONS.map((region, i) => (
                <motion.div key={region.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 text-center hover:shadow-md transition-shadow">
                  <span className="text-3xl mb-2 block">{region.flag}</span>
                  <h4 className="font-semibold text-sm mb-1">{region.name}</h4>
                  <p className="text-xs text-[var(--rowi-muted)]">{region.count.toLocaleString()} {t.assessments}</p>
                  <p className="text-lg font-bold text-purple-500 mt-2">EQ {region.avgEQ.toFixed(1)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Competencies */}
        <section id="competencies">
          <SectionHeader title={t.sectionCompetencies} icon={Brain} />
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-4 mb-6 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span>{t.legendAverage}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span>{t.legendTopPerformer}</span></div>
            </div>
            <div className="space-y-4">
              {TP_COMPETENCIES.map((comp, i) => (
                <CompetencyBar key={comp.key} name={comp.name} avg={comp.avg} topPerformer={comp.topPerformer} color={comp.color} index={i} />
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800"><p className="text-xs text-[var(--rowi-muted)] text-center">{t.seiScale}</p></div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-purple-500" /> {t.byJobFunction}</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {TP_JOB_FUNCTIONS.map((jf, i) => (
                <motion.div key={jf.name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 text-center hover:shadow-md transition-shadow">
                  <span className="text-2xl block mb-2">{jf.icon}</span>
                  <h4 className="font-medium text-xs mb-1 leading-tight">{jf.name}</h4>
                  <p className="text-[10px] text-[var(--rowi-muted)]">{jf.count.toLocaleString()}</p>
                  <p className="text-lg font-bold text-purple-500 mt-1">{jf.avgEQ.toFixed(1)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section id="outcomes">
          <SectionHeader title={t.sectionOutcomes} icon={Target} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TP_OUTCOMES.map((outcome, i) => {
              const Icon = outcome.icon;
              const percent = ((outcome.avg - 65) / 70) * 100;
              return (
                <motion.div key={outcome.key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${outcome.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: outcome.color }} />
                  </div>
                  <h4 className="font-semibold mb-1">{outcome.label}</h4>
                  <div className="text-3xl font-bold mb-3" style={{ color: outcome.color }}>{outcome.avg.toFixed(1)}</div>
                  <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: outcome.color }} initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.1 }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Brain Profiles */}
        <section id="brainProfiles">
          <SectionHeader title={t.sectionBrainProfiles} icon={PieChart} />
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {TP_BRAIN_PROFILES.map((profile, i) => (
                <motion.div key={profile.name} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="text-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                  <span className="text-3xl block mb-2">{profile.emoji}</span>
                  <h4 className="font-semibold text-sm mb-1">{profile.name}</h4>
                  <div className="text-xl font-bold" style={{ color: profile.color }}>{profile.percent}%</div>
                  <p className="text-[10px] text-[var(--rowi-muted)] mt-1">{profile.count.toLocaleString()}</p>
                  <div className="h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: profile.color }} initial={{ width: 0 }} whileInView={{ width: `${profile.percent * 5}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.05 }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Insights */}
        <section id="insights">
          <SectionHeader title={t.sectionInsights} icon={Sparkles} />
          <div className="grid md:grid-cols-2 gap-4">
            {TP_KEY_INSIGHTS.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${insight.color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: insight.color }} />
                    </div>
                    <p className="text-sm leading-relaxed">{insight.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex items-start gap-3 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-sm text-[var(--rowi-muted)]">
        <Shield className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
        <div>
          <p>{t.footerText}</p>
          <p className="text-xs mt-1 text-purple-400">{t.footerPowered}</p>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> {t.navDashboard}
        </Link>
        <Link href="/hub/admin/tp/affinity" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity">
          {t.navAffinity} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
