// src/app/hub/eq/progress/page.tsx
// ============================================================
// EQ Progress - Evolución y desarrollo de inteligencia emocional (traducible)
// Muestra gráficos de progreso, reflexiones y planes de acción
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  ArrowLeft,
  TrendingUp,
  Brain,
  Loader2,
  Plus,
  Target,
  Lightbulb,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Sparkles,
  ChevronRight,
  BarChart3,
} from "lucide-react";

interface ProgressEntry {
  id: string;
  createdAt: string;
  reflection?: string;
  insight?: string;
  actionPlan?: string;
  metrics?: any;
  context?: string;
}

interface EQData {
  eq?: {
    total: number | null;
    competencias: Record<string, number | null>;
    pursuits: { know: number | null; choose: number | null; give: number | null };
  };
}

export default function EQProgressPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [eqData, setEqData] = useState<EQData | null>(null);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newReflection, setNewReflection] = useState("");
  const [newInsight, setNewInsight] = useState("");
  const [newActionPlan, setNewActionPlan] = useState("");
  const [saving, setSaving] = useState(false);

  // Traducciones
  const txt = {
    loading: t("eqProgress.loading", "Cargando progreso EQ..."),
    title: t("eqProgress.title", "Mi Progreso EQ"),
    subtitle: t("eqProgress.subtitle", "Desarrollo de tu inteligencia emocional"),
    newReflection: t("eqProgress.newReflection", "Nueva Reflexión"),
    competencyStatus: t("eqProgress.competencyStatus", "Estado de Competencias"),
    yourStrengths: t("eqProgress.yourStrengths", "Tus Fortalezas"),
    developmentAreas: t("eqProgress.developmentAreas", "Áreas de Desarrollo"),
    myReflections: t("eqProgress.myReflections", "Mis Reflexiones"),
    noReflections: t("eqProgress.noReflections", "No hay reflexiones registradas"),
    startDocumenting: t("eqProgress.startDocumenting", "Comienza a documentar tu desarrollo emocional"),
    moreEvaluations: t("eqProgress.moreEvaluations", "Completa más evaluaciones para identificar tus fortalezas"),
    allCompetenciesGood: t("eqProgress.allCompetenciesGood", "¡Excelente! Todas tus competencias están en nivel efectivo o superior"),
    score: t("eqProgress.score", "Puntuación"),
    improve: t("eqProgress.improve", "Mejorar"),
    // Status levels
    developing: t("eqProgress.developing", "Desarrollando"),
    effective: t("eqProgress.effective", "Efectivo"),
    expert: t("eqProgress.expert", "Experto"),
    // Modal
    newReflectionTitle: t("eqProgress.modal.title", "Nueva Reflexión EQ"),
    reflectionLabel: t("eqProgress.modal.reflectionLabel", "Reflexión *"),
    reflectionPlaceholder: t("eqProgress.modal.reflectionPlaceholder", "¿Qué observaste hoy sobre tus emociones o comportamientos?"),
    insightLabel: t("eqProgress.modal.insightLabel", "Insight (opcional)"),
    insightPlaceholder: t("eqProgress.modal.insightPlaceholder", "¿Qué aprendiste de esta experiencia?"),
    actionPlanLabel: t("eqProgress.modal.actionPlanLabel", "Plan de Acción (opcional)"),
    actionPlanPlaceholder: t("eqProgress.modal.actionPlanPlaceholder", "¿Qué vas a hacer diferente la próxima vez?"),
    cancel: t("eqProgress.modal.cancel", "Cancelar"),
    save: t("eqProgress.modal.save", "Guardar"),
    // Competencies
    compEL: t("eqProgress.comp.EL", "Alfabetización Emocional"),
    compRP: t("eqProgress.comp.RP", "Reconocer Patrones"),
    compACT: t("eqProgress.comp.ACT", "Pensamiento Consecuente"),
    compNE: t("eqProgress.comp.NE", "Navegar Emociones"),
    compIM: t("eqProgress.comp.IM", "Motivación Intrínseca"),
    compOP: t("eqProgress.comp.OP", "Ejercitar Optimismo"),
    compEMP: t("eqProgress.comp.EMP", "Incrementar Empatía"),
    compNG: t("eqProgress.comp.NG", "Nobles Metas"),
  };

  const competencyLabels: Record<string, { name: string; shortName: string; color: string }> = {
    EL: { name: txt.compEL, shortName: "EL", color: "bg-blue-500" },
    RP: { name: txt.compRP, shortName: "RP", color: "bg-purple-500" },
    ACT: { name: txt.compACT, shortName: "ACT", color: "bg-indigo-500" },
    NE: { name: txt.compNE, shortName: "NE", color: "bg-cyan-500" },
    IM: { name: txt.compIM, shortName: "IM", color: "bg-amber-500" },
    OP: { name: txt.compOP, shortName: "OP", color: "bg-yellow-500" },
    EMP: { name: txt.compEMP, shortName: "EMP", color: "bg-pink-500" },
    NG: { name: txt.compNG, shortName: "NG", color: "bg-emerald-500" },
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [eqRes] = await Promise.all([
        fetch("/api/eq/me"),
      ]);
      const eqJson = await eqRes.json();
      setEqData(eqJson);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveProgress() {
    if (!newReflection.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/eq/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reflection: newReflection,
          insight: newInsight || null,
          actionPlan: newActionPlan || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setProgressEntries([data.progress, ...progressEntries]);
        setNewReflection("");
        setNewInsight("");
        setNewActionPlan("");
        setShowNewEntry(false);
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getCompetencyLevel(score: number | null | undefined): "developing" | "effective" | "expert" {
    if (!score) return "developing";
    if (score >= 110) return "expert";
    if (score >= 90) return "effective";
    return "developing";
  }

  function getLevelLabel(level: "developing" | "effective" | "expert"): string {
    switch (level) {
      case "expert": return txt.expert;
      case "effective": return txt.effective;
      default: return txt.developing;
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

  const competencias = eqData?.eq?.competencias || {};

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/hub/eq")}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{txt.title}</h1>
              <p className="text-gray-400 text-sm">
                {txt.subtitle}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowNewEntry(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {txt.newReflection}
        </button>
      </div>

      {/* Competency Progress Overview */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">{txt.competencyStatus}</h2>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-600" />
              <span className="text-gray-400">{txt.developing}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-gray-400">{txt.effective}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-400">{txt.expert}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(competencyLabels).map(([key, config]) => {
            const score = competencias[key];
            const level = getCompetencyLevel(score);
            const percentage = score ? Math.min((score / 130) * 100, 100) : 0;

            return (
              <div key={key} className="bg-gray-700/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-white">{key}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    level === "expert" ? "bg-green-500/20 text-green-400" :
                    level === "effective" ? "bg-amber-500/20 text-amber-400" :
                    "bg-gray-600/50 text-gray-400"
                  }`}>
                    {getLevelLabel(level)}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {score?.toFixed(1) || "-"}
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      level === "expert" ? "bg-green-500" :
                      level === "effective" ? "bg-amber-500" :
                      "bg-gray-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{config.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals & Focus Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-white">{txt.yourStrengths}</h3>
          </div>

          {Object.entries(competencias)
            .filter(([_, score]) => score && score >= 100)
            .sort((a, b) => (b[1] || 0) - (a[1] || 0))
            .slice(0, 3)
            .map(([key, score]) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-700/30 last:border-0">
                <div>
                  <p className="font-medium text-white">{competencyLabels[key]?.name || key}</p>
                  <p className="text-xs text-gray-500">{txt.score}: {score?.toFixed(1)}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
            ))
          }

          {Object.entries(competencias).filter(([_, s]) => s && s >= 100).length === 0 && (
            <p className="text-gray-500 text-sm">
              {txt.moreEvaluations}
            </p>
          )}
        </div>

        {/* Areas to Develop */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white">{txt.developmentAreas}</h3>
          </div>

          {Object.entries(competencias)
            .filter(([_, score]) => score && score < 100)
            .sort((a, b) => (a[1] || 0) - (b[1] || 0))
            .slice(0, 3)
            .map(([key, score]) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-700/30 last:border-0">
                <div>
                  <p className="font-medium text-white">{competencyLabels[key]?.name || key}</p>
                  <p className="text-xs text-gray-500">{txt.score}: {score?.toFixed(1)}</p>
                </div>
                <button
                  onClick={() => router.push(`/hub/eq/insights?focus=${key}`)}
                  className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1"
                >
                  {txt.improve} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))
          }

          {Object.entries(competencias).filter(([_, s]) => s && s < 100).length === 0 && (
            <p className="text-gray-500 text-sm">
              {txt.allCompetenciesGood}
            </p>
          )}
        </div>
      </div>

      {/* New Entry Modal */}
      {showNewEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">{txt.newReflectionTitle}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  {txt.reflectionLabel}
                </label>
                <textarea
                  value={newReflection}
                  onChange={(e) => setNewReflection(e.target.value)}
                  placeholder={txt.reflectionPlaceholder}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Lightbulb className="w-4 h-4 inline mr-1" />
                  {txt.insightLabel}
                </label>
                <textarea
                  value={newInsight}
                  onChange={(e) => setNewInsight(e.target.value)}
                  placeholder={txt.insightPlaceholder}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  {txt.actionPlanLabel}
                </label>
                <textarea
                  value={newActionPlan}
                  onChange={(e) => setNewActionPlan(e.target.value)}
                  placeholder={txt.actionPlanPlaceholder}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 resize-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewEntry(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {txt.cancel}
              </button>
              <button
                onClick={saveProgress}
                disabled={!newReflection.trim() || saving}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {txt.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Entries */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="p-4 border-b border-gray-700/50">
          <h3 className="font-semibold text-white">{txt.myReflections}</h3>
        </div>

        {progressEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{txt.noReflections}</p>
            <p className="text-sm mt-2">
              {txt.startDocumenting}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {progressEntries.map((entry) => (
              <div key={entry.id} className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(entry.createdAt)}
                </div>

                {entry.reflection && (
                  <p className="text-white mb-3">{entry.reflection}</p>
                )}

                {entry.insight && (
                  <div className="flex items-start gap-2 bg-amber-500/10 rounded-lg p-3 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5" />
                    <p className="text-amber-200 text-sm">{entry.insight}</p>
                  </div>
                )}

                {entry.actionPlan && (
                  <div className="flex items-start gap-2 bg-green-500/10 rounded-lg p-3">
                    <Target className="w-4 h-4 text-green-400 mt-0.5" />
                    <p className="text-green-200 text-sm">{entry.actionPlan}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
