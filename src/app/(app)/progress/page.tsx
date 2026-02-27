"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Brain,
  Loader2,
  Target,
  Sparkles,
  ChevronRight,
  BarChart3,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Award,
  Compass,
  BookOpen,
  Heart,
  Zap,
  Shield,
  Eye,
  Flame,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import { EQ_MAX, EQ_LEVELS, getEqLevel, toPercentOf135 } from "@/domains/eq/lib/eqLevels";

/* =========================================================
   📈 Progreso — Vista de usuario
   =========================================================
   Muestra el progreso EQ del usuario con competencias,
   talentos y áreas de desarrollo
========================================================= */

// Competency metadata
const COMPETENCY_META: Record<string, { icon: React.ElementType; color: string; nameEs: string; nameEn: string }> = {
  EL:  { icon: BookOpen, color: "#3b82f6", nameEs: "Alfabetización Emocional", nameEn: "Emotional Literacy" },
  RP:  { icon: Eye,      color: "#8b5cf6", nameEs: "Reconocer Patrones",      nameEn: "Recognize Patterns" },
  ACT: { icon: Target,   color: "#06b6d4", nameEs: "Pensamiento Consecuente", nameEn: "Consequential Thinking" },
  NE:  { icon: Compass,  color: "#10b981", nameEs: "Navegar Emociones",       nameEn: "Navigate Emotions" },
  IM:  { icon: Zap,      color: "#f59e0b", nameEs: "Motivación Intrínseca",   nameEn: "Intrinsic Motivation" },
  OP:  { icon: Star,     color: "#ec4899", nameEs: "Ejercitar Optimismo",     nameEn: "Exercise Optimism" },
  EMP: { icon: Heart,    color: "#ef4444", nameEs: "Aumentar Empatía",        nameEn: "Increase Empathy" },
  NG:  { icon: Shield,   color: "#14b8a6", nameEs: "Metas Nobles",            nameEn: "Noble Goals" },
};

export default function ProgressPage() {
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const res = await fetch("/api/eq/me", { cache: "no-store" });
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Error loading progress:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const safeLang = mounted ? lang : "es";

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--rowi-g2)] animate-spin" />
      </div>
    );
  }

  if (!data?.eq) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <Brain className="w-16 h-16 text-gray-300 dark:text-zinc-600" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          {safeLang === "es" ? "Sin datos de progreso" : "No progress data"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          {safeLang === "es"
            ? "Completa tu evaluación SEI para ver tu progreso de Inteligencia Emocional."
            : "Complete your SEI assessment to see your Emotional Intelligence progress."}
        </p>
        <Link
          href="/dashboard"
          className="mt-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          {safeLang === "es" ? "Ir al Dashboard" : "Go to Dashboard"}
        </Link>
      </div>
    );
  }

  const eqTotal = data.eq.total ?? 0;
  const eqLevel = getEqLevel(eqTotal);
  const comps = data.eq.competencias || {};
  const pursuits = data.eq.pursuits || {};
  const prev = data.previous;

  // Sort competencies
  const compEntries = Object.entries(comps)
    .filter(([, v]) => typeof v === "number" && v !== null)
    .sort((a, b) => ((b[1] as number) ?? 0) - ((a[1] as number) ?? 0));

  const strengths = compEntries.slice(0, 3);
  const growthAreas = [...compEntries].reverse().slice(0, 3);

  // Pursuit labels
  const pursuitLabels: Record<string, { es: string; en: string; color: string }> = {
    know:   { es: "Conócete", en: "Know Yourself", color: "#3b82f6" },
    choose: { es: "Elígete",  en: "Choose Yourself", color: "#10b981" },
    give:   { es: "Entrégate", en: "Give Yourself", color: "#f59e0b" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center shadow-lg shadow-[var(--rowi-g2)]/25">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {safeLang === "es" ? "Mi Progreso EQ" : "My EQ Progress"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {safeLang === "es"
                  ? "Tu evolución en Inteligencia Emocional"
                  : "Your Emotional Intelligence evolution"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-6">
        {/* EQ Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Score circle */}
            <div className="flex items-center gap-6">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center border-4"
                style={{ borderColor: eqLevel.color, backgroundColor: `${eqLevel.color}10` }}
              >
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: eqLevel.color }}>{eqTotal}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">/ {EQ_MAX}</p>
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{eqLevel.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {safeLang === "es" ? "Puntuación EQ Total" : "Total EQ Score"}
                </p>
                {prev?.eq?.total != null && (
                  <div className="flex items-center gap-1 mt-1">
                    {eqTotal > prev.eq.total ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : eqTotal < prev.eq.total ? (
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      eqTotal > prev.eq.total ? "text-green-500" : eqTotal < prev.eq.total ? "text-red-400" : "text-gray-400"
                    }`}>
                      {eqTotal > prev.eq.total ? "+" : ""}{eqTotal - prev.eq.total}
                      {" "}{safeLang === "es" ? "vs anterior" : "vs previous"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pursuits */}
            <div className="flex-1 grid grid-cols-3 gap-3 sm:pl-6 sm:border-l sm:border-gray-200 dark:sm:border-zinc-700">
              {Object.entries(pursuitLabels).map(([key, meta]) => {
                const val = pursuits[key] ?? 0;
                const pct = Math.min(100, Math.round((val / 135) * 100));
                return (
                  <div key={key} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100 dark:text-zinc-700" />
                        <circle
                          cx="18" cy="18" r="15" fill="none"
                          stroke={meta.color} strokeWidth="3"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white">
                        {val || "—"}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {safeLang === "es" ? meta.es : meta.en}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Strengths & Growth Areas */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <Award className="w-5 h-5 text-green-500" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {safeLang === "es" ? "Tus Fortalezas" : "Your Strengths"}
              </h2>
            </div>
            <div className="space-y-4">
              {strengths.map(([key, val], i) => {
                const meta = COMPETENCY_META[key];
                const score = val as number;
                const pct = Math.min(100, Math.round((score / 135) * 100));
                const Icon = meta?.icon ?? Brain;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: meta?.color || "#666" }} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {safeLang === "es" ? meta?.nameEs : meta?.nameEn || key}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{score}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: meta?.color || "#10b981" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Growth Areas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {safeLang === "es" ? "Áreas de Desarrollo" : "Growth Areas"}
              </h2>
            </div>
            <div className="space-y-4">
              {growthAreas.map(([key, val], i) => {
                const meta = COMPETENCY_META[key];
                const score = val as number;
                const pct = Math.min(100, Math.round((score / 135) * 100));
                const Icon = meta?.icon ?? Brain;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: meta?.color || "#666" }} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {safeLang === "es" ? meta?.nameEs : meta?.nameEn || key}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{score}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: meta?.color || "#f59e0b" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* All 8 Competencies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-[var(--rowi-g2)]/10">
              <BarChart3 className="w-5 h-5 text-[var(--rowi-g2)]" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {safeLang === "es" ? "Todas las Competencias" : "All Competencies"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {compEntries.map(([key, val]) => {
              const meta = COMPETENCY_META[key];
              const score = val as number;
              const prevScore = prev?.eq?.competencias?.[key] as number | undefined;
              const delta = prevScore != null ? score - prevScore : null;
              const pct = Math.min(100, Math.round((score / 135) * 100));
              const Icon = meta?.icon ?? Brain;

              return (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${meta?.color || "#666"}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: meta?.color || "#666" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {safeLang === "es" ? meta?.nameEs : meta?.nameEn || key}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{score}</span>
                        {delta != null && delta !== 0 && (
                          <span className={`text-xs font-medium ${delta > 0 ? "text-green-500" : "text-red-400"}`}>
                            {delta > 0 ? "+" : ""}{delta}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: meta?.color || "#666" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid sm:grid-cols-2 gap-4"
        >
          <Link
            href="/learning"
            className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 hover:border-[var(--rowi-g2)]/50 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-violet-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {safeLang === "es" ? "Centro de Aprendizaje" : "Learning Hub"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {safeLang === "es" ? "Desarrolla tus competencias" : "Develop your competencies"}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--rowi-g2)] group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/eco"
            className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 hover:border-[var(--rowi-g2)]/50 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {safeLang === "es" ? "Comunicación ECO" : "ECO Communication"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {safeLang === "es" ? "Mensajes emocionalmente inteligentes" : "Emotionally intelligent messages"}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--rowi-g2)] group-hover:translate-x-1 transition-all" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
