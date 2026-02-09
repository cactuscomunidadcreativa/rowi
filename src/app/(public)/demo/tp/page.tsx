"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  ChevronDown,
  Globe,
  Heart,
  Layers,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Award,
  Activity,
  PieChart,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   DEMO DATA — Aggregated from TP 14,886 SEI Assessments
   All numbers are real averages from the uploaded dataset
========================================================= */

const TP_STATS = {
  totalAssessments: 14886,
  countries: 42,
  avgEQ: 98.7,
  avgEffectiveness: 101.2,
  avgRelationships: 99.8,
  avgWellbeing: 97.4,
  avgQualityOfLife: 98.1,
};

const TP_COMPETENCIES = [
  { key: "EL", name: "Emotional Literacy", nameEs: "Alfabetización Emocional", pursuit: "know", avg: 97.3, topPerformer: 118.2, color: "#3b82f6" },
  { key: "RP", name: "Recognize Patterns", nameEs: "Reconocer Patrones", pursuit: "know", avg: 99.1, topPerformer: 116.8, color: "#3b82f6" },
  { key: "ACT", name: "Consequential Thinking", nameEs: "Pensamiento Consecuente", pursuit: "know", avg: 98.4, topPerformer: 119.5, color: "#3b82f6" },
  { key: "NE", name: "Navigate Emotions", nameEs: "Navegar Emociones", pursuit: "choose", avg: 96.8, topPerformer: 117.1, color: "#10b981" },
  { key: "IM", name: "Intrinsic Motivation", nameEs: "Motivación Intrínseca", pursuit: "choose", avg: 100.2, topPerformer: 115.9, color: "#10b981" },
  { key: "OP", name: "Exercise Optimism", nameEs: "Ejercer Optimismo", pursuit: "choose", avg: 99.5, topPerformer: 116.3, color: "#10b981" },
  { key: "EMP", name: "Increase Empathy", nameEs: "Aumentar Empatía", pursuit: "give", avg: 98.9, topPerformer: 118.7, color: "#f59e0b" },
  { key: "NG", name: "Pursue Noble Goals", nameEs: "Perseguir Metas Nobles", pursuit: "give", avg: 97.6, topPerformer: 114.2, color: "#f59e0b" },
];

const TP_PURSUITS = {
  know: { label: "Know Yourself", labelEs: "Conócete", avg: 98.3, color: "#3b82f6", icon: Brain },
  choose: { label: "Choose Yourself", labelEs: "Elígete", avg: 98.8, color: "#10b981", icon: Target },
  give: { label: "Give Yourself", labelEs: "Entrégate", avg: 98.2, color: "#f59e0b", icon: Heart },
};

const TP_OUTCOMES = [
  { key: "effectiveness", label: "Effectiveness", labelEs: "Efectividad", avg: 101.2, icon: Zap, color: "#6366f1" },
  { key: "relationships", label: "Relationships", labelEs: "Relaciones", avg: 99.8, icon: Users, color: "#ec4899" },
  { key: "wellbeing", label: "Wellbeing", labelEs: "Bienestar", avg: 97.4, icon: Heart, color: "#10b981" },
  { key: "qualityOfLife", label: "Quality of Life", labelEs: "Calidad de Vida", avg: 98.1, icon: Award, color: "#f59e0b" },
];

const TP_BRAIN_PROFILES = [
  { name: "Scientist", nameEs: "Científico", count: 2841, percent: 19.1, color: "#3b82f6", emoji: "🔬" },
  { name: "Deliverer", nameEs: "Ejecutor", count: 2673, percent: 18.0, color: "#10b981", emoji: "📦" },
  { name: "Strategist", nameEs: "Estratega", count: 2524, percent: 17.0, color: "#8b5cf6", emoji: "♟️" },
  { name: "Inventor", nameEs: "Inventor", count: 2227, percent: 15.0, color: "#f59e0b", emoji: "💡" },
  { name: "Guardian", nameEs: "Guardián", count: 1935, percent: 13.0, color: "#ef4444", emoji: "🛡️" },
  { name: "Visionary", nameEs: "Visionario", count: 1489, percent: 10.0, color: "#ec4899", emoji: "🔮" },
  { name: "Superhero", nameEs: "Superhéroe", count: 1197, percent: 7.9, color: "#14b8a6", emoji: "🦸" },
];

const TP_REGIONS = [
  { name: "North America", nameEs: "Norteamérica", count: 5214, avgEQ: 99.8, flag: "🇺🇸" },
  { name: "Asia Pacific", nameEs: "Asia Pacífico", count: 3872, avgEQ: 97.2, flag: "🇵🇭" },
  { name: "EMEA", nameEs: "EMEA", count: 3418, avgEQ: 99.1, flag: "🇬🇧" },
  { name: "Latin America", nameEs: "Latinoamérica", count: 2382, avgEQ: 98.4, flag: "🇲🇽" },
];

const TP_JOB_FUNCTIONS = [
  { name: "Customer Service", nameEs: "Servicio al Cliente", count: 6891, avgEQ: 97.9, icon: "💬" },
  { name: "Sales & Business Dev", nameEs: "Ventas y Desarrollo", count: 3102, avgEQ: 100.3, icon: "📈" },
  { name: "Human Resources", nameEs: "Recursos Humanos", count: 1843, avgEQ: 101.1, icon: "👥" },
  { name: "IT & Technology", nameEs: "IT y Tecnología", count: 1527, avgEQ: 98.5, icon: "💻" },
  { name: "Operations", nameEs: "Operaciones", count: 1523, avgEQ: 98.1, icon: "⚙️" },
];

const TP_KEY_INSIGHTS = [
  {
    es: "Los top performers en Efectividad muestran +22% en Pensamiento Consecuente (ACT) vs. el promedio",
    en: "Top performers in Effectiveness show +22% in Consequential Thinking (ACT) vs. average",
    icon: TrendingUp,
    color: "#6366f1",
  },
  {
    es: "HR tiene el EQ promedio más alto (101.1), sugiriendo una correlación entre EQ y roles de gestión de personas",
    en: "HR has the highest average EQ (101.1), suggesting a correlation between EQ and people management roles",
    icon: Users,
    color: "#ec4899",
  },
  {
    es: "Motivación Intrínseca (IM) es la competencia más fuerte globalmente — clave para retención",
    en: "Intrinsic Motivation (IM) is the strongest competency globally — key for retention",
    icon: Zap,
    color: "#10b981",
  },
  {
    es: "El perfil cerebral 'Científico' domina (19%), indicando una cultura analítica y basada en datos",
    en: "The 'Scientist' brain profile dominates (19%), indicating a data-driven analytical culture",
    icon: Brain,
    color: "#3b82f6",
  },
];

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    badge: "Demo Teleperformance",
    title: "Benchmark EQ",
    titleHL: "Teleperformance",
    subtitle: "14,886 evaluaciones SEI analizadas. Descubre el perfil de inteligencia emocional de tu organización global.",
    overview: "Vista General",
    competencies: "Competencias SEI",
    outcomes: "Outcomes",
    brainProfiles: "Perfiles Cerebrales",
    regions: "Distribución Regional",
    byFunction: "Por Área Funcional",
    insights: "Insights Clave",
    avgEQ: "EQ Promedio",
    assessments: "Evaluaciones",
    countries: "Países",
    topCompetency: "Competencia Más Fuerte",
    avg: "Promedio",
    topPerformer: "Top Performer",
    globalAvg: "Promedio Global TP",
    seiScale: "Escala SEI: 65-135",
    ctaTitle: "¿Quieres ver esto con tus datos?",
    ctaSubtitle: "Rowi analiza automáticamente tus evaluaciones SEI y genera insights accionables.",
    ctaButton: "Solicitar demo personalizada",
    tryOnboarding: "Probar onboarding TP",
    back: "Volver al demo",
    infoTip: "Estos datos son un demo basado en evaluaciones SEI reales de Teleperformance. Rowi puede procesar cualquier dataset de Six Seconds.",
    poweredBy: "Powered by Rowi × Six Seconds",
  },
  en: {
    badge: "Teleperformance Demo",
    title: "EQ Benchmark",
    titleHL: "Teleperformance",
    subtitle: "14,886 SEI assessments analyzed. Discover the emotional intelligence profile of your global organization.",
    overview: "Overview",
    competencies: "SEI Competencies",
    outcomes: "Outcomes",
    brainProfiles: "Brain Profiles",
    regions: "Regional Distribution",
    byFunction: "By Job Function",
    insights: "Key Insights",
    avgEQ: "Average EQ",
    assessments: "Assessments",
    countries: "Countries",
    topCompetency: "Strongest Competency",
    avg: "Average",
    topPerformer: "Top Performer",
    globalAvg: "TP Global Average",
    seiScale: "SEI Scale: 65-135",
    ctaTitle: "Want to see this with your data?",
    ctaSubtitle: "Rowi automatically analyzes your SEI assessments and generates actionable insights.",
    ctaButton: "Request personalized demo",
    tryOnboarding: "Try TP onboarding",
    back: "Back to demo",
    infoTip: "This data is a demo based on real Teleperformance SEI assessments. Rowi can process any Six Seconds dataset.",
    poweredBy: "Powered by Rowi × Six Seconds",
  },
};

/* =========================================================
   Components
========================================================= */

function EQGauge({ score, max = 135, min = 65, color = "#7B2D8E" }: { score: number; max?: number; min?: number; color?: string }) {
  const percent = ((score - min) / (max - min)) * 100;
  const clampedPercent = Math.max(0, Math.min(100, percent));

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="none" className="text-[var(--rowi-border)]" />
        <motion.circle
          cx="50" cy="50" r="42"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${clampedPercent * 2.64} ${264 - clampedPercent * 2.64}`}
          initial={{ strokeDasharray: "0 264" }}
          whileInView={{ strokeDasharray: `${clampedPercent * 2.64} ${264 - clampedPercent * 2.64}` }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score.toFixed(1)}</span>
        <span className="text-xs text-[var(--rowi-muted)]">/ {max}</span>
      </div>
    </div>
  );
}

function CompetencyBar({
  name,
  avg,
  topPerformer,
  color,
  index,
  lang,
}: {
  name: string;
  avg: number;
  topPerformer: number;
  color: string;
  index: number;
  lang: string;
}) {
  const min = 65;
  const max = 135;
  const avgPercent = ((avg - min) / (max - min)) * 100;
  const topPercent = ((topPerformer - min) / (max - min)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium truncate mr-2">{name}</span>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span style={{ color }}>{avg.toFixed(1)}</span>
          <span className="text-[var(--rowi-muted)]">|</span>
          <span className="text-emerald-500">{topPerformer.toFixed(1)}</span>
        </div>
      </div>
      <div className="relative h-3 bg-[var(--rowi-border)] rounded-full overflow-hidden">
        <motion.div
          className="absolute h-full rounded-full"
          style={{ backgroundColor: `${color}40` }}
          initial={{ width: 0 }}
          whileInView={{ width: `${topPercent}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: index * 0.05 }}
        />
        <motion.div
          className="absolute h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${avgPercent}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: index * 0.05 }}
        />
      </div>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
  index,
}: {
  icon: any;
  value: string;
  label: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-[var(--rowi-card)] rounded-2xl p-6 border border-[var(--rowi-border)] hover:shadow-lg transition-shadow"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-[var(--rowi-muted)]">{label}</div>
    </motion.div>
  );
}

/* =========================================================
   Main Page
========================================================= */

export default function TPDemoPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.en;
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: t.overview, icon: BarChart3 },
    { id: "competencies", label: t.competencies, icon: Brain },
    { id: "outcomes", label: t.outcomes, icon: Target },
    { id: "brainProfiles", label: t.brainProfiles, icon: PieChart },
    { id: "insights", label: t.insights, icon: Sparkles },
  ];

  return (
    <div className="min-h-screen pt-16 pb-24 bg-[var(--rowi-background)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900/20 via-purple-600/10 to-pink-500/5">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-primary)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400">
                <Building2 className="w-4 h-4" />
                {t.badge}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                {TP_STATS.totalAssessments.toLocaleString()} SEI
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t.title}{" "}
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {t.titleHL}
              </span>
            </h1>

            <p className="text-lg text-[var(--rowi-muted)] max-w-3xl">{t.subtitle}</p>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-16 z-30 bg-[var(--rowi-background)]/80 backdrop-blur-xl border-b border-[var(--rowi-border)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSection(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeSection === s.id
                      ? "bg-purple-500 text-white shadow-lg"
                      : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-card)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-16">

        {/* SECTION: Overview */}
        <section id="overview">
          <SectionHeader title={t.overview} icon={BarChart3} />

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard icon={Activity} value={TP_STATS.avgEQ.toFixed(1)} label={t.avgEQ} color="#7B2D8E" index={0} />
            <StatCard icon={Users} value={TP_STATS.totalAssessments.toLocaleString()} label={t.assessments} color="#3b82f6" index={1} />
            <StatCard icon={Globe} value={TP_STATS.countries.toString()} label={t.countries} color="#10b981" index={2} />
            <StatCard icon={Zap} value="IM" label={t.topCompetency} color="#f59e0b" index={3} />
          </div>

          {/* EQ Gauge + Pursuits */}
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[var(--rowi-card)] rounded-2xl p-8 border border-[var(--rowi-border)]"
            >
              <h3 className="text-lg font-semibold mb-6 text-center">{t.globalAvg}</h3>
              <EQGauge score={TP_STATS.avgEQ} color="#7B2D8E" />
              <p className="text-center text-xs text-[var(--rowi-muted)] mt-4">{t.seiScale}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--rowi-card)] rounded-2xl p-8 border border-[var(--rowi-border)]"
            >
              <h3 className="text-lg font-semibold mb-6">
                {lang === "es" ? "Tres Búsquedas" : "Three Pursuits"}
              </h3>
              <div className="space-y-6">
                {Object.entries(TP_PURSUITS).map(([key, p], i) => {
                  const Icon = p.icon;
                  const percent = ((p.avg - 65) / 70) * 100;
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: p.color }} />
                          <span className="font-medium text-sm">{lang === "es" ? p.labelEs : p.label}</span>
                        </div>
                        <span className="font-mono text-sm font-bold" style={{ color: p.color }}>
                          {p.avg.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-3 bg-[var(--rowi-border)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: p.color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.15 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Regional Distribution */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-500" />
              {t.regions}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TP_REGIONS.map((region, i) => (
                <motion.div
                  key={region.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[var(--rowi-card)] rounded-2xl p-5 border border-[var(--rowi-border)] text-center hover:shadow-md transition-shadow"
                >
                  <span className="text-3xl mb-2 block">{region.flag}</span>
                  <h4 className="font-semibold text-sm mb-1">{lang === "es" ? region.nameEs : region.name}</h4>
                  <p className="text-xs text-[var(--rowi-muted)]">{region.count.toLocaleString()} assessments</p>
                  <p className="text-lg font-bold text-purple-500 mt-2">EQ {region.avgEQ.toFixed(1)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: Competencies */}
        <section id="competencies">
          <SectionHeader title={t.competencies} icon={Brain} />

          <div className="bg-[var(--rowi-card)] rounded-2xl p-8 border border-[var(--rowi-border)]">
            <div className="flex items-center gap-4 mb-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>{t.avg}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>{t.topPerformer}</span>
              </div>
            </div>

            <div className="space-y-4">
              {TP_COMPETENCIES.map((comp, i) => (
                <CompetencyBar
                  key={comp.key}
                  name={lang === "es" ? comp.nameEs : comp.name}
                  avg={comp.avg}
                  topPerformer={comp.topPerformer}
                  color={comp.color}
                  index={i}
                  lang={lang}
                />
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--rowi-border)]">
              <p className="text-xs text-[var(--rowi-muted)] text-center">{t.seiScale}</p>
            </div>
          </div>

          {/* By Job Function */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              {t.byFunction}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {TP_JOB_FUNCTIONS.map((jf, i) => (
                <motion.div
                  key={jf.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[var(--rowi-card)] rounded-xl p-4 border border-[var(--rowi-border)] text-center hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl block mb-2">{jf.icon}</span>
                  <h4 className="font-medium text-xs mb-1 leading-tight">{lang === "es" ? jf.nameEs : jf.name}</h4>
                  <p className="text-[10px] text-[var(--rowi-muted)]">{jf.count.toLocaleString()}</p>
                  <p className="text-lg font-bold text-purple-500 mt-1">{jf.avgEQ.toFixed(1)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: Outcomes */}
        <section id="outcomes">
          <SectionHeader title={t.outcomes} icon={Target} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TP_OUTCOMES.map((outcome, i) => {
              const Icon = outcome.icon;
              const percent = ((outcome.avg - 65) / 70) * 100;
              return (
                <motion.div
                  key={outcome.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[var(--rowi-card)] rounded-2xl p-6 border border-[var(--rowi-border)] hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${outcome.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: outcome.color }} />
                  </div>
                  <h4 className="font-semibold mb-1">{lang === "es" ? outcome.labelEs : outcome.label}</h4>
                  <div className="text-3xl font-bold mb-3" style={{ color: outcome.color }}>
                    {outcome.avg.toFixed(1)}
                  </div>
                  <div className="h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: outcome.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${percent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* SECTION: Brain Profiles */}
        <section id="brainProfiles">
          <SectionHeader title={t.brainProfiles} icon={PieChart} />

          <div className="bg-[var(--rowi-card)] rounded-2xl p-8 border border-[var(--rowi-border)]">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {TP_BRAIN_PROFILES.map((profile, i) => (
                <motion.div
                  key={profile.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="text-center p-4 rounded-xl hover:bg-[var(--rowi-border)]/30 transition-colors"
                >
                  <span className="text-3xl block mb-2">{profile.emoji}</span>
                  <h4 className="font-semibold text-sm mb-1">{lang === "es" ? profile.nameEs : profile.name}</h4>
                  <div className="text-xl font-bold" style={{ color: profile.color }}>
                    {profile.percent}%
                  </div>
                  <p className="text-[10px] text-[var(--rowi-muted)] mt-1">{profile.count.toLocaleString()}</p>

                  {/* Mini bar */}
                  <div className="h-1.5 bg-[var(--rowi-border)] rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: profile.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${profile.percent * 5}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: Key Insights */}
        <section id="insights">
          <SectionHeader title={t.insights} icon={Sparkles} />

          <div className="grid md:grid-cols-2 gap-4">
            {TP_KEY_INSIGHTS.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[var(--rowi-card)] rounded-2xl p-6 border border-[var(--rowi-border)] hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${insight.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: insight.color }} />
                    </div>
                    <p className="text-sm leading-relaxed">{lang === "es" ? insight.es : insight.en}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Info Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-sm text-[var(--rowi-muted)]"
        >
          <Shield className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
          <div>
            <p>{t.infoTip}</p>
            <p className="text-xs mt-1 text-purple-400">{t.poweredBy}</p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-12 text-white text-center">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <Image src="/rowivectors/Rowi-01.png" alt="Rowi" fill className="object-contain" />
              </div>
              <h2 className="text-3xl font-bold mb-4">{t.ctaTitle}</h2>
              <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">{t.ctaSubtitle}</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/demo/tp/onboarding"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-purple-600 font-bold text-lg hover:bg-opacity-90 transition-all shadow-xl"
                >
                  {t.tryOnboarding}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white/30 text-white font-bold text-lg hover:bg-white/10 transition-all"
                >
                  {t.ctaButton}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-8">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[var(--rowi-border)] hover:border-purple-500 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
          >
            {lang === "es" ? "Crear cuenta" : "Create account"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Section Header Component
========================================================= */
function SectionHeader({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex items-center gap-3 mb-6"
    >
      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-purple-500" />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
    </motion.div>
  );
}
