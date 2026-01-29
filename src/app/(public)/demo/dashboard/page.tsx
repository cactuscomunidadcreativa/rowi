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
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Datos de ejemplo para el demo
========================================================= */
const DEMO_USER = {
  name: "María García",
  avatar: "/rowivectors/Rowi-06.png",
  level: "Diestro",
  eqTotal: 112,
  eqMax: 135,
};

const DEMO_PURSUITS = {
  know: { score: 38, max: 45, label: "Know Yourself", color: "#3b82f6" },
  choose: { score: 35, max: 45, label: "Choose Yourself", color: "#ef4444" },
  give: { score: 39, max: 45, label: "Give Yourself", color: "#10b981" },
};

const DEMO_COMPETENCIES = [
  { key: "EL", name: "Enhance Emotional Literacy", nameEs: "Alfabetización Emocional", score: 14, max: 17, pursuit: "know" },
  { key: "RP", name: "Recognize Patterns", nameEs: "Reconocer Patrones", score: 12, max: 17, pursuit: "know" },
  { key: "ACT", name: "Apply Consequential Thinking", nameEs: "Pensamiento Consecuente", score: 12, max: 17, pursuit: "know" },
  { key: "NE", name: "Navigate Emotions", nameEs: "Navegar Emociones", score: 13, max: 17, pursuit: "choose" },
  { key: "IM", name: "Engage Intrinsic Motivation", nameEs: "Motivación Intrínseca", score: 11, max: 17, pursuit: "choose" },
  { key: "OP", name: "Exercise Optimism", nameEs: "Ejercitar Optimismo", score: 11, max: 17, pursuit: "choose" },
  { key: "EMP", name: "Increase Empathy", nameEs: "Incrementar Empatía", score: 15, max: 17, pursuit: "give" },
  { key: "NG", name: "Pursue Noble Goals", nameEs: "Metas Nobles", score: 14, max: 17, pursuit: "give" },
];

const DEMO_OUTCOMES = [
  { key: "effectiveness", name: "Effectiveness", nameEs: "Efectividad", score: 78 },
  { key: "relationships", name: "Relationships", nameEs: "Relaciones", score: 85 },
  { key: "wellbeing", name: "Wellbeing", nameEs: "Bienestar", score: 72 },
  { key: "quality", name: "Quality of Life", nameEs: "Calidad de Vida", score: 80 },
];

/* =========================================================
   Traducciones
========================================================= */
const translations = {
  es: {
    badge: "Demo Interactivo",
    title: "Dashboard",
    subtitle: "Tu centro de control emocional con todas tus métricas SEI",
    back: "Volver al tour",
    next: "Siguiente: Affinity",

    userGreeting: "¡Hola",
    userLevel: "Nivel",

    eqScore: "Puntuación EQ Total",
    eqOf: "de",

    pursuitsTitle: "Los 3 Pursuits",
    pursuitsDesc: "El modelo SEI de Six Seconds organiza las 8 competencias en 3 pursuits",

    competenciesTitle: "8 Competencias SEI",
    competenciesDesc: "Cada competencia mide un aspecto específico de tu inteligencia emocional",

    outcomesTitle: "Resultados de Vida",
    outcomesDesc: "Cómo tu inteligencia emocional impacta diferentes áreas de tu vida",

    tipTitle: "Esto es un demo",
    tipDesc: "En tu cuenta real, estos datos vendrán de tu evaluación SEI de Six Seconds y se actualizarán con tu progreso.",

    createAccount: "Crear mi cuenta",
  },
  en: {
    badge: "Interactive Demo",
    title: "Dashboard",
    subtitle: "Your emotional control center with all your SEI metrics",
    back: "Back to tour",
    next: "Next: Affinity",

    userGreeting: "Hello",
    userLevel: "Level",

    eqScore: "Total EQ Score",
    eqOf: "of",

    pursuitsTitle: "The 3 Pursuits",
    pursuitsDesc: "The Six Seconds SEI model organizes the 8 competencies into 3 pursuits",

    competenciesTitle: "8 SEI Competencies",
    competenciesDesc: "Each competency measures a specific aspect of your emotional intelligence",

    outcomesTitle: "Life Outcomes",
    outcomesDesc: "How your emotional intelligence impacts different areas of your life",

    tipTitle: "This is a demo",
    tipDesc: "In your real account, this data will come from your Six Seconds SEI assessment and update with your progress.",

    createAccount: "Create my account",
  },
};

/* =========================================================
   Componentes internos
========================================================= */
function EQCircle({ score, max, lang }: { score: number; max: number; lang: string }) {
  const percentage = (score / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="45"
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          className="text-gray-200 dark:text-zinc-800"
        />
        <motion.circle
          cx="80"
          cy="80"
          r="45"
          stroke="url(#eqGradient)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
        <defs>
          <linearGradient id="eqGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--rowi-primary)" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-sm text-[var(--rowi-muted)]">
          {lang === "es" ? "de" : "of"} {max}
        </span>
      </div>
    </div>
  );
}

function PursuitBar({ pursuit, lang }: { pursuit: typeof DEMO_PURSUITS.know; lang: string }) {
  const percentage = (pursuit.score / pursuit.max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{pursuit.label}</span>
        <span className="text-[var(--rowi-muted)]">{pursuit.score}/{pursuit.max}</span>
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

function CompetencyCard({ comp, lang }: { comp: typeof DEMO_COMPETENCIES[0]; lang: string }) {
  const percentage = (comp.score / comp.max) * 100;
  const pursuitColors: Record<string, string> = {
    know: "#3b82f6",
    choose: "#ef4444",
    give: "#10b981",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: pursuitColors[comp.pursuit] }}
        >
          {comp.key}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {lang === "es" ? comp.nameEs : comp.name}
          </div>
          <div className="text-xs text-[var(--rowi-muted)]">{comp.score}/{comp.max}</div>
        </div>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: pursuitColors[comp.pursuit] }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

function OutcomeCard({ outcome, lang }: { outcome: typeof DEMO_OUTCOMES[0]; lang: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm text-center"
    >
      <div className="text-3xl font-bold mb-1">{outcome.score}%</div>
      <div className="text-sm text-[var(--rowi-muted)]">
        {lang === "es" ? outcome.nameEs : outcome.name}
      </div>
      <div className="mt-3 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--rowi-primary)] to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${outcome.score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

/* =========================================================
   Página principal
========================================================= */
export default function DemoDashboardPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  return (
    <div className="min-h-screen pt-16 pb-24 bg-[var(--rowi-background)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--rowi-primary)]/10 via-purple-500/5 to-transparent py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[var(--rowi-primary)]/20 text-[var(--rowi-primary)] mb-4">
                <Sparkles className="w-3 h-3" />
                {t.badge}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{t.title}</h1>
              <p className="text-[var(--rowi-muted)]">{t.subtitle}</p>
            </div>

            {/* User Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-xl flex items-center gap-4"
            >
              <div className="relative w-16 h-16">
                <Image
                  src={DEMO_USER.avatar}
                  alt={DEMO_USER.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-sm text-[var(--rowi-muted)]">{t.userGreeting},</div>
                <div className="font-bold text-lg">{DEMO_USER.name}</div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <Award className="w-3 h-3" />
                  {t.userLevel}: {DEMO_USER.level}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* EQ Score + Pursuits */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* EQ Total */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[var(--rowi-primary)]" />
              {t.eqScore}
            </h2>
            <div className="flex items-center justify-center">
              <EQCircle score={DEMO_USER.eqTotal} max={DEMO_USER.eqMax} lang={lang} />
            </div>
          </motion.div>

          {/* Pursuits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl"
          >
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--rowi-primary)]" />
              {t.pursuitsTitle}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.pursuitsDesc}</p>
            <div className="space-y-4">
              <PursuitBar pursuit={DEMO_PURSUITS.know} lang={lang} />
              <PursuitBar pursuit={DEMO_PURSUITS.choose} lang={lang} />
              <PursuitBar pursuit={DEMO_PURSUITS.give} lang={lang} />
            </div>
          </motion.div>
        </div>

        {/* Competencies */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Zap className="w-6 h-6 text-[var(--rowi-primary)]" />
              {t.competenciesTitle}
            </h2>
            <p className="text-[var(--rowi-muted)]">{t.competenciesDesc}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEMO_COMPETENCIES.map((comp, i) => (
              <CompetencyCard key={comp.key} comp={comp} lang={lang} />
            ))}
          </div>
        </div>

        {/* Outcomes */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[var(--rowi-primary)]" />
              {t.outcomesTitle}
            </h2>
            <p className="text-[var(--rowi-muted)]">{t.outcomesDesc}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEMO_OUTCOMES.map((outcome) => (
              <OutcomeCard key={outcome.key} outcome={outcome} lang={lang} />
            ))}
          </div>
        </div>

        {/* Info Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 flex gap-4"
        >
          <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">{t.tipTitle}</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">{t.tipDesc}</p>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-8 border-t border-[var(--rowi-border)]">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.back}
          </Link>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--rowi-primary)] to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {t.createAccount}
            </Link>
            <Link
              href="/demo/affinity"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-primary)] text-[var(--rowi-primary)] hover:bg-[var(--rowi-primary)] hover:text-white transition-colors font-medium"
            >
              {t.next}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
