"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Heart,
  Target,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  Info,
  Users,
  Building2,
  Activity,
  BarChart3,
  Globe,
  Shield,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badgeEQDashboard: "EQ Dashboard",
    pageTitle: "Teleperformance EQ Dashboard",
    pageSubtitle: "Métricas agregadas de inteligencia emocional de 14,886 evaluaciones SEI en 42 países",
    levelEnterprise: "Enterprise",
    assessments: "evaluaciones",
    globalEQAverage: "Promedio EQ Global",
    tpGlobalAvg: "Promedio Global TP",
    seiScaleLabel: "Escala SEI: 65–135 | Basado en {count} evaluaciones",
    threePursuits: "Las 3 Búsquedas",
    threePursuitsDesc: "El modelo SEI de Six Seconds organiza 8 competencias en 3 búsquedas",
    pursuitKnow: "Conócete",
    pursuitChoose: "Elígete",
    pursuitGive: "Entrégate",
    competenciesTitle: "8 Competencias SEI",
    competenciesDesc: "Promedio vs mejores puntajes en todas las evaluaciones de TP",
    compEL: "Alfabetización Emocional",
    compRP: "Reconocer Patrones",
    compACT: "Pensamiento Consecuente",
    compNE: "Navegar Emociones",
    compIM: "Motivación Intrínseca",
    compOP: "Ejercer Optimismo",
    compEMP: "Aumentar Empatía",
    compNG: "Metas Nobles",
    compAvg: "Prom",
    compTop: "Mejor",
    outcomesTitle: "Resultados de Vida",
    outcomesDesc: "Cómo la inteligencia emocional impacta los resultados de vida en TP",
    outcomeEffectiveness: "Efectividad",
    outcomeRelationships: "Relaciones",
    outcomeWellbeing: "Bienestar",
    outcomeQuality: "Calidad de Vida",
    infoTitle: "Datos TP en Vivo",
    infoDesc: "Este dashboard muestra datos reales agregados de 14,886 evaluaciones SEI de Teleperformance. Todos los datos individuales están anonimizados. Escala SEI: 65–135.",
    navBenchmark: "Benchmark",
    regionNorthAmerica: "Norteamérica",
    regionAsiaPacific: "Asia Pacífico",
    regionEMEA: "EMEA",
    regionLatinAmerica: "Latinoamérica",
  },
  en: {
    backToHub: "TP Hub",
    badgeEQDashboard: "EQ Dashboard",
    pageTitle: "Teleperformance EQ Dashboard",
    pageSubtitle: "Aggregated emotional intelligence metrics from 14,886 SEI assessments across 42 countries",
    levelEnterprise: "Enterprise",
    assessments: "assessments",
    globalEQAverage: "Global EQ Average",
    tpGlobalAvg: "TP Global Avg",
    seiScaleLabel: "SEI Scale: 65–135 | Based on {count} assessments",
    threePursuits: "The 3 Pursuits",
    threePursuitsDesc: "Six Seconds SEI model organizes 8 competencies into 3 pursuits",
    pursuitKnow: "Know Yourself",
    pursuitChoose: "Choose Yourself",
    pursuitGive: "Give Yourself",
    competenciesTitle: "8 SEI Competencies",
    competenciesDesc: "Average vs top performer scores across all TP assessments",
    compEL: "Enhance Emotional Literacy",
    compRP: "Recognize Patterns",
    compACT: "Apply Consequential Thinking",
    compNE: "Navigate Emotions",
    compIM: "Engage Intrinsic Motivation",
    compOP: "Exercise Optimism",
    compEMP: "Increase Empathy",
    compNG: "Pursue Noble Goals",
    compAvg: "Avg",
    compTop: "Top",
    outcomesTitle: "Life Outcomes",
    outcomesDesc: "How emotional intelligence impacts life outcomes across TP",
    outcomeEffectiveness: "Effectiveness",
    outcomeRelationships: "Relationships",
    outcomeWellbeing: "Wellbeing",
    outcomeQuality: "Quality of Life",
    infoTitle: "Live TP Data",
    infoDesc: "This dashboard shows real aggregated data from 14,886 Teleperformance SEI assessments. All individual data is anonymized. SEI Scale: 65–135.",
    navBenchmark: "Benchmark",
    regionNorthAmerica: "North America",
    regionAsiaPacific: "Asia Pacific",
    regionEMEA: "EMEA",
    regionLatinAmerica: "Latin America",
  },
};

/* =========================================================
   TP Dashboard — Full EQ Dashboard with TP Data
   Shows aggregated TP data in individual dashboard format
========================================================= */

const TP_USER = {
  name: "TP Global Organization",
  avatar: "/rowivectors/Rowi-01.png",
  level: "Enterprise",
  eqTotal: 98.7,
  eqMax: 135,
  eqMin: 65,
  totalAssessments: 14886,
};

const TP_PURSUITS = {
  know: { score: 98.3, max: 135, min: 65, color: "#3b82f6" },
  choose: { score: 98.8, max: 135, min: 65, color: "#10b981" },
  give: { score: 98.2, max: 135, min: 65, color: "#f59e0b" },
};

const TP_COMPETENCIES = [
  { key: "EL", tKey: "compEL" as const, score: 97.3, max: 135, pursuit: "know", topPerformer: 118.2 },
  { key: "RP", tKey: "compRP" as const, score: 99.1, max: 135, pursuit: "know", topPerformer: 116.8 },
  { key: "ACT", tKey: "compACT" as const, score: 98.4, max: 135, pursuit: "know", topPerformer: 119.5 },
  { key: "NE", tKey: "compNE" as const, score: 96.8, max: 135, pursuit: "choose", topPerformer: 117.1 },
  { key: "IM", tKey: "compIM" as const, score: 100.2, max: 135, pursuit: "choose", topPerformer: 115.9 },
  { key: "OP", tKey: "compOP" as const, score: 99.5, max: 135, pursuit: "choose", topPerformer: 116.3 },
  { key: "EMP", tKey: "compEMP" as const, score: 98.9, max: 135, pursuit: "give", topPerformer: 118.7 },
  { key: "NG", tKey: "compNG" as const, score: 97.6, max: 135, pursuit: "give", topPerformer: 114.2 },
];

const TP_OUTCOMES = [
  { key: "effectiveness", tKey: "outcomeEffectiveness" as const, score: 101.2 },
  { key: "relationships", tKey: "outcomeRelationships" as const, score: 99.8 },
  { key: "wellbeing", tKey: "outcomeWellbeing" as const, score: 97.4 },
  { key: "quality", tKey: "outcomeQuality" as const, score: 98.1 },
];

const TP_REGIONS = [
  { tKey: "regionNorthAmerica" as const, count: 5214, avgEQ: 99.8, flag: "\u{1F1FA}\u{1F1F8}" },
  { tKey: "regionAsiaPacific" as const, count: 3872, avgEQ: 97.2, flag: "\u{1F1F5}\u{1F1ED}" },
  { tKey: "regionEMEA" as const, count: 3418, avgEQ: 99.1, flag: "\u{1F1EC}\u{1F1E7}" },
  { tKey: "regionLatinAmerica" as const, count: 2382, avgEQ: 98.4, flag: "\u{1F1F2}\u{1F1FD}" },
];

/* =========================================================
   Components
========================================================= */
function EQCircle({ score, max, min, avgLabel }: { score: number; max: number; min: number; avgLabel: string }) {
  const percentage = ((score - min) / (max - min)) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-44 h-44">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="45" stroke="currentColor" strokeWidth="10" fill="none" className="text-gray-200 dark:text-zinc-800" />
        <motion.circle
          cx="80" cy="80" r="45"
          stroke="url(#eqGradientTP)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
        <defs>
          <linearGradient id="eqGradientTP" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7B2D8E" />
            <stop offset="100%" stopColor="#E31937" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-4xl font-bold text-purple-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {score.toFixed(1)}
        </motion.span>
        <span className="text-sm text-[var(--rowi-muted)]">/ {max}</span>
        <span className="text-[10px] text-[var(--rowi-muted)]">{avgLabel}</span>
      </div>
    </div>
  );
}

function PursuitBar({ pursuit, label }: { pursuit: { score: number; max: number; min: number; color: string }; label: string }) {
  const percentage = ((pursuit.score - pursuit.min) / (pursuit.max - pursuit.min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-[var(--rowi-muted)] font-mono">{pursuit.score.toFixed(1)}</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: pursuit.color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function CompetencyCard({ comp, name, avgLabel, topLabel }: { comp: typeof TP_COMPETENCIES[0]; name: string; avgLabel: string; topLabel: string }) {
  const percentage = ((comp.score - 65) / 70) * 100;
  const topPercentage = ((comp.topPerformer - 65) / 70) * 100;
  const pursuitColors: Record<string, string> = { know: "#3b82f6", choose: "#10b981", give: "#f59e0b" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: pursuitColors[comp.pursuit] }}>
          {comp.key}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{name}</div>
          <div className="text-xs text-[var(--rowi-muted)]">
            {avgLabel}: {comp.score.toFixed(1)} | {topLabel}: {comp.topPerformer.toFixed(1)}
          </div>
        </div>
      </div>
      <div className="relative h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute h-full rounded-full opacity-30"
          style={{ backgroundColor: pursuitColors[comp.pursuit] }}
          initial={{ width: 0 }}
          animate={{ width: `${topPercentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.div
          className="absolute h-full rounded-full"
          style={{ backgroundColor: pursuitColors[comp.pursuit] }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

function OutcomeCard({ outcome, name }: { outcome: typeof TP_OUTCOMES[0]; name: string }) {
  const percentage = ((outcome.score - 65) / 70) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm text-center border border-gray-100 dark:border-zinc-800"
    >
      <div className="text-3xl font-bold mb-1 text-purple-600">{outcome.score.toFixed(1)}</div>
      <div className="text-sm text-[var(--rowi-muted)]">{name}</div>
      <div className="mt-3 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

/* =========================================================
   Main Page
========================================================= */
export default function TPDashboardPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
              <Sparkles className="w-3 h-3" /> {t.badgeEQDashboard}
            </span>
            <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
            <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-zinc-800 flex items-center gap-4"
          >
            <div className="relative w-16 h-16">
              <Image src={TP_USER.avatar} alt="TP" fill className="object-contain" />
            </div>
            <div>
              <div className="font-bold text-lg">{TP_USER.name}</div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Award className="w-3 h-3" /> {t.levelEnterprise}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TP_REGIONS.map((region, i) => (
          <motion.div
            key={region.tKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 text-center"
          >
            <span className="text-2xl block mb-1">{region.flag}</span>
            <div className="text-xs text-[var(--rowi-muted)] mb-1">{t[region.tKey]}</div>
            <div className="text-lg font-bold text-purple-600">{region.avgEQ.toFixed(1)}</div>
            <div className="text-[10px] text-[var(--rowi-muted)]">{region.count.toLocaleString()} {t.assessments}</div>
          </motion.div>
        ))}
      </div>

      {/* EQ Score + Pursuits */}
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" /> {t.globalEQAverage}
          </h2>
          <div className="flex items-center justify-center">
            <EQCircle score={TP_USER.eqTotal} max={TP_USER.eqMax} min={TP_USER.eqMin} avgLabel={t.tpGlobalAvg} />
          </div>
          <p className="text-xs text-[var(--rowi-muted)] text-center mt-4">
            {t.seiScaleLabel.replace("{count}", TP_USER.totalAssessments.toLocaleString())}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" /> {t.threePursuits}
          </h2>
          <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.threePursuitsDesc}</p>
          <div className="space-y-5">
            <PursuitBar pursuit={TP_PURSUITS.know} label={t.pursuitKnow} />
            <PursuitBar pursuit={TP_PURSUITS.choose} label={t.pursuitChoose} />
            <PursuitBar pursuit={TP_PURSUITS.give} label={t.pursuitGive} />
          </div>
        </motion.div>
      </div>

      {/* Competencies */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-500" /> {t.competenciesTitle}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.competenciesDesc}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TP_COMPETENCIES.map((comp) => (
            <CompetencyCard key={comp.key} comp={comp} name={t[comp.tKey]} avgLabel={t.compAvg} topLabel={t.compTop} />
          ))}
        </div>
      </div>

      {/* Outcomes */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-500" /> {t.outcomesTitle}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.outcomesDesc}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TP_OUTCOMES.map((outcome) => (
            <OutcomeCard key={outcome.key} outcome={outcome} name={t[outcome.tKey]} />
          ))}
        </div>
      </div>

      {/* Info Tip */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {t.infoDesc}
          </p>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.backToHub}
        </Link>
        <Link href="/hub/admin/tp/benchmark" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.navBenchmark} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
