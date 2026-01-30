// src/app/hub/eq/snapshots/page.tsx
// ============================================================
// EQ Snapshots - Historial de evaluaciones SEI (traducible)
// Muestra timeline de snapshots con detalles de cada uno
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  ArrowLeft,
  Calendar,
  Brain,
  Loader2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  BarChart3,
} from "lucide-react";

interface Snapshot {
  id: string;
  at: string;
  dataset: string;
  brainStyle?: string;
  K?: number;
  C?: number;
  G?: number;
  EL?: number;
  RP?: number;
  ACT?: number;
  NE?: number;
  IM?: number;
  OP?: number;
  EMP?: number;
  NG?: number;
  outcomes?: Array<{ key: string; score: number }>;
  subfactors?: Array<{ key: string; score: number }>;
  talents?: Array<{ key: string; score: number }>;
}

interface SnapshotHistory {
  id: string;
  at: string;
  dataset: string;
}

export default function EQSnapshotsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<Snapshot | null>(null);
  const [history, setHistory] = useState<SnapshotHistory[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSnapshot, setExpandedSnapshot] = useState<Snapshot | null>(null);

  // Traducciones
  const txt = {
    loading: t("snapshots.loading", locale === "en" ? "Loading SEI history..." : "Cargando historial SEI..."),
    title: t("snapshots.title", locale === "en" ? "SEI History" : "Historial SEI"),
    evaluationsCount: t("snapshots.evaluationsCount", locale === "en" ? "evaluations registered" : "evaluaciones registradas"),
    currentSnapshot: t("snapshots.currentSnapshot", locale === "en" ? "Current Snapshot" : "Snapshot Actual"),
    current: t("snapshots.current", locale === "en" ? "Current" : "Actual"),
    timeline: t("snapshots.timeline", locale === "en" ? "Evaluations Timeline" : "Timeline de Evaluaciones"),
    noHistory: t("snapshots.noHistory", locale === "en" ? "No previous evaluations" : "No hay evaluaciones anteriores"),
    totalEvaluations: t("snapshots.totalEvaluations", locale === "en" ? "Total Evaluations" : "Total Evaluaciones"),
    firstEvaluation: t("snapshots.firstEvaluation", locale === "en" ? "First Evaluation" : "Primera Evaluación"),
    lastEvaluation: t("snapshots.lastEvaluation", locale === "en" ? "Last Evaluation" : "Última Evaluación"),
    datasetsUsed: t("snapshots.datasetsUsed", locale === "en" ? "Datasets Used" : "Datasets Usados"),
    at: t("snapshots.at", locale === "en" ? "at" : "a las"),
    // Datasets
    datasetActual: t("snapshots.dataset.actual", locale === "en" ? "Actual" : "Actual"),
    datasetIdeal: t("snapshots.dataset.ideal", locale === "en" ? "Ideal" : "Ideal"),
    datasetPerceived: t("snapshots.dataset.perceived", locale === "en" ? "Perceived" : "Percibido"),
    // Competencies
    compEL: t("snapshots.comp.EL", locale === "en" ? "Emotional Literacy" : "Alfabetización Emocional"),
    compRP: t("snapshots.comp.RP", locale === "en" ? "Recognize Patterns" : "Reconocer Patrones"),
    compACT: t("snapshots.comp.ACT", locale === "en" ? "Consequential Thinking" : "Pensamiento Consecuente"),
    compNE: t("snapshots.comp.NE", locale === "en" ? "Navigate Emotions" : "Navegar Emociones"),
    compIM: t("snapshots.comp.IM", locale === "en" ? "Intrinsic Motivation" : "Motivación Intrínseca"),
    compOP: t("snapshots.comp.OP", locale === "en" ? "Exercise Optimism" : "Ejercitar Optimismo"),
    compEMP: t("snapshots.comp.EMP", locale === "en" ? "Increase Empathy" : "Incrementar Empatía"),
    compNG: t("snapshots.comp.NG", locale === "en" ? "Noble Goals" : "Nobles Metas"),
  };

  const datasetLabels: Record<string, { label: string; color: string }> = {
    actual: { label: txt.datasetActual, color: "bg-green-500/20 text-green-400" },
    ideal: { label: txt.datasetIdeal, color: "bg-blue-500/20 text-blue-400" },
    perceived: { label: txt.datasetPerceived, color: "bg-purple-500/20 text-purple-400" },
  };

  const competencyLabels: Record<string, string> = {
    EL: txt.compEL,
    RP: txt.compRP,
    ACT: txt.compACT,
    NE: txt.compNE,
    IM: txt.compIM,
    OP: txt.compOP,
    EMP: txt.compEMP,
    NG: txt.compNG,
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  async function loadSnapshots() {
    try {
      const res = await fetch("/api/eq/snapshots");
      const data = await res.json();
      if (data.ok) {
        setCurrent(data.current);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Error loading snapshots:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSnapshotDetails(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedSnapshot(null);
      return;
    }

    if (current && current.id === id) {
      setExpandedId(id);
      setExpandedSnapshot(current);
      return;
    }

    setExpandedId(id);
    setExpandedSnapshot(null);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(locale === "en" ? "en-US" : "es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{txt.title}</h1>
            <p className="text-gray-400 text-sm">
              {history.length} {txt.evaluationsCount}
            </p>
          </div>
        </div>
      </div>

      {/* Current Snapshot Highlight */}
      {current && (
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 rounded-2xl border border-violet-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-violet-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">{txt.currentSnapshot}</h2>
                <p className="text-sm text-gray-400">
                  {formatDate(current.at)} {txt.at} {formatTime(current.at)}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${datasetLabels[current.dataset]?.color || "bg-gray-700 text-gray-300"}`}>
              {datasetLabels[current.dataset]?.label || current.dataset}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-400 mb-1">Know</div>
              <div className="text-2xl font-bold text-blue-400">{current.K?.toFixed(1) || "-"}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-400 mb-1">Choose</div>
              <div className="text-2xl font-bold text-purple-400">{current.C?.toFixed(1) || "-"}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-400 mb-1">Give</div>
              <div className="text-2xl font-bold text-pink-400">{current.G?.toFixed(1) || "-"}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-400 mb-1">Brain Style</div>
              <div className="text-lg font-semibold text-violet-300">{current.brainStyle || "-"}</div>
            </div>
          </div>

          {/* Competencies */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {Object.entries(competencyLabels).map(([key, label]) => {
              const score = current[key as keyof Snapshot] as number | undefined;
              return (
                <div key={key} className="bg-gray-800/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">{key}</div>
                  <div className="text-sm font-semibold text-white">{score?.toFixed(1) || "-"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="p-4 border-b border-gray-700/50">
          <h3 className="font-semibold text-white">{txt.timeline}</h3>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{txt.noHistory}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {history.map((snap, idx) => {
              const isExpanded = expandedId === snap.id;
              const isCurrent = current?.id === snap.id;

              return (
                <div key={snap.id}>
                  <button
                    onClick={() => loadSnapshotDetails(snap.id)}
                    className={`w-full flex items-center gap-4 p-4 hover:bg-gray-700/30 transition-colors text-left ${
                      isCurrent ? "bg-violet-500/5" : ""
                    }`}
                  >
                    {/* Timeline indicator */}
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${isCurrent ? "bg-violet-500" : "bg-gray-600"}`} />
                      {idx < history.length - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-700" />
                      )}
                    </div>

                    {/* Date info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{formatDate(snap.at)}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full text-xs">
                            {txt.current}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatTime(snap.at)}
                        <span className="mx-1">·</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${datasetLabels[snap.dataset]?.color || "bg-gray-700 text-gray-300"}`}>
                          {datasetLabels[snap.dataset]?.label || snap.dataset}
                        </span>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && expandedSnapshot && (
                    <div className="px-4 pb-4 ml-7 border-l-2 border-gray-700">
                      <div className="bg-gray-700/30 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xs text-gray-500">Know</div>
                            <div className="text-lg font-semibold text-blue-400">
                              {expandedSnapshot.K?.toFixed(1) || "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Choose</div>
                            <div className="text-lg font-semibold text-purple-400">
                              {expandedSnapshot.C?.toFixed(1) || "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Give</div>
                            <div className="text-lg font-semibold text-pink-400">
                              {expandedSnapshot.G?.toFixed(1) || "-"}
                            </div>
                          </div>
                        </div>

                        {expandedSnapshot.brainStyle && (
                          <div className="text-center pt-2 border-t border-gray-600/50">
                            <span className="text-sm text-gray-400">Brain Style: </span>
                            <span className="text-violet-300 font-medium">{expandedSnapshot.brainStyle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {history.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              {txt.totalEvaluations}
            </div>
            <div className="text-2xl font-bold text-white">{history.length}</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              {txt.firstEvaluation}
            </div>
            <div className="text-lg font-semibold text-white">
              {history.length > 0 ? formatDate(history[history.length - 1].at) : "-"}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              {txt.lastEvaluation}
            </div>
            <div className="text-lg font-semibold text-white">
              {history.length > 0 ? formatDate(history[0].at) : "-"}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              {txt.datasetsUsed}
            </div>
            <div className="text-lg font-semibold text-white">
              {[...new Set(history.map(h => h.dataset))].length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
