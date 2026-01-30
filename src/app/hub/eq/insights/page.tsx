// src/app/hub/eq/insights/page.tsx
// ============================================================
// EQ Insights - Recomendaciones personalizadas de desarrollo EQ (traducible)
// Muestra insights basados en el perfil y micro-acciones sugeridas
// ============================================================

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  ArrowLeft,
  Lightbulb,
  Brain,
  Loader2,
  Sparkles,
  Target,
  Zap,
  Clock,
  ChevronRight,
  Star,
  Play,
  BookOpen,
  Heart,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

interface EQData {
  eq?: {
    total: number | null;
    competencias: Record<string, number | null>;
    pursuits: { know: number | null; choose: number | null; give: number | null };
  };
  outcomes?: {
    effectiveness: { score: number | null };
    relationships: { score: number | null };
    wellbeing: { score: number | null };
    qualityOfLife: { score: number | null };
  };
}

interface MicroLearning {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category: string;
  parentKey: string;
  duration: number;
  difficulty: string;
  points: number;
  isFeatured: boolean;
}

function EQInsightsContent() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const focusCompetency = searchParams.get("focus");

  const [loading, setLoading] = useState(true);
  const [eqData, setEqData] = useState<EQData | null>(null);
  const [microLearnings, setMicroLearnings] = useState<MicroLearning[]>([]);
  const [selectedCompetency, setSelectedCompetency] = useState<string | null>(focusCompetency);

  // Traducciones
  const txt = {
    loading: t("insights.loading", locale === "en" ? "Generating insights..." : "Generando insights..."),
    title: t("insights.title", locale === "en" ? "Personalized Insights" : "Insights Personalizados"),
    subtitle: t("insights.subtitle", locale === "en" ? "Recommendations based on your EQ profile" : "Recomendaciones basadas en tu perfil EQ"),
    priorityAreas: t("insights.priorityAreas", locale === "en" ? "Priority Development Areas" : "Áreas Prioritarias de Desarrollo"),
    completeAssessment: t("insights.completeAssessment", locale === "en" ? "Complete a SEI assessment to receive personalized recommendations" : "Completa una evaluación SEI para recibir recomendaciones personalizadas"),
    priority: t("insights.priority", locale === "en" ? "Priority" : "Prioridad"),
    score: t("insights.score", locale === "en" ? "Score" : "Puntuación"),
    tipsToImprove: t("insights.tipsToImprove", locale === "en" ? "Tips to Improve" : "Consejos para Mejorar"),
    recommendedActions: t("insights.recommendedActions", locale === "en" ? "Recommended Micro-Actions" : "Micro-Acciones Recomendadas"),
    noMicroActions: t("insights.noMicroActions", locale === "en" ? "No micro-actions available for this competency yet" : "No hay micro-acciones disponibles para esta competencia aún"),
    viewAllMicroActions: t("insights.viewAllMicroActions", locale === "en" ? "View all micro-actions" : "Ver todas las micro-acciones"),
    allCompetencies: t("insights.allCompetencies", locale === "en" ? "All Competencies" : "Todas las Competencias"),
    talkToRowi: t("insights.talkToRowi", locale === "en" ? "Talk to Rowi Coach" : "Hablar con Rowi Coach"),
    talkToRowiDesc: t("insights.talkToRowiDesc", locale === "en" ? "Get personalized AI coaching" : "Recibe coaching personalizado de IA"),
    recordProgress: t("insights.recordProgress", locale === "en" ? "Record Progress" : "Registrar Progreso"),
    recordProgressDesc: t("insights.recordProgressDesc", locale === "en" ? "Document your EQ development" : "Documenta tu desarrollo EQ"),
    min: t("insights.min", "min"),
    pts: t("insights.pts", "pts"),
    // Competencies
    compEL: t("insights.comp.EL.name", locale === "en" ? "Emotional Literacy" : "Alfabetización Emocional"),
    compELDesc: t("insights.comp.EL.desc", locale === "en" ? "Ability to identify and name emotions accurately" : "Capacidad de identificar y nombrar emociones con precisión"),
    compRP: t("insights.comp.RP.name", locale === "en" ? "Recognize Patterns" : "Reconocer Patrones"),
    compRPDesc: t("insights.comp.RP.desc", locale === "en" ? "Identify habitual reactions and behaviors" : "Identificar reacciones y comportamientos habituales"),
    compACT: t("insights.comp.ACT.name", locale === "en" ? "Consequential Thinking" : "Pensamiento Consecuente"),
    compACTDesc: t("insights.comp.ACT.desc", locale === "en" ? "Evaluate consequences of decisions before acting" : "Evaluar las consecuencias de las decisiones antes de actuar"),
    compNE: t("insights.comp.NE.name", locale === "en" ? "Navigate Emotions" : "Navegar Emociones"),
    compNEDesc: t("insights.comp.NE.desc", locale === "en" ? "Manage emotions in ways that lead toward goals" : "Manejar emociones de forma que te lleven hacia tus metas"),
    compIM: t("insights.comp.IM.name", locale === "en" ? "Intrinsic Motivation" : "Motivación Intrínseca"),
    compIMDesc: t("insights.comp.IM.desc", locale === "en" ? "Connect with deep internal motivations" : "Conectar con motivaciones internas profundas"),
    compOP: t("insights.comp.OP.name", locale === "en" ? "Exercise Optimism" : "Ejercitar Optimismo"),
    compOPDesc: t("insights.comp.OP.desc", locale === "en" ? "Maintain a positive reality-based perspective" : "Mantener una perspectiva positiva basada en la realidad"),
    compEMP: t("insights.comp.EMP.name", locale === "en" ? "Increase Empathy" : "Incrementar Empatía"),
    compEMPDesc: t("insights.comp.EMP.desc", locale === "en" ? "Understand others' emotions and perspectives" : "Comprender las emociones y perspectivas de otros"),
    compNG: t("insights.comp.NG.name", locale === "en" ? "Noble Goals" : "Nobles Metas"),
    compNGDesc: t("insights.comp.NG.desc", locale === "en" ? "Define and pursue meaningful purposes" : "Definir y perseguir propósitos significativos"),
    // Tips
    tipEL1: t("insights.tip.EL.1", locale === "en" ? "Practice naming your emotions specifically (e.g., frustrated vs. angry)" : "Practica nombrar tus emociones específicamente (ej: frustrado vs. enojado)"),
    tipEL2: t("insights.tip.EL.2", locale === "en" ? "Keep a brief daily emotional journal" : "Lleva un diario emocional breve cada día"),
    tipEL3: t("insights.tip.EL.3", locale === "en" ? "Observe physical sensations associated with each emotion" : "Observa las sensaciones físicas asociadas a cada emoción"),
    tipRP1: t("insights.tip.RP.1", locale === "en" ? "Identify your most common emotional triggers" : "Identifica tus triggers emocionales más comunes"),
    tipRP2: t("insights.tip.RP.2", locale === "en" ? "Reflect on situations that repeat" : "Reflexiona sobre situaciones que se repiten"),
    tipRP3: t("insights.tip.RP.3", locale === "en" ? "Ask yourself: What patterns did I inherit from my family?" : "Pregúntate: ¿Qué patrones heredé de mi familia?"),
    tipACT1: t("insights.tip.ACT.1", locale === "en" ? "Before deciding, ask: What are the long-term consequences?" : "Antes de decidir, pregunta: ¿Cuáles son las consecuencias a largo plazo?"),
    tipACT2: t("insights.tip.ACT.2", locale === "en" ? "Practice the 10-10-10 technique (10 min, 10 months, 10 years)" : "Practica la técnica 10-10-10 (10 min, 10 meses, 10 años)"),
    tipACT3: t("insights.tip.ACT.3", locale === "en" ? "Consider the impact on other people" : "Considera el impacto en otras personas"),
    tipNE1: t("insights.tip.NE.1", locale === "en" ? "Use breathing techniques when feeling intense emotions" : "Usa técnicas de respiración cuando sientas emociones intensas"),
    tipNE2: t("insights.tip.NE.2", locale === "en" ? "Transform difficult emotion energy into constructive action" : "Transforma la energía de emociones difíciles en acción constructiva"),
    tipNE3: t("insights.tip.NE.3", locale === "en" ? "Practice the 6-second pause before reacting" : "Practica la pausa de 6 segundos antes de reaccionar"),
    tipIM1: t("insights.tip.IM.1", locale === "en" ? "Identify what makes you feel truly alive" : "Identifica qué te hace sentir verdaderamente vivo"),
    tipIM2: t("insights.tip.IM.2", locale === "en" ? "Connect routine tasks with your personal values" : "Conecta tareas rutinarias con tus valores personales"),
    tipIM3: t("insights.tip.IM.3", locale === "en" ? "Celebrate small achievements to maintain motivation" : "Celebra pequeños logros para mantener la motivación"),
    tipOP1: t("insights.tip.OP.1", locale === "en" ? "Practice gratitude: name 3 good things each day" : "Practica gratitud: nombra 3 cosas buenas cada día"),
    tipOP2: t("insights.tip.OP.2", locale === "en" ? "Reframe difficult situations by looking for opportunities" : "Reenmarca situaciones difíciles buscando oportunidades"),
    tipOP3: t("insights.tip.OP.3", locale === "en" ? "Surround yourself with optimistic people" : "Rodéate de personas optimistas"),
    tipEMP1: t("insights.tip.EMP.1", locale === "en" ? "Listen actively without interrupting" : "Escucha activamente sin interrumpir"),
    tipEMP2: t("insights.tip.EMP.2", locale === "en" ? "Ask yourself: How would this person feel?" : "Pregúntate: ¿Cómo se sentiría esta persona?"),
    tipEMP3: t("insights.tip.EMP.3", locale === "en" ? "Practice genuine curiosity about others" : "Practica la curiosidad genuina por los demás"),
    tipNG1: t("insights.tip.NG.1", locale === "en" ? "Define what legacy you want to leave" : "Define qué legado quieres dejar"),
    tipNG2: t("insights.tip.NG.2", locale === "en" ? "Connect daily actions with your greater purpose" : "Conecta tus acciones diarias con tu propósito mayor"),
    tipNG3: t("insights.tip.NG.3", locale === "en" ? "Find ways to contribute to something bigger than yourself" : "Encuentra formas de contribuir a algo más grande que tú"),
  };

  const competencyInfo: Record<string, {
    name: string;
    description: string;
    icon: any;
    color: string;
    tips: string[];
  }> = {
    EL: {
      name: txt.compEL,
      description: txt.compELDesc,
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      tips: [txt.tipEL1, txt.tipEL2, txt.tipEL3],
    },
    RP: {
      name: txt.compRP,
      description: txt.compRPDesc,
      icon: Brain,
      color: "from-purple-500 to-purple-600",
      tips: [txt.tipRP1, txt.tipRP2, txt.tipRP3],
    },
    ACT: {
      name: txt.compACT,
      description: txt.compACTDesc,
      icon: Target,
      color: "from-indigo-500 to-indigo-600",
      tips: [txt.tipACT1, txt.tipACT2, txt.tipACT3],
    },
    NE: {
      name: txt.compNE,
      description: txt.compNEDesc,
      icon: Zap,
      color: "from-cyan-500 to-cyan-600",
      tips: [txt.tipNE1, txt.tipNE2, txt.tipNE3],
    },
    IM: {
      name: txt.compIM,
      description: txt.compIMDesc,
      icon: Heart,
      color: "from-amber-500 to-amber-600",
      tips: [txt.tipIM1, txt.tipIM2, txt.tipIM3],
    },
    OP: {
      name: txt.compOP,
      description: txt.compOPDesc,
      icon: Sparkles,
      color: "from-yellow-500 to-yellow-600",
      tips: [txt.tipOP1, txt.tipOP2, txt.tipOP3],
    },
    EMP: {
      name: txt.compEMP,
      description: txt.compEMPDesc,
      icon: Heart,
      color: "from-pink-500 to-pink-600",
      tips: [txt.tipEMP1, txt.tipEMP2, txt.tipEMP3],
    },
    NG: {
      name: txt.compNG,
      description: txt.compNGDesc,
      icon: Star,
      color: "from-emerald-500 to-emerald-600",
      tips: [txt.tipNG1, txt.tipNG2, txt.tipNG3],
    },
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [eqRes, mlRes] = await Promise.all([
        fetch("/api/eq/me"),
        fetch("/api/microlearning"),
      ]);
      const [eqJson, mlJson] = await Promise.all([eqRes.json(), mlRes.json()]);
      setEqData(eqJson);
      if (mlJson.ok) {
        setMicroLearnings(mlJson.data?.items || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getRecommendedCompetencies(): string[] {
    if (!eqData?.eq?.competencias) return [];

    return Object.entries(eqData.eq.competencias)
      .filter(([_, score]) => score != null)
      .sort((a, b) => (a[1] || 0) - (b[1] || 0))
      .slice(0, 3)
      .map(([key]) => key);
  }

  function getRelevantMicroLearnings(competencyKey: string): MicroLearning[] {
    return microLearnings
      .filter(ml =>
        ml.category === "COMPETENCY" &&
        ml.parentKey.toUpperCase().includes(competencyKey.toUpperCase())
      )
      .slice(0, 3);
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

  const recommendedCompetencies = getRecommendedCompetencies();
  const competencias = eqData?.eq?.competencias || {};

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
            <Lightbulb className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{txt.title}</h1>
            <p className="text-gray-400 text-sm">
              {txt.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Priority Areas */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">{txt.priorityAreas}</h2>
        </div>

        {recommendedCompetencies.length === 0 ? (
          <p className="text-gray-400">
            {txt.completeAssessment}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedCompetencies.map((key, idx) => {
              const info = competencyInfo[key];
              const score = competencias[key];
              if (!info) return null;
              const Icon = info.icon;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedCompetency(key)}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    selectedCompetency === key
                      ? "bg-amber-500/20 border-amber-500/50"
                      : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${info.color} bg-opacity-20`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-xs text-amber-400">{txt.priority} {idx + 1}</span>
                      <h3 className="font-medium text-white">{key}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{info.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{txt.score}:</span>
                    <span className="text-lg font-bold text-white">{score?.toFixed(1) || "-"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Competency Details */}
      {selectedCompetency && competencyInfo[selectedCompetency] && (
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className={`p-6 bg-gradient-to-r ${competencyInfo[selectedCompetency].color} bg-opacity-20`}>
            <div className="flex items-center gap-3 mb-2">
              {(() => {
                const Icon = competencyInfo[selectedCompetency].icon;
                return <Icon className="w-8 h-8 text-white" />;
              })()}
              <div>
                <h2 className="text-xl font-bold text-white">{selectedCompetency}</h2>
                <p className="text-gray-300">{competencyInfo[selectedCompetency].name}</p>
              </div>
            </div>
            <p className="text-gray-300 mt-2">{competencyInfo[selectedCompetency].description}</p>
          </div>

          {/* Tips */}
          <div className="p-6 border-b border-gray-700/50">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {txt.tipsToImprove}
            </h3>
            <div className="space-y-3">
              {competencyInfo[selectedCompetency].tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related Micro-Learnings */}
          <div className="p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-violet-400" />
              {txt.recommendedActions}
            </h3>

            {getRelevantMicroLearnings(selectedCompetency).length === 0 ? (
              <p className="text-gray-500 text-sm">
                {txt.noMicroActions}
              </p>
            ) : (
              <div className="space-y-3">
                {getRelevantMicroLearnings(selectedCompetency).map((ml) => (
                  <div
                    key={ml.id}
                    className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-violet-500/20">
                      <Lightbulb className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{ml.title}</h4>
                      {ml.description && (
                        <p className="text-sm text-gray-400 truncate">{ml.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {ml.duration} {txt.min}
                        </span>
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> {ml.points} {txt.pts}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => router.push("/hub/admin/elearning/microlearning")}
              className="w-full mt-4 py-3 text-center text-violet-400 hover:text-violet-300 text-sm font-medium"
            >
              {txt.viewAllMicroActions} →
            </button>
          </div>
        </div>
      )}

      {/* All Competencies Overview */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">{txt.allCompetencies}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(competencyInfo).map(([key, info]) => {
            const score = competencias[key];
            const Icon = info.icon;
            const isSelected = selectedCompetency === key;
            const isRecommended = recommendedCompetencies.includes(key);

            return (
              <button
                key={key}
                onClick={() => setSelectedCompetency(key)}
                className={`p-3 rounded-xl text-left transition-all ${
                  isSelected
                    ? "bg-violet-500/20 border-2 border-violet-500/50"
                    : isRecommended
                    ? "bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20"
                    : "bg-gray-700/30 border border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${isSelected ? "text-violet-400" : isRecommended ? "text-amber-400" : "text-gray-400"}`} />
                  {isRecommended && !isSelected && (
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                      {txt.priority}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-white text-sm">{key}</div>
                <div className="text-xs text-gray-500 truncate">{info.name}</div>
                <div className="text-lg font-bold text-white mt-1">
                  {score?.toFixed(1) || "-"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => router.push("/hub/ai/rowi-coach")}
          className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30 rounded-xl border border-violet-500/30 transition-colors text-left"
        >
          <div className="p-3 rounded-xl bg-violet-500/20">
            <Brain className="w-6 h-6 text-violet-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-white">{txt.talkToRowi}</h4>
            <p className="text-sm text-gray-400">{txt.talkToRowiDesc}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>

        <button
          onClick={() => router.push("/hub/eq/progress")}
          className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 rounded-xl border border-green-500/30 transition-colors text-left"
        >
          <div className="p-3 rounded-xl bg-green-500/20">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-white">{txt.recordProgress}</h4>
            <p className="text-sm text-gray-400">{txt.recordProgressDesc}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </div>
  );
}

export default function EQInsightsPage() {
  const { t, locale } = useI18n();

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{locale === "en" ? "Loading insights..." : "Cargando insights..."}</span>
        </div>
      </div>
    }>
      <EQInsightsContent />
    </Suspense>
  );
}
