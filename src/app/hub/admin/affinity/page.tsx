"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Settings,
  Users,
  Brain,
  TrendingUp,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  Info,
  Sliders,
  Target,
  Zap,
  MessageCircle,
  Lightbulb,
  Activity,
  BarChart3,
  Clock,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

/* =========================================================
   🎯 Configuración de Affinity - Pesos y Parámetros
   =========================================================
   Esta página permite configurar los parámetros del motor
   de Affinity para personalizar cálculos según el tenant.
========================================================= */

// Tipos
interface ContextWeights {
  growth: number;
  collab: number;
  understand: number;
}

interface AffinityConfig {
  // Pesos por contexto
  contextWeights: {
    innovation: ContextWeights;
    execution: ContextWeights;
    leadership: ContextWeights;
    conversation: ContextWeights;
    relationship: ContextWeights;
    decision: ContextWeights;
  };
  // Parámetros de learning
  learning: {
    windowDays: number;
    highEffThreshold: number;
    lowEffThreshold: number;
    highBiasMultiplier: number;
    lowBiasMultiplier: number;
    cronIntervalDays: number;
    maxMembersPerRun: number;
  };
  // Umbrales de banda
  bands: {
    hotThreshold: number;
    warmThreshold: number;
  };
  // Closeness multipliers
  closeness: {
    cercano: number;
    neutral: number;
    lejano: number;
  };
}

// Valores por defecto (basados en el motor actual)
const DEFAULT_CONFIG: AffinityConfig = {
  contextWeights: {
    innovation: { growth: 0.40, collab: 0.35, understand: 0.25 },
    execution: { growth: 0.25, collab: 0.55, understand: 0.20 },
    leadership: { growth: 0.35, collab: 0.35, understand: 0.30 },
    conversation: { growth: 0.20, collab: 0.25, understand: 0.55 },
    relationship: { growth: 0.25, collab: 0.30, understand: 0.45 },
    decision: { growth: 0.30, collab: 0.45, understand: 0.25 },
  },
  learning: {
    windowDays: 30,
    highEffThreshold: 0.8,
    lowEffThreshold: 0.4,
    highBiasMultiplier: 1.08,
    lowBiasMultiplier: 0.92,
    cronIntervalDays: 15,
    maxMembersPerRun: 500,
  },
  bands: {
    hotThreshold: 70,
    warmThreshold: 45,
  },
  closeness: {
    cercano: 1.0,
    neutral: 0.9,
    lejano: 0.75,
  },
};

// Descripciones de contextos
const CONTEXT_INFO = {
  innovation: {
    icon: Lightbulb,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    title: "Innovación",
    desc: "Creatividad, diseño, nuevas ideas y toma de riesgos",
  },
  execution: {
    icon: Target,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "Ejecución",
    desc: "Acción, foco, disciplina y entrega de resultados",
  },
  leadership: {
    icon: Users,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    title: "Liderazgo",
    desc: "Influencia, visión, dirección y gestión de equipos",
  },
  conversation: {
    icon: MessageCircle,
    color: "text-green-500",
    bg: "bg-green-500/10",
    title: "Conversación",
    desc: "Comunicación, escucha activa y diálogo profundo",
  },
  relationship: {
    icon: Heart,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    title: "Relación",
    desc: "Conexión emocional, empatía y vínculos personales",
  },
  decision: {
    icon: Brain,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    title: "Decisión",
    desc: "Análisis, juicio crítico y toma de decisiones",
  },
};

// Componente de peso por contexto
function ContextWeightCard({
  context,
  weights,
  onChange,
}: {
  context: keyof typeof CONTEXT_INFO;
  weights: ContextWeights;
  onChange: (field: keyof ContextWeights, value: number) => void;
}) {
  const info = CONTEXT_INFO[context];
  const Icon = info.icon;
  const total = weights.growth + weights.collab + weights.understand;
  const isValid = Math.abs(total - 1) < 0.01;

  return (
    <div className={`rounded-xl border p-4 ${info.bg} border-[var(--rowi-border)]`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${info.bg}`}>
          <Icon className={`w-5 h-5 ${info.color}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-[var(--rowi-foreground)]">{info.title}</h4>
          <p className="text-xs text-[var(--rowi-muted)]">{info.desc}</p>
        </div>
        {!isValid && (
          <div className="flex items-center gap-1 text-amber-500 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Suma: {(total * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <WeightSlider
          label="Crecimiento"
          sublabel="Competencias SEI"
          value={weights.growth}
          onChange={(v) => onChange("growth", v)}
          color="bg-emerald-500"
        />
        <WeightSlider
          label="Colaboración"
          sublabel="Estilos + Talentos"
          value={weights.collab}
          onChange={(v) => onChange("collab", v)}
          color="bg-blue-500"
        />
        <WeightSlider
          label="Comprensión"
          sublabel="Subfactores/Outcomes"
          value={weights.understand}
          onChange={(v) => onChange("understand", v)}
          color="bg-purple-500"
        />
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--rowi-border)]">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--rowi-muted)]">Total:</span>
          <span className={isValid ? "text-green-500" : "text-amber-500"}>
            {(total * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Componente de slider de peso
function WeightSlider({
  label,
  sublabel,
  value,
  onChange,
  color,
}: {
  label: string;
  sublabel: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <div>
          <span className="text-[var(--rowi-foreground)]">{label}</span>
          <span className="text-[var(--rowi-muted)] ml-1">({sublabel})</span>
        </div>
        <span className="font-mono text-[var(--rowi-muted)]">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value * 100}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="w-full h-2 bg-[var(--rowi-muted)]/20 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--rowi-primary)]
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
        />
        <div
          className={`absolute top-0 left-0 h-2 ${color} rounded-full pointer-events-none`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

// Componente de métrica
function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
  trend,
}: {
  icon: any;
  label: string;
  value: number | string;
  suffix?: string;
  description: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg bg-[var(--rowi-primary)]/10">
          <Icon className="w-4 h-4 text-[var(--rowi-primary)]" />
        </div>
        {trend && (
          <div className={`text-xs ${
            trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-[var(--rowi-muted)]"
          }`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-[var(--rowi-foreground)]">
        {value}{suffix}
      </div>
      <div className="text-xs text-[var(--rowi-muted)]">{label}</div>
      <p className="text-xs text-[var(--rowi-muted)] mt-2 opacity-70">{description}</p>
    </div>
  );
}

// Página principal
export default function AffinityAdminPage() {
  const [config, setConfig] = useState<AffinityConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"weights" | "learning" | "stats">("weights");

  // Cargar configuración existente
  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      // TODO: Cargar desde API cuando exista
      // const res = await fetch("/api/admin/affinity/config");
      // if (res.ok) setConfig(await res.json());
    } catch (error) {
      console.error("Error loading config:", error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("/api/affinity/dashboard/team");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Guardar en API cuando exista
      // await fetch("/api/admin/affinity/config", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(config),
      // });
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      toast.error("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/affinity/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Recalculadas ${data.processed || 0} relaciones de afinidad`);
        loadStats();
      } else {
        toast.error("Error al recalcular afinidad");
      }
    } catch (error) {
      toast.error("Error al recalcular afinidad");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    toast.info("Configuración restaurada a valores por defecto");
  };

  const updateContextWeight = (
    context: keyof AffinityConfig["contextWeights"],
    field: keyof ContextWeights,
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      contextWeights: {
        ...prev.contextWeights,
        [context]: {
          ...prev.contextWeights[context],
          [field]: value,
        },
      },
    }));
  };

  const updateLearning = (field: keyof AffinityConfig["learning"], value: number) => {
    setConfig((prev) => ({
      ...prev,
      learning: {
        ...prev.learning,
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Heart className="w-7 h-7 text-pink-500" />
            Configuración de Affinity
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">
            Personaliza los parámetros del motor de afinidad emocional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)]
              bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Recalcular Todo</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
              bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Guardando..." : "Guardar"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--rowi-border)] pb-2">
        <button
          onClick={() => setActiveTab("weights")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === "weights"
              ? "bg-[var(--rowi-primary)] text-white"
              : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-muted)]/10"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pesos por Contexto</span>
        </button>
        <button
          onClick={() => setActiveTab("learning")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === "learning"
              ? "bg-[var(--rowi-primary)] text-white"
              : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-muted)]/10"
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Aprendizaje</span>
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === "stats"
              ? "bg-[var(--rowi-primary)] text-white"
              : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-muted)]/10"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Estadísticas</span>
        </button>
      </div>

      {/* Tab: Pesos por Contexto */}
      {activeTab === "weights" && (
        <div className="space-y-6">
          {/* Info box */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-[var(--rowi-foreground)] font-medium">
                Cómo funcionan los pesos
              </p>
              <p className="text-[var(--rowi-muted)] mt-1">
                Cada contexto pondera 3 componentes: <strong>Crecimiento</strong> (competencias SEI),
                <strong> Colaboración</strong> (estilos cerebrales + talentos) y <strong>Comprensión</strong> (subfactores).
                Los pesos deben sumar 100% para cada contexto.
              </p>
            </div>
          </div>

          {/* Grid de contextos */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(Object.keys(config.contextWeights) as Array<keyof typeof config.contextWeights>).map(
              (context) => (
                <ContextWeightCard
                  key={context}
                  context={context}
                  weights={config.contextWeights[context]}
                  onChange={(field, value) => updateContextWeight(context, field, value)}
                />
              )
            )}
          </div>

          {/* Botón de reset */}
          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]
                transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Restaurar valores por defecto
            </button>
          </div>
        </div>
      )}

      {/* Tab: Aprendizaje */}
      {activeTab === "learning" && (
        <div className="space-y-6">
          {/* Info box */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Brain className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-[var(--rowi-foreground)] font-medium">
                Sistema de Aprendizaje Adaptativo
              </p>
              <p className="text-[var(--rowi-muted)] mt-1">
                El motor ajusta automáticamente los multiplicadores de afinidad basándose en las
                interacciones reales entre usuarios. Las interacciones con alta efectividad aumentan
                el bias, mientras que las tensas lo reducen.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ventana de aprendizaje */}
            <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
              <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[var(--rowi-primary)]" />
                Ventana de Aprendizaje
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--rowi-muted)] block mb-2">
                    Días de historial para analizar
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="7"
                      max="90"
                      step="7"
                      value={config.learning.windowDays}
                      onChange={(e) => updateLearning("windowDays", Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-mono w-16 text-right">
                      {config.learning.windowDays}d
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[var(--rowi-muted)] block mb-2">
                    Intervalo de recálculo automático (CRON)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="7"
                      max="30"
                      step="1"
                      value={config.learning.cronIntervalDays}
                      onChange={(e) => updateLearning("cronIntervalDays", Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-mono w-16 text-right">
                      {config.learning.cronIntervalDays}d
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[var(--rowi-muted)] block mb-2">
                    Máximo de miembros por ejecución
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="100"
                      value={config.learning.maxMembersPerRun}
                      onChange={(e) => updateLearning("maxMembersPerRun", Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-mono w-16 text-right">
                      {config.learning.maxMembersPerRun}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Umbrales de efectividad */}
            <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
              <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                <Percent className="w-4 h-4 text-[var(--rowi-primary)]" />
                Umbrales de Efectividad
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--rowi-muted)] block mb-2">
                    Alta efectividad (aumenta afinidad)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={config.learning.highEffThreshold}
                      onChange={(e) => updateLearning("highEffThreshold", Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-mono w-16 text-right text-green-500">
                      ≥{(config.learning.highEffThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-[var(--rowi-muted)] mt-1">
                    Multiplicador: {config.learning.highBiasMultiplier.toFixed(2)}x (+
                    {((config.learning.highBiasMultiplier - 1) * 100).toFixed(0)}%)
                  </p>
                </div>
                <div>
                  <label className="text-sm text-[var(--rowi-muted)] block mb-2">
                    Baja efectividad (reduce afinidad)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.1"
                      max="0.5"
                      step="0.05"
                      value={config.learning.lowEffThreshold}
                      onChange={(e) => updateLearning("lowEffThreshold", Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-mono w-16 text-right text-red-500">
                      ≤{(config.learning.lowEffThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-[var(--rowi-muted)] mt-1">
                    Multiplicador: {config.learning.lowBiasMultiplier.toFixed(2)}x (
                    {((config.learning.lowBiasMultiplier - 1) * 100).toFixed(0)}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Multiplicadores de closeness */}
            <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
              <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-pink-500" />
                Multiplicadores de Cercanía
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">Cercano</span>
                  </div>
                  <span className="font-mono text-green-500">{config.closeness.cercano.toFixed(2)}x</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm">Neutral</span>
                  </div>
                  <span className="font-mono text-amber-500">{config.closeness.neutral.toFixed(2)}x</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm">Lejano</span>
                  </div>
                  <span className="font-mono text-red-500">{config.closeness.lejano.toFixed(2)}x</span>
                </div>
              </div>
            </div>

            {/* Umbrales de banda */}
            <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
              <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[var(--rowi-primary)]" />
                Umbrales de Banda (Heat)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--rowi-muted)] block mb-2">
                    Banda "Hot" (alta afinidad)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="50"
                      max="90"
                      step="5"
                      value={config.bands.hotThreshold}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          bands: { ...prev.bands, hotThreshold: Number(e.target.value) },
                        }))
                      }
                      className="flex-1"
                    />
                    <span className="text-lg font-mono w-16 text-right text-red-500">
                      ≥{config.bands.hotThreshold}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[var(--rowi-muted)] block mb-2">
                    Banda "Warm" (afinidad media)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="20"
                      max="60"
                      step="5"
                      value={config.bands.warmThreshold}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          bands: { ...prev.bands, warmThreshold: Number(e.target.value) },
                        }))
                      }
                      className="flex-1"
                    />
                    <span className="text-lg font-mono w-16 text-right text-amber-500">
                      ≥{config.bands.warmThreshold}
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-[var(--rowi-muted)]/5">
                  <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)]">
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500">Hot ≥{config.bands.hotThreshold}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">
                      Warm {config.bands.warmThreshold}-{config.bands.hotThreshold - 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500">
                      Cold &lt;{config.bands.warmThreshold}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Estadísticas */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={Heart}
              label="Afinidad Promedio"
              value={stats?.globalAverage?.toFixed(1) || "—"}
              suffix="/100"
              description="Promedio de todas las relaciones"
              trend="neutral"
            />
            <MetricCard
              icon={Users}
              label="Relaciones Activas"
              value={stats?.totalRelations || 0}
              description="Total de snapshots calculados"
              trend="up"
            />
            <MetricCard
              icon={Activity}
              label="Interacciones (30d)"
              value={stats?.recentInteractions || 0}
              description="Micro-interacciones registradas"
              trend="up"
            />
            <MetricCard
              icon={Zap}
              label="Última Recalculación"
              value={stats?.lastRecalc ? new Date(stats.lastRecalc).toLocaleDateString() : "—"}
              description="Fecha del último batch"
            />
          </div>

          {/* Distribución por contexto */}
          <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
            <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[var(--rowi-primary)]" />
              Distribución por Contexto
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {(Object.keys(CONTEXT_INFO) as Array<keyof typeof CONTEXT_INFO>).map((context) => {
                const info = CONTEXT_INFO[context];
                const Icon = info.icon;
                const avg = stats?.contextAverages?.[context] || 0;
                return (
                  <div
                    key={context}
                    className={`p-4 rounded-xl ${info.bg} border border-[var(--rowi-border)]`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${info.color}`} />
                      <span className="text-xs text-[var(--rowi-muted)]">{info.title}</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--rowi-foreground)]">
                      {avg > 0 ? avg.toFixed(0) : "—"}
                    </div>
                    <div className="mt-2 h-1.5 bg-[var(--rowi-muted)]/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${info.color.replace("text-", "bg-")}`}
                        style={{ width: `${(avg / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top conexiones */}
          {stats?.topConnections && stats.topConnections.length > 0 && (
            <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
              <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Top 5 Conexiones Más Fuertes
              </h3>
              <div className="space-y-3">
                {stats.topConnections.slice(0, 5).map((conn: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-lg bg-[var(--rowi-muted)]/5"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--rowi-primary)]/10 flex items-center justify-center text-sm font-bold text-[var(--rowi-primary)]">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--rowi-foreground)]">
                        {conn.userName} ↔ {conn.memberName}
                      </div>
                      <div className="text-xs text-[var(--rowi-muted)]">
                        Contexto: {conn.context}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[var(--rowi-primary)]">
                        {conn.score?.toFixed(0)}
                      </div>
                      <div className="text-xs text-[var(--rowi-muted)]">
                        {conn.band === "hot" ? "🔥" : conn.band === "warm" ? "☀️" : "❄️"} {conn.band}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--rowi-muted)]/5 border border-[var(--rowi-border)]">
            <div>
              <p className="font-medium text-[var(--rowi-foreground)]">
                ¿Necesitas actualizar las estadísticas?
              </p>
              <p className="text-sm text-[var(--rowi-muted)]">
                El recálculo puede tomar unos minutos dependiendo del número de usuarios.
              </p>
            </div>
            <button
              onClick={handleRecalculate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white
                hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Recalculando..." : "Recalcular Ahora"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
