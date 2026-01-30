// src/app/hub/eq/success/page.tsx
// ============================================================
// Success Factors - Factores de éxito del modelo Six Seconds (traducible)
// Muestra los 8 Success Factors agrupados por Outcome
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  ArrowLeft,
  Star,
  Loader2,
  Zap,
  Heart,
  Users,
  Network,
  Trophy,
  Smile,
  Scale,
  Activity,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

interface SuccessFactor {
  key: string;
  score: number | null;
}

interface OutcomeData {
  score: number | null;
  [key: string]: number | null;
}

interface EQData {
  outcomes?: {
    overall4: number | null;
    effectiveness: OutcomeData;
    relationships: OutcomeData;
    wellbeing: OutcomeData;
    qualityOfLife: OutcomeData;
  };
  success?: SuccessFactor[];
}

export default function SuccessFactorsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EQData | null>(null);

  // Traducciones
  const txt = {
    loading: t("success.loading", locale === "en" ? "Loading Success Factors..." : "Cargando Success Factors..."),
    title: t("success.title", "Success Factors"),
    subtitle: t("success.subtitle", locale === "en" ? "The 8 success factors from Six Seconds model" : "Los 8 factores de éxito del modelo Six Seconds"),
    overallSuccess: t("success.overallSuccess", "Overall Success"),
    combinedScore: t("success.combinedScore", locale === "en" ? "Combined score of 4 outcomes" : "Puntuación combinada de los 4 outcomes"),
    noData: t("success.noData", locale === "en" ? "No Success Factors data" : "No hay datos de Success Factors"),
    noDataDesc: t("success.noDataDesc", locale === "en" ? "Success Factors are obtained from your Six Seconds SEI assessment." : "Los Success Factors se obtienen de tu evaluación SEI de Six Seconds."),
    viewRecommendations: t("success.viewRecommendations", locale === "en" ? "View recommendations to improve" : "Ver recomendaciones para mejorar"),
    scoreInterpretation: t("success.scoreInterpretation", locale === "en" ? "Score Interpretation" : "Interpretación de Puntuaciones"),
    // Score levels
    levelExcellent: t("success.level.excellent", locale === "en" ? "Excellent" : "Excelente"),
    levelDeveloping: t("success.level.developing", locale === "en" ? "Developing" : "Desarrollando"),
    levelOpportunity: t("success.level.opportunity", locale === "en" ? "Opportunity" : "Oportunidad"),
    levelExpert: t("success.level.expert", locale === "en" ? "Expert" : "Experto"),
    levelEffective: t("success.level.effective", locale === "en" ? "Effective" : "Efectivo"),
    // Outcomes
    outEffectiveness: t("success.out.effectiveness", locale === "en" ? "Effectiveness" : "Efectividad"),
    outEffectivenessDesc: t("success.out.effectivenessDesc", locale === "en" ? "Ability to achieve results and have impact" : "Capacidad de lograr resultados y tener impacto"),
    outRelationships: t("success.out.relationships", locale === "en" ? "Relationships" : "Relaciones"),
    outRelationshipsDesc: t("success.out.relationshipsDesc", locale === "en" ? "Quality of connections with others" : "Calidad de las conexiones con otros"),
    outWellbeing: t("success.out.wellbeing", locale === "en" ? "Wellbeing" : "Bienestar"),
    outWellbeingDesc: t("success.out.wellbeingDesc", locale === "en" ? "Physical and emotional health state" : "Estado de salud física y emocional"),
    outQualityOfLife: t("success.out.qualityOfLife", locale === "en" ? "Quality of Life" : "Calidad de Vida"),
    outQualityOfLifeDesc: t("success.out.qualityOfLifeDesc", locale === "en" ? "Overall satisfaction with life" : "Satisfacción general con la vida"),
    // Factors
    factInfluence: t("success.fact.influence", locale === "en" ? "Influence" : "Influencia"),
    factInfluenceDesc: t("success.fact.influenceDesc", locale === "en" ? "Ability to inspire and guide others" : "Capacidad de inspirar y guiar a otros"),
    factDecisionMaking: t("success.fact.decisionMaking", locale === "en" ? "Decision Making" : "Toma de Decisiones"),
    factDecisionMakingDesc: t("success.fact.decisionMakingDesc", locale === "en" ? "Ability to decide effectively" : "Habilidad para decidir efectivamente"),
    factCommunity: t("success.fact.community", locale === "en" ? "Community" : "Comunidad"),
    factCommunityDesc: t("success.fact.communityDesc", locale === "en" ? "Sense of belonging and connection" : "Sentido de pertenencia y conexión"),
    factNetwork: t("success.fact.network", locale === "en" ? "Network" : "Red de Contactos"),
    factNetworkDesc: t("success.fact.networkDesc", locale === "en" ? "Valuable professional relationships" : "Relaciones profesionales valiosas"),
    factBalance: t("success.fact.balance", locale === "en" ? "Balance" : "Equilibrio"),
    factBalanceDesc: t("success.fact.balanceDesc", locale === "en" ? "Harmony between different aspects of life" : "Armonía entre diferentes aspectos de la vida"),
    factHealth: t("success.fact.health", locale === "en" ? "Health" : "Salud"),
    factHealthDesc: t("success.fact.healthDesc", locale === "en" ? "Physical and mental wellbeing" : "Bienestar físico y mental"),
    factAchievement: t("success.fact.achievement", locale === "en" ? "Achievement" : "Logro"),
    factAchievementDesc: t("success.fact.achievementDesc", locale === "en" ? "Satisfaction from reaching goals" : "Satisfacción por alcanzar metas"),
    factSatisfaction: t("success.fact.satisfaction", locale === "en" ? "Satisfaction" : "Satisfacción"),
    factSatisfactionDesc: t("success.fact.satisfactionDesc", locale === "en" ? "Feeling of fulfillment and contentment" : "Sentimiento de plenitud y contentamiento"),
  };

  const outcomeConfig: Record<string, {
    name: string;
    icon: any;
    color: string;
    bgColor: string;
    description: string;
    factors: Array<{ key: string; name: string; icon: any; description: string }>;
  }> = {
    effectiveness: {
      name: txt.outEffectiveness,
      icon: Zap,
      color: "text-amber-400",
      bgColor: "from-amber-500/20 to-orange-500/20",
      description: txt.outEffectivenessDesc,
      factors: [
        { key: "Influence", name: txt.factInfluence, icon: Users, description: txt.factInfluenceDesc },
        { key: "Decision Making", name: txt.factDecisionMaking, icon: Zap, description: txt.factDecisionMakingDesc },
      ],
    },
    relationships: {
      name: txt.outRelationships,
      icon: Heart,
      color: "text-pink-400",
      bgColor: "from-pink-500/20 to-rose-500/20",
      description: txt.outRelationshipsDesc,
      factors: [
        { key: "Community", name: txt.factCommunity, icon: Users, description: txt.factCommunityDesc },
        { key: "Network", name: txt.factNetwork, icon: Network, description: txt.factNetworkDesc },
      ],
    },
    wellbeing: {
      name: txt.outWellbeing,
      icon: Activity,
      color: "text-green-400",
      bgColor: "from-green-500/20 to-emerald-500/20",
      description: txt.outWellbeingDesc,
      factors: [
        { key: "Balance", name: txt.factBalance, icon: Scale, description: txt.factBalanceDesc },
        { key: "Health", name: txt.factHealth, icon: Activity, description: txt.factHealthDesc },
      ],
    },
    qualityOfLife: {
      name: txt.outQualityOfLife,
      icon: Star,
      color: "text-purple-400",
      bgColor: "from-purple-500/20 to-violet-500/20",
      description: txt.outQualityOfLifeDesc,
      factors: [
        { key: "Achievement", name: txt.factAchievement, icon: Trophy, description: txt.factAchievementDesc },
        { key: "Satisfaction", name: txt.factSatisfaction, icon: Smile, description: txt.factSatisfactionDesc },
      ],
    },
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/eq/me");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getScoreLevel(score: number | null | undefined): "low" | "medium" | "high" {
    if (!score) return "low";
    if (score >= 110) return "high";
    if (score >= 90) return "medium";
    return "low";
  }

  function getSuccessScore(key: string): number | null {
    const factor = data?.success?.find(
      s => s.key.toLowerCase() === key.toLowerCase()
    );
    return factor?.score ?? null;
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

  const outcomes = data?.outcomes;
  const overall4 = outcomes?.overall4;
  const hasData = overall4 != null || (data?.success && data.success.length > 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/hub/eq")}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Star className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{txt.title}</h1>
            <p className="text-gray-400 text-sm">
              {txt.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      {overall4 && (
        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-2xl border border-violet-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">{txt.overallSuccess}</h2>
              <p className="text-gray-400 text-sm">{txt.combinedScore}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white">{overall4.toFixed(1)}</div>
              <div className={`text-sm ${
                getScoreLevel(overall4) === "high" ? "text-green-400" :
                getScoreLevel(overall4) === "medium" ? "text-amber-400" :
                "text-gray-400"
              }`}>
                {getScoreLevel(overall4) === "high" ? txt.levelExcellent :
                 getScoreLevel(overall4) === "medium" ? txt.levelDeveloping :
                 txt.levelOpportunity}
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasData ? (
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-8 text-center">
          <Star className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold text-white mb-2">
            {txt.noData}
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {txt.noDataDesc}
          </p>
        </div>
      ) : (
        <>
          {/* Outcomes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(outcomeConfig).map(([outcomeKey, config]) => {
              const Icon = config.icon;
              const outcomeData = outcomes?.[outcomeKey as keyof typeof outcomes];
              const outcomeScore = typeof outcomeData === "object" ? outcomeData?.score : null;

              return (
                <div
                  key={outcomeKey}
                  className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden"
                >
                  {/* Outcome Header */}
                  <div className={`p-4 bg-gradient-to-r ${config.bgColor} border-b border-gray-700/30`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${config.color}`} />
                        <div>
                          <h3 className="font-semibold text-white">{config.name}</h3>
                          <p className="text-xs text-gray-400">{config.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${config.color}`}>
                          {outcomeScore?.toFixed(1) || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Success Factors */}
                  <div className="p-4 space-y-4">
                    {config.factors.map((factor) => {
                      const FactorIcon = factor.icon;
                      const score = getSuccessScore(factor.key);
                      const level = getScoreLevel(score);

                      return (
                        <div key={factor.key} className="bg-gray-700/30 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-700/50">
                                <FactorIcon className="w-4 h-4 text-gray-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-white">{factor.name}</h4>
                                <p className="text-xs text-gray-500">{factor.description}</p>
                              </div>
                            </div>
                            <div className={`text-xl font-bold ${
                              level === "high" ? "text-green-400" :
                              level === "medium" ? "text-amber-400" :
                              "text-gray-400"
                            }`}>
                              {score?.toFixed(1) || "-"}
                            </div>
                          </div>

                          {/* Score bar */}
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                level === "high" ? "bg-green-500" :
                                level === "medium" ? "bg-amber-500" :
                                "bg-gray-500"
                              }`}
                              style={{ width: `${Math.min((score || 0) / 130 * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">{txt.scoreInterpretation}</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-400">110+ {txt.levelExpert}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-400">90-109 {txt.levelEffective}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-gray-400">&lt;90 {txt.levelDeveloping}</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push("/hub/eq/insights")}
            className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 rounded-xl border border-amber-500/30 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span className="font-medium text-white">{txt.viewRecommendations}</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </>
      )}
    </div>
  );
}
