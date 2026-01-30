// src/app/hub/eq/page.tsx
// ============================================================
// EQ Dashboard - Panel principal de inteligencia emocional (traducible)
// Muestra resumen de EQ, competencias, outcomes y progreso
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  Brain,
  Target,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Heart,
  Loader2,
  Activity,
  BarChart3,
  Calendar,
  Star,
  Lightbulb,
  Clock,
  Zap,
} from "lucide-react";

interface EQData {
  user: { name: string; email: string };
  mood?: { recentText: string; recentEmoji: string };
  brain?: { style: string | null };
  eq?: {
    total: number | null;
    competencias: Record<string, number | null>;
    pursuits: { know: number | null; choose: number | null; give: number | null };
  };
  outcomes?: {
    overall4: number | null;
    effectiveness: { score: number | null };
    relationships: { score: number | null };
    wellbeing: { score: number | null };
    qualityOfLife: { score: number | null };
  };
}

export default function EQDashboardPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EQData | null>(null);

  // Traducciones
  const txt = {
    loading: t("eq.loading", locale === "en" ? "Loading EQ profile..." : "Cargando perfil EQ..."),
    title: t("eq.title", locale === "en" ? "My Emotional Intelligence" : "Mi Inteligencia Emocional"),
    subtitle: t("eq.subtitle", locale === "en" ? "Your EQ profile based on Six Seconds model" : "Tu perfil EQ basado en el modelo Six Seconds"),
    noData: t("eq.noData", locale === "en" ? "You don't have EQ data yet" : "Aún no tienes datos EQ"),
    noDataDesc: t("eq.noDataDesc", locale === "en" ? "To see your emotional intelligence profile, you need to complete a Six Seconds SEI assessment." : "Para ver tu perfil de inteligencia emocional, necesitas completar una evaluación SEI de Six Seconds."),
    linkSEI: t("eq.linkSEI", locale === "en" ? "Link SEI Assessment" : "Vincular SEI Assessment"),
    eqTotal: t("eq.eqTotal", "EQ Total"),
    generalScore: t("eq.generalScore", locale === "en" ? "Overall emotional intelligence score" : "Puntuación general de inteligencia emocional"),
    pursuits: t("eq.pursuits", "Pursuits"),
    competencies: t("eq.competencies", locale === "en" ? "EQ Competencies" : "Competencias EQ"),
    viewDetails: t("eq.viewDetails", locale === "en" ? "View details" : "Ver detalles"),
    lifeOutcomes: t("eq.lifeOutcomes", locale === "en" ? "Life Outcomes" : "Outcomes de Vida"),
    overall: t("eq.overall", "Overall"),
    // Competencies
    compEL: t("eq.comp.EL", locale === "en" ? "Emotional Literacy" : "Alfabetización Emocional"),
    compRP: t("eq.comp.RP", locale === "en" ? "Recognize Patterns" : "Reconocer Patrones"),
    compACT: t("eq.comp.ACT", locale === "en" ? "Apply Consequential Thinking" : "Pensamiento Consecuente"),
    compNE: t("eq.comp.NE", locale === "en" ? "Navigate Emotions" : "Navegar Emociones"),
    compIM: t("eq.comp.IM", locale === "en" ? "Engage Intrinsic Motivation" : "Motivación Intrínseca"),
    compOP: t("eq.comp.OP", locale === "en" ? "Exercise Optimism" : "Ejercitar Optimismo"),
    compEMP: t("eq.comp.EMP", locale === "en" ? "Increase Empathy" : "Incrementar Empatía"),
    compNG: t("eq.comp.NG", locale === "en" ? "Pursue Noble Goals" : "Nobles Metas"),
    // Pursuits
    pursKnow: t("eq.purs.know", "Know Yourself"),
    pursChoose: t("eq.purs.choose", "Choose Yourself"),
    pursGive: t("eq.purs.give", "Give Yourself"),
    // Outcomes
    outEffectiveness: t("eq.out.effectiveness", locale === "en" ? "Effectiveness" : "Efectividad"),
    outRelationships: t("eq.out.relationships", locale === "en" ? "Relationships" : "Relaciones"),
    outWellbeing: t("eq.out.wellbeing", locale === "en" ? "Wellbeing" : "Bienestar"),
    outQuality: t("eq.out.quality", locale === "en" ? "Quality of Life" : "Calidad de Vida"),
    // Quick actions
    brainTalents: t("eq.brainTalents", "Brain Talents"),
    brainTalentsDesc: t("eq.brainTalentsDesc", locale === "en" ? "Your 18 brain talents" : "Tus 18 talentos cerebrales"),
    successFactors: t("eq.successFactors", "Success Factors"),
    successFactorsDesc: t("eq.successFactorsDesc", locale === "en" ? "The 8 success factors" : "Los 8 factores de éxito"),
    seiHistory: t("eq.seiHistory", locale === "en" ? "SEI History" : "Historial SEI"),
    seiHistoryDesc: t("eq.seiHistoryDesc", locale === "en" ? "View your previous snapshots" : "Ver tus snapshots anteriores"),
    myProgress: t("eq.myProgress", locale === "en" ? "My Progress" : "Mi Progreso"),
    myProgressDesc: t("eq.myProgressDesc", locale === "en" ? "Your EQ evolution" : "Evolución de tu EQ"),
    insights: t("eq.insights", "Insights"),
    insightsDesc: t("eq.insightsDesc", locale === "en" ? "Personalized recommendations" : "Recomendaciones personalizadas"),
  };

  const competencyLabels: Record<string, { name: string; color: string }> = {
    EL: { name: txt.compEL, color: "from-blue-500 to-blue-600" },
    RP: { name: txt.compRP, color: "from-purple-500 to-purple-600" },
    ACT: { name: txt.compACT, color: "from-indigo-500 to-indigo-600" },
    NE: { name: txt.compNE, color: "from-cyan-500 to-cyan-600" },
    IM: { name: txt.compIM, color: "from-amber-500 to-amber-600" },
    OP: { name: txt.compOP, color: "from-yellow-500 to-yellow-600" },
    EMP: { name: txt.compEMP, color: "from-pink-500 to-pink-600" },
    NG: { name: txt.compNG, color: "from-emerald-500 to-emerald-600" },
  };

  const pursuitLabels: Record<string, { name: string; icon: any; color: string }> = {
    know: { name: txt.pursKnow, icon: Brain, color: "text-blue-400" },
    choose: { name: txt.pursChoose, icon: Target, color: "text-purple-400" },
    give: { name: txt.pursGive, icon: Heart, color: "text-pink-400" },
  };

  const outcomeLabels: Record<string, { name: string; icon: any; color: string }> = {
    effectiveness: { name: txt.outEffectiveness, icon: Zap, color: "text-amber-400" },
    relationships: { name: txt.outRelationships, icon: Heart, color: "text-pink-400" },
    wellbeing: { name: txt.outWellbeing, icon: Sparkles, color: "text-green-400" },
    qualityOfLife: { name: txt.outQuality, icon: Star, color: "text-purple-400" },
  };

  useEffect(() => {
    loadEQData();
  }, []);

  async function loadEQData() {
    try {
      const res = await fetch("/api/eq/me");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error loading EQ data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{txt.loading}</span>
        </div>
      </div>
    );
  }

  const hasEQData = data?.eq?.total != null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <Brain className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{txt.title}</h1>
            <p className="text-gray-400 text-sm">
              {txt.subtitle}
            </p>
          </div>
        </div>

        {data?.mood && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <span className="text-2xl">{data.mood.recentEmoji}</span>
            <span className="text-gray-300">{data.mood.recentText}</span>
          </div>
        )}
      </div>

      {!hasEQData ? (
        /* No EQ Data State */
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-8 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold text-white mb-2">
            {txt.noData}
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {txt.noDataDesc}
          </p>
          <button
            onClick={() => router.push("/hub/settings")}
            className="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors"
          >
            {txt.linkSEI}
          </button>
        </div>
      ) : (
        <>
          {/* Main Score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total EQ Score */}
            <div className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-2xl border border-violet-500/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-medium">{txt.eqTotal}</span>
                {data?.brain?.style && (
                  <span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-xs">
                    {data.brain.style}
                  </span>
                )}
              </div>
              <div className="text-5xl font-bold text-white mb-2">
                {data?.eq?.total?.toFixed(1) || "-"}
              </div>
              <p className="text-gray-400 text-sm">
                {txt.generalScore}
              </p>
            </div>

            {/* Pursuits K-C-G */}
            <div className="lg:col-span-2 bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-white font-semibold mb-4">{txt.pursuits}</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(pursuitLabels).map(([key, config]) => {
                  const Icon = config.icon;
                  const score = data?.eq?.pursuits?.[key as keyof typeof data.eq.pursuits];
                  return (
                    <div key={key} className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-xl bg-gray-700/50 flex items-center justify-center mb-2`}>
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {score?.toFixed(1) || "-"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{config.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Competencies */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold">{txt.competencies}</h3>
              <button
                onClick={() => router.push("/hub/eq/competencies")}
                className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                {txt.viewDetails} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(competencyLabels).map(([key, config]) => {
                const score = data?.eq?.competencias?.[key];
                const percentage = score ? Math.min((score / 130) * 100, 100) : 0;
                return (
                  <div key={key} className="bg-gray-700/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400">{key}</span>
                      <span className="text-white font-semibold">{score?.toFixed(1) || "-"}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${config.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-1">{config.name}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outcomes */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold">{txt.lifeOutcomes}</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">{txt.overall}:</span>
                <span className="text-2xl font-bold text-white">
                  {data?.outcomes?.overall4?.toFixed(1) || "-"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(outcomeLabels).map(([key, config]) => {
                const Icon = config.icon;
                const outcomeData = data?.outcomes?.[key as keyof typeof data.outcomes];
                const score = typeof outcomeData === "object" ? outcomeData?.score : null;
                return (
                  <div key={key} className="bg-gray-700/30 rounded-xl p-4 text-center">
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${config.color}`} />
                    <div className="text-2xl font-bold text-white mb-1">
                      {score?.toFixed(1) || "-"}
                    </div>
                    <p className="text-xs text-gray-400">{config.name}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions - Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push("/hub/eq/talents")}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 rounded-xl border border-violet-500/30 transition-colors text-left"
            >
              <div className="p-3 rounded-xl bg-violet-500/20">
                <Brain className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">{txt.brainTalents}</h4>
                <p className="text-sm text-gray-400">{txt.brainTalentsDesc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 ml-auto" />
            </button>

            <button
              onClick={() => router.push("/hub/eq/success")}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 rounded-xl border border-amber-500/30 transition-colors text-left"
            >
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Star className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">{txt.successFactors}</h4>
                <p className="text-sm text-gray-400">{txt.successFactorsDesc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 ml-auto" />
            </button>
          </div>

          {/* Quick Actions - Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/hub/eq/snapshots")}
              className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl border border-gray-700/50 transition-colors text-left"
            >
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">{txt.seiHistory}</h4>
                <p className="text-sm text-gray-400">{txt.seiHistoryDesc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 ml-auto" />
            </button>

            <button
              onClick={() => router.push("/hub/eq/progress")}
              className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl border border-gray-700/50 transition-colors text-left"
            >
              <div className="p-3 rounded-xl bg-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">{txt.myProgress}</h4>
                <p className="text-sm text-gray-400">{txt.myProgressDesc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 ml-auto" />
            </button>

            <button
              onClick={() => router.push("/hub/eq/insights")}
              className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl border border-gray-700/50 transition-colors text-left"
            >
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Lightbulb className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">{txt.insights}</h4>
                <p className="text-sm text-gray-400">{txt.insightsDesc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 ml-auto" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
