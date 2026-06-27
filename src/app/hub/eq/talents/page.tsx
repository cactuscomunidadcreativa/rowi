// src/app/hub/eq/talents/page.tsx
// ============================================================
// Brain Talents - Visualización de los 18 Brain Talents (traducible)
// Organizados por cuadrante y cluster
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  ArrowLeft,
  Brain,
  Loader2,
  Sparkles,
  Target,
  Zap,
  Users,
  Lightbulb,
  Compass,
  Rocket,
  Eye,
  Heart,
  Focus,
} from "lucide-react";

interface EQData {
  brain?: { style: string | null };
  eq?: {
    talents?: {
      focus: Record<string, number | null>;
      decisions: Record<string, number | null>;
      drive: Record<string, number | null>;
    };
  };
}

const quadrantConfig: Record<string, { color: string; bgColor: string }> = {
  THINKING: { color: "text-blue-400", bgColor: "bg-blue-500/20" },
  FEELING: { color: "text-pink-400", bgColor: "bg-pink-500/20" },
  ACTION: { color: "text-amber-400", bgColor: "bg-amber-500/20" },
  RELATIONSHIP: { color: "text-green-400", bgColor: "bg-green-500/20" },
};

export default function BrainTalentsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EQData | null>(null);

  // Traducciones
  const txt = {
    loading: t("eqTalents.loading", "Cargando Brain Talents..."),
    title: t("eqTalents.title", "Brain Talents"),
    subtitle: t("eqTalents.subtitle", "Tus 18 talentos cerebrales del modelo Six Seconds"),
    yourBrainStyle: t("eqTalents.yourBrainStyle", "Tu Brain Style"),
    noData: t("eqTalents.noData", "No hay datos de Brain Talents"),
    noDataDesc: t("eqTalents.noDataDesc", "Los Brain Talents se obtienen de tu evaluación SEI extendida de Six Seconds."),
    brainQuadrants: t("eqTalents.brainQuadrants", "Cuadrantes Cerebrales"),
    // Clusters
    clusterFocus: t("eqTalents.clusterFocus", "Enfoque"),
    clusterFocusDesc: t("eqTalents.clusterFocusDesc", "Cómo procesas y organizas información"),
    clusterDecisions: t("eqTalents.clusterDecisions", "Decisiones"),
    clusterDecisionsDesc: t("eqTalents.clusterDecisionsDesc", "Cómo evalúas y decides"),
    clusterDrive: t("eqTalents.clusterDrive", "Impulso"),
    clusterDriveDesc: t("eqTalents.clusterDriveDesc", "Cómo actúas y logras resultados"),
    // Talents
    talDatamining: t("eqTalents.talDatamining", "Minería de Datos"),
    talDataminingDesc: t("eqTalents.talDataminingDesc", "Recopilar y organizar información de múltiples fuentes"),
    talModeling: t("eqTalents.talModeling", "Modelado"),
    talModelingDesc: t("eqTalents.talModelingDesc", "Crear representaciones mentales de sistemas complejos"),
    talPrioritizing: t("eqTalents.talPrioritizing", "Priorización"),
    talPrioritizingDesc: t("eqTalents.talPrioritizingDesc", "Establecer el orden de importancia de tareas y objetivos"),
    talConnection: t("eqTalents.talConnection", "Conexión"),
    talConnectionDesc: t("eqTalents.talConnectionDesc", "Establecer vínculos significativos con otros"),
    talEmotionalInsight: t("eqTalents.talEmotionalInsight", "Comprensión Emocional"),
    talEmotionalInsightDesc: t("eqTalents.talEmotionalInsightDesc", "Comprender las emociones propias y de otros"),
    talCollaboration: t("eqTalents.talCollaboration", "Colaboración"),
    talCollaborationDesc: t("eqTalents.talCollaborationDesc", "Trabajar efectivamente con otros hacia metas comunes"),
    talReflecting: t("eqTalents.talReflecting", "Reflexión"),
    talReflectingDesc: t("eqTalents.talReflectingDesc", "Analizar experiencias pasadas para aprender"),
    talAdaptability: t("eqTalents.talAdaptability", "Adaptabilidad"),
    talAdaptabilityDesc: t("eqTalents.talAdaptabilityDesc", "Ajustarse a nuevas circunstancias con flexibilidad"),
    talCriticalThinking: t("eqTalents.talCriticalThinking", "Pensamiento Crítico"),
    talCriticalThinkingDesc: t("eqTalents.talCriticalThinkingDesc", "Evaluar información de manera objetiva y lógica"),
    talResilience: t("eqTalents.talResilience", "Resiliencia"),
    talResilienceDesc: t("eqTalents.talResilienceDesc", "Recuperarse de adversidades y desafíos"),
    talRiskTolerance: t("eqTalents.talRiskTolerance", "Tolerancia al Riesgo"),
    talRiskToleranceDesc: t("eqTalents.talRiskToleranceDesc", "Aceptar incertidumbre y tomar riesgos calculados"),
    talImagination: t("eqTalents.talImagination", "Imaginación"),
    talImaginationDesc: t("eqTalents.talImaginationDesc", "Visualizar posibilidades y escenarios futuros"),
    talProactivity: t("eqTalents.talProactivity", "Proactividad"),
    talProactivityDesc: t("eqTalents.talProactivityDesc", "Tomar la iniciativa sin esperar instrucciones"),
    talCommitment: t("eqTalents.talCommitment", "Compromiso"),
    talCommitmentDesc: t("eqTalents.talCommitmentDesc", "Mantener la dedicación a objetivos y valores"),
    talProblemSolving: t("eqTalents.talProblemSolving", "Resolución de Problemas"),
    talProblemSolvingDesc: t("eqTalents.talProblemSolvingDesc", "Encontrar soluciones efectivas a desafíos"),
    talVision: t("eqTalents.talVision", "Visión"),
    talVisionDesc: t("eqTalents.talVisionDesc", "Crear una imagen clara del futuro deseado"),
    talDesigning: t("eqTalents.talDesigning", "Diseño"),
    talDesigningDesc: t("eqTalents.talDesigningDesc", "Crear planes y estructuras para lograr objetivos"),
    talEntrepreneurship: t("eqTalents.talEntrepreneurship", "Emprendimiento"),
    talEntrepreneurshipDesc: t("eqTalents.talEntrepreneurshipDesc", "Identificar y aprovechar oportunidades"),
    talBrainAgility: t("eqTalents.talBrainAgility", "Agilidad Cerebral"),
    talBrainAgilityDesc: t("eqTalents.talBrainAgilityDesc", "Cambiar entre diferentes modos de pensamiento"),
  };

  const talentInfo: Record<string, { name: string; quadrant: string; description: string }> = {
    datamining: { name: txt.talDatamining, quadrant: "THINKING", description: txt.talDataminingDesc },
    modeling: { name: txt.talModeling, quadrant: "THINKING", description: txt.talModelingDesc },
    prioritizing: { name: txt.talPrioritizing, quadrant: "THINKING", description: txt.talPrioritizingDesc },
    connection: { name: txt.talConnection, quadrant: "RELATIONSHIP", description: txt.talConnectionDesc },
    emotionalinsight: { name: txt.talEmotionalInsight, quadrant: "FEELING", description: txt.talEmotionalInsightDesc },
    collaboration: { name: txt.talCollaboration, quadrant: "RELATIONSHIP", description: txt.talCollaborationDesc },
    reflecting: { name: txt.talReflecting, quadrant: "THINKING", description: txt.talReflectingDesc },
    adaptability: { name: txt.talAdaptability, quadrant: "ACTION", description: txt.talAdaptabilityDesc },
    criticalthinking: { name: txt.talCriticalThinking, quadrant: "THINKING", description: txt.talCriticalThinkingDesc },
    resilience: { name: txt.talResilience, quadrant: "FEELING", description: txt.talResilienceDesc },
    risktolerance: { name: txt.talRiskTolerance, quadrant: "ACTION", description: txt.talRiskToleranceDesc },
    imagination: { name: txt.talImagination, quadrant: "THINKING", description: txt.talImaginationDesc },
    proactivity: { name: txt.talProactivity, quadrant: "ACTION", description: txt.talProactivityDesc },
    commitment: { name: txt.talCommitment, quadrant: "FEELING", description: txt.talCommitmentDesc },
    problemsolving: { name: txt.talProblemSolving, quadrant: "THINKING", description: txt.talProblemSolvingDesc },
    vision: { name: txt.talVision, quadrant: "THINKING", description: txt.talVisionDesc },
    designing: { name: txt.talDesigning, quadrant: "ACTION", description: txt.talDesigningDesc },
    entrepreneurship: { name: txt.talEntrepreneurship, quadrant: "ACTION", description: txt.talEntrepreneurshipDesc },
    brainagility: { name: txt.talBrainAgility, quadrant: "THINKING", description: txt.talBrainAgilityDesc },
  };

  const clusterConfig: Record<string, { name: string; icon: any; color: string; bgColor: string; description: string }> = {
    focus: { name: txt.clusterFocus, icon: Focus, color: "text-blue-400", bgColor: "from-blue-500/20 to-cyan-500/20", description: txt.clusterFocusDesc },
    decisions: { name: txt.clusterDecisions, icon: Compass, color: "text-purple-400", bgColor: "from-purple-500/20 to-pink-500/20", description: txt.clusterDecisionsDesc },
    drive: { name: txt.clusterDrive, icon: Rocket, color: "text-amber-400", bgColor: "from-amber-500/20 to-orange-500/20", description: txt.clusterDriveDesc },
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

  const talents = data?.eq?.talents || { focus: {}, decisions: {}, drive: {} };
  const brainStyle = data?.brain?.style;

  const hasTalentData = Object.values(talents).some(cluster =>
    Object.values(cluster).some(score => score != null)
  );

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
      </div>

      {/* Brain Style */}
      {brainStyle && (
        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-2xl border border-violet-500/30 p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-violet-500/20">
              <Brain className="w-8 h-8 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{txt.yourBrainStyle}</h2>
              <p className="text-2xl font-semibold text-violet-300">{brainStyle}</p>
            </div>
          </div>
        </div>
      )}

      {!hasTalentData ? (
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-8 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold text-white mb-2">
            {txt.noData}
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {txt.noDataDesc}
          </p>
        </div>
      ) : (
        <>
          {/* Talent Clusters */}
          <div className="space-y-6">
            {Object.entries(clusterConfig).map(([clusterKey, config]) => {
              const Icon = config.icon;
              const clusterTalents = talents[clusterKey as keyof typeof talents] || {};
              const talentEntries = Object.entries(clusterTalents).filter(([_, score]) => score != null);

              if (talentEntries.length === 0) return null;

              return (
                <div key={clusterKey} className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
                  {/* Cluster Header */}
                  <div className={`p-4 bg-gradient-to-r ${config.bgColor} border-b border-gray-700/30`}>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${config.color}`} />
                      <div>
                        <h3 className="text-lg font-semibold text-white">{config.name}</h3>
                        <p className="text-sm text-gray-400">{config.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Talents Grid */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {talentEntries.map(([key, score]) => {
                      const info = talentInfo[key.toLowerCase().replace(/\s+/g, "")] || {
                        name: key,
                        quadrant: "THINKING",
                        description: "",
                      };
                      const level = getScoreLevel(score);
                      const qConfig = quadrantConfig[info.quadrant];

                      return (
                        <div
                          key={key}
                          className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${qConfig?.bgColor} ${qConfig?.color}`}>
                                {info.quadrant}
                              </span>
                              <h4 className="font-medium text-white mt-2">{info.name}</h4>
                            </div>
                            <div className={`text-2xl font-bold ${
                              level === "high" ? "text-green-400" :
                              level === "medium" ? "text-amber-400" :
                              "text-gray-400"
                            }`}>
                              {score?.toFixed(0) || "-"}
                            </div>
                          </div>

                          <p className="text-sm text-gray-500 mb-3">{info.description}</p>

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

                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>70</span>
                            <span>100</span>
                            <span>130</span>
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
            <h4 className="text-sm font-medium text-gray-300 mb-3">{txt.brainQuadrants}</h4>
            <div className="flex flex-wrap gap-4">
              {Object.entries(quadrantConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.bgColor}`} />
                  <span className="text-sm text-gray-400">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
