"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Heart,
  Users,
  Brain,
  TrendingUp,
  RefreshCw,
  Save,
  AlertCircle,
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
  Globe,
  Building2,
  Layers,
  Network,
  ChevronDown,
  Check,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   🎯 Configuración de Affinity - Pesos y Parámetros
   =========================================================
   Esta página permite configurar los parámetros del motor
   de Affinity a diferentes niveles jerárquicos:
   global → tenant → hub → organization → team
========================================================= */

// Tipos
interface ContextWeights {
  growth: number;
  collab: number;
  understand: number;
}

interface AffinityConfig {
  contextWeights: {
    innovation: ContextWeights;
    execution: ContextWeights;
    leadership: ContextWeights;
    conversation: ContextWeights;
    relationship: ContextWeights;
    decision: ContextWeights;
  };
  learning: {
    windowDays: number;
    highEffThreshold: number;
    lowEffThreshold: number;
    highBiasMultiplier: number;
    lowBiasMultiplier: number;
    cronIntervalDays: number;
    maxMembersPerRun: number;
  };
  bands: {
    hotThreshold: number;
    warmThreshold: number;
  };
  closeness: {
    cercano: number;
    neutral: number;
    lejano: number;
  };
}

type Scope = "global" | "tenant" | "hub" | "organization" | "team";

interface ScopeOption {
  id: string;
  name: string;
  slug?: string;
}

// Valores por defecto
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

// Iconos por scope
const SCOPE_ICONS: Record<Scope, any> = {
  global: Globe,
  tenant: Building2,
  hub: Layers,
  organization: Network,
  team: Users,
};

const SCOPE_COLORS: Record<Scope, { color: string; bg: string }> = {
  global: { color: "text-blue-500", bg: "bg-blue-500/10" },
  tenant: { color: "text-purple-500", bg: "bg-purple-500/10" },
  hub: { color: "text-green-500", bg: "bg-green-500/10" },
  organization: { color: "text-orange-500", bg: "bg-orange-500/10" },
  team: { color: "text-pink-500", bg: "bg-pink-500/10" },
};

// Iconos por contexto
const CONTEXT_ICONS = {
  innovation: Lightbulb,
  execution: Target,
  leadership: Users,
  conversation: MessageCircle,
  relationship: Heart,
  decision: Brain,
};

const CONTEXT_COLORS = {
  innovation: { color: "text-yellow-500", bg: "bg-yellow-500/10" },
  execution: { color: "text-blue-500", bg: "bg-blue-500/10" },
  leadership: { color: "text-purple-500", bg: "bg-purple-500/10" },
  conversation: { color: "text-green-500", bg: "bg-green-500/10" },
  relationship: { color: "text-pink-500", bg: "bg-pink-500/10" },
  decision: { color: "text-indigo-500", bg: "bg-indigo-500/10" },
};

// Componente selector de scope
function ScopeSelector({
  scope,
  scopeId,
  onScopeChange,
  onScopeIdChange,
  scopeOptions,
  t,
  configSource,
}: {
  scope: Scope;
  scopeId: string | null;
  onScopeChange: (scope: Scope) => void;
  onScopeIdChange: (id: string | null) => void;
  scopeOptions: Record<Scope, ScopeOption[]>;
  t: (key: string, fallback?: string) => string;
  configSource?: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = SCOPE_ICONS[scope];
  const colors = SCOPE_COLORS[scope];

  const selectedOption = scopeOptions[scope]?.find((o) => o.id === scopeId);

  return (
    <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="w-4 h-4 text-[var(--rowi-primary)]" />
        <span className="font-medium text-[var(--rowi-foreground)]">
          {t("admin.affinity.scope.title")}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(SCOPE_ICONS) as Scope[]).map((s) => {
          const ScopeIcon = SCOPE_ICONS[s];
          const sColors = SCOPE_COLORS[s];
          const isActive = scope === s;

          return (
            <button
              key={s}
              onClick={() => {
                onScopeChange(s);
                onScopeIdChange(null);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                isActive
                  ? `${sColors.bg} ${sColors.color} ring-2 ring-offset-1 ring-[var(--rowi-primary)]`
                  : "bg-[var(--rowi-muted)]/10 text-[var(--rowi-muted)] hover:bg-[var(--rowi-muted)]/20"
              }`}
            >
              <ScopeIcon className="w-3.5 h-3.5" />
              <span>{t(`admin.affinity.scope.${s}`)}</span>
            </button>
          );
        })}
      </div>

      {scope !== "global" && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-[var(--rowi-border)]
              bg-[var(--rowi-background)] hover:bg-[var(--rowi-muted)]/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${colors.color}`} />
              <span className="text-[var(--rowi-foreground)]">
                {selectedOption?.name || t("admin.affinity.scope.selectScope")}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[var(--rowi-card)] border border-[var(--rowi-border)]
              rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {scopeOptions[scope]?.length > 0 ? (
                scopeOptions[scope].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onScopeIdChange(option.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-[var(--rowi-muted)]/10 transition-colors ${
                      scopeId === option.id ? "bg-[var(--rowi-primary)]/10" : ""
                    }`}
                  >
                    <div>
                      <span className="text-[var(--rowi-foreground)]">{option.name}</span>
                      {option.slug && (
                        <span className="text-xs text-[var(--rowi-muted)] ml-2">({option.slug})</span>
                      )}
                    </div>
                    {scopeId === option.id && <Check className="w-4 h-4 text-[var(--rowi-primary)]" />}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-[var(--rowi-muted)]">
                  {t("admin.affinity.scope.noOptions")}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mostrar fuente de configuración */}
      {configSource && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--rowi-muted)]/5">
          <p className="text-xs text-[var(--rowi-muted)] mb-2">{t("admin.affinity.scope.inheritance")}:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(configSource).map(([key, source]) => (
              <span key={key} className="text-xs px-2 py-1 rounded bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]">
                {key}: {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de peso por contexto
function ContextWeightCard({
  context,
  weights,
  onChange,
  t,
}: {
  context: keyof typeof CONTEXT_ICONS;
  weights: ContextWeights;
  onChange: (field: keyof ContextWeights, value: number) => void;
  t: (key: string, fallback?: string) => string;
}) {
  const Icon = CONTEXT_ICONS[context];
  const colors = CONTEXT_COLORS[context];
  const total = weights.growth + weights.collab + weights.understand;
  const isValid = Math.abs(total - 1) < 0.01;

  return (
    <div className={`rounded-xl border p-4 ${colors.bg} border-[var(--rowi-border)]`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.color}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-[var(--rowi-foreground)]">
            {t(`admin.affinity.contexts.${context}.title`)}
          </h4>
          <p className="text-xs text-[var(--rowi-muted)]">
            {t(`admin.affinity.contexts.${context}.desc`)}
          </p>
        </div>
        {!isValid && (
          <div className="flex items-center gap-1 text-amber-500 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{t("admin.affinity.sum")}: {(total * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <WeightSlider
          label={t("admin.affinity.weights.growth")}
          sublabel={t("admin.affinity.weights.growthSub")}
          value={weights.growth}
          onChange={(v) => onChange("growth", v)}
          color="bg-emerald-500"
        />
        <WeightSlider
          label={t("admin.affinity.weights.collab")}
          sublabel={t("admin.affinity.weights.collabSub")}
          value={weights.collab}
          onChange={(v) => onChange("collab", v)}
          color="bg-blue-500"
        />
        <WeightSlider
          label={t("admin.affinity.weights.understand")}
          sublabel={t("admin.affinity.weights.understandSub")}
          value={weights.understand}
          onChange={(v) => onChange("understand", v)}
          color="bg-purple-500"
        />
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--rowi-border)]">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--rowi-muted)]">{t("admin.affinity.total")}:</span>
          <span className={isValid ? "text-green-500" : "text-amber-500"}>
            {(total * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Componente de slider
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
  const { t } = useI18n();
  const [config, setConfig] = useState<AffinityConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"weights" | "learning" | "stats">("weights");

  // Scope management
  const [scope, setScope] = useState<Scope>("global");
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [scopeOptions, setScopeOptions] = useState<Record<Scope, ScopeOption[]>>({
    global: [],
    tenant: [],
    hub: [],
    organization: [],
    team: [],
  });
  const [configSource, setConfigSource] = useState<Record<string, string>>({});
  const [hasCustomConfig, setHasCustomConfig] = useState(false);

  // Cargar opciones de scope
  useEffect(() => {
    loadScopeOptions();
  }, []);

  // Cargar configuración cuando cambia el scope
  useEffect(() => {
    loadConfig();
  }, [scope, scopeId]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadScopeOptions = async () => {
    try {
      // Cargar tenants
      const tenantsRes = await fetch("/api/admin/tenants");
      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        setScopeOptions((prev) => ({
          ...prev,
          tenant: tenantsData.tenants?.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })) || [],
        }));
      }

      // Cargar hubs
      const hubsRes = await fetch("/api/admin/hubs");
      if (hubsRes.ok) {
        const hubsData = await hubsRes.json();
        setScopeOptions((prev) => ({
          ...prev,
          hub: hubsData.hubs?.map((h: any) => ({ id: h.id, name: h.name, slug: h.slug })) || [],
        }));
      }

      // Cargar organizations
      const orgsRes = await fetch("/api/admin/organizations");
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        setScopeOptions((prev) => ({
          ...prev,
          organization: orgsData.organizations?.map((o: any) => ({ id: o.id, name: o.name, slug: o.slug })) || [],
          team: orgsData.organizations?.filter((o: any) => o.unitType === "TEAM")
            .map((o: any) => ({ id: o.id, name: o.name, slug: o.slug })) || [],
        }));
      }
    } catch (error) {
      console.error("Error loading scope options:", error);
    }
  };

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        scope,
        resolve: "true",
      });
      if (scopeId) params.set("scopeId", scopeId);

      const res = await fetch(`/api/affinity/config?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          // Mapear la configuración de la API al formato local
          setConfig({
            contextWeights: data.config.contextWeights || DEFAULT_CONFIG.contextWeights,
            learning: {
              windowDays: data.config.learningParams?.windowDays || DEFAULT_CONFIG.learning.windowDays,
              highEffThreshold: data.config.learningParams?.highEffThreshold || DEFAULT_CONFIG.learning.highEffThreshold,
              lowEffThreshold: data.config.learningParams?.lowEffThreshold || DEFAULT_CONFIG.learning.lowEffThreshold,
              highBiasMultiplier: data.config.learningParams?.highBiasMultiplier || DEFAULT_CONFIG.learning.highBiasMultiplier,
              lowBiasMultiplier: data.config.learningParams?.lowBiasMultiplier || DEFAULT_CONFIG.learning.lowBiasMultiplier,
              cronIntervalDays: data.config.learningParams?.cronIntervalDays || DEFAULT_CONFIG.learning.cronIntervalDays,
              maxMembersPerRun: data.config.learningParams?.maxMembersPerRun || DEFAULT_CONFIG.learning.maxMembersPerRun,
            },
            bands: {
              hotThreshold: data.config.bandThresholds?.hotThreshold || DEFAULT_CONFIG.bands.hotThreshold,
              warmThreshold: data.config.bandThresholds?.warmThreshold || DEFAULT_CONFIG.bands.warmThreshold,
            },
            closeness: data.config.closenessMultipliers || DEFAULT_CONFIG.closeness,
          });
          setConfigSource(data.source || {});
          setHasCustomConfig(true);
        } else {
          setConfig(DEFAULT_CONFIG);
          setConfigSource({});
          setHasCustomConfig(false);
        }
      }
    } catch (error) {
      console.error("Error loading config:", error);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }, [scope, scopeId]);

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
      const payload = {
        scope,
        scopeId: scope === "global" ? null : scopeId,
        contextWeights: config.contextWeights,
        learningParams: {
          windowDays: config.learning.windowDays,
          highEffThreshold: config.learning.highEffThreshold,
          lowEffThreshold: config.learning.lowEffThreshold,
          highBiasMultiplier: config.learning.highBiasMultiplier,
          lowBiasMultiplier: config.learning.lowBiasMultiplier,
          cronIntervalDays: config.learning.cronIntervalDays,
          maxMembersPerRun: config.learning.maxMembersPerRun,
        },
        bandThresholds: config.bands,
        closenessMultipliers: config.closeness,
      };

      const res = await fetch("/api/affinity/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(t("admin.affinity.saveSuccess"));
        setHasCustomConfig(true);
        loadConfig(); // Recargar para actualizar fuentes
      } else {
        const data = await res.json();
        toast.error(data.error || t("admin.affinity.saveError"));
      }
    } catch (error) {
      toast.error(t("admin.affinity.saveError"));
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
        toast.success(t("admin.affinity.recalcSuccess", `Recalculated ${data.processed || 0} relations`));
        loadStats();
      } else {
        toast.error(t("admin.affinity.recalcError"));
      }
    } catch (error) {
      toast.error(t("admin.affinity.recalcError"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    toast.info(t("admin.affinity.resetSuccess"));
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
            {t("admin.affinity.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">
            {t("admin.affinity.description")}
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
            <span>{t("admin.affinity.recalculateAll")}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (scope !== "global" && !scopeId)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
              bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t("admin.affinity.saving") : t("actions.save")}</span>
          </button>
        </div>
      </div>

      {/* Scope Selector */}
      <ScopeSelector
        scope={scope}
        scopeId={scopeId}
        onScopeChange={setScope}
        onScopeIdChange={setScopeId}
        scopeOptions={scopeOptions}
        t={t}
        configSource={hasCustomConfig ? configSource : undefined}
      />

      {/* Warning si no hay scopeId seleccionado */}
      {scope !== "global" && !scopeId && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-[var(--rowi-foreground)] font-medium">
              {t("admin.affinity.scope.selectRequired")}
            </p>
            <p className="text-[var(--rowi-muted)] mt-1">
              {t("admin.affinity.scope.selectRequiredDesc")}
            </p>
          </div>
        </div>
      )}

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
          <span>{t("admin.affinity.tabs.weights")}</span>
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
          <span>{t("admin.affinity.tabs.learning")}</span>
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
          <span>{t("admin.affinity.tabs.stats")}</span>
        </button>
      </div>

      {/* Tab: Pesos por Contexto */}
      {activeTab === "weights" && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-[var(--rowi-foreground)] font-medium">
                {t("admin.affinity.weightsInfo.title")}
              </p>
              <p className="text-[var(--rowi-muted)] mt-1">
                {t("admin.affinity.weightsInfo.desc")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(Object.keys(config.contextWeights) as Array<keyof typeof config.contextWeights>).map(
              (context) => (
                <ContextWeightCard
                  key={context}
                  context={context}
                  weights={config.contextWeights[context]}
                  onChange={(field, value) => updateContextWeight(context, field, value)}
                  t={t}
                />
              )
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]
                transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              {t("admin.affinity.resetDefaults")}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Aprendizaje */}
      {activeTab === "learning" && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Brain className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-[var(--rowi-foreground)] font-medium">
                {t("admin.affinity.learningInfo.title")}
              </p>
              <p className="text-[var(--rowi-muted)] mt-1">
                {t("admin.affinity.learningInfo.desc")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ventana de aprendizaje */}
            <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
              <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[var(--rowi-primary)]" />
                {t("admin.affinity.learning.windowTitle")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--rowi-muted)] block mb-2">
                    {t("admin.affinity.learning.historyDays")}
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
                    {t("admin.affinity.learning.cronInterval")}
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
                    {t("admin.affinity.learning.maxMembers")}
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
                {t("admin.affinity.learning.thresholdsTitle")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--rowi-muted)] block mb-2">
                    {t("admin.affinity.learning.highEff")}
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
                    {t("admin.affinity.learning.multiplier")}: {config.learning.highBiasMultiplier.toFixed(2)}x (+
                    {((config.learning.highBiasMultiplier - 1) * 100).toFixed(0)}%)
                  </p>
                </div>
                <div>
                  <label className="text-sm text-[var(--rowi-muted)] block mb-2">
                    {t("admin.affinity.learning.lowEff")}
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
                    {t("admin.affinity.learning.multiplier")}: {config.learning.lowBiasMultiplier.toFixed(2)}x (
                    {((config.learning.lowBiasMultiplier - 1) * 100).toFixed(0)}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Multiplicadores de closeness */}
            <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
              <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-pink-500" />
                {t("admin.affinity.closeness.title")}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">{t("admin.affinity.closeness.close")}</span>
                  </div>
                  <span className="font-mono text-green-500">{config.closeness.cercano.toFixed(2)}x</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm">{t("admin.affinity.closeness.neutral")}</span>
                  </div>
                  <span className="font-mono text-amber-500">{config.closeness.neutral.toFixed(2)}x</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm">{t("admin.affinity.closeness.distant")}</span>
                  </div>
                  <span className="font-mono text-red-500">{config.closeness.lejano.toFixed(2)}x</span>
                </div>
              </div>
            </div>

            {/* Umbrales de banda */}
            <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
              <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[var(--rowi-primary)]" />
                {t("admin.affinity.bands.title")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--rowi-muted)] block mb-2">
                    {t("admin.affinity.bands.hot")}
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
                    {t("admin.affinity.bands.warm")}
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
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500">🔥 Hot ≥{config.bands.hotThreshold}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">
                      ☀️ Warm {config.bands.warmThreshold}-{config.bands.hotThreshold - 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500">
                      ❄️ Cold &lt;{config.bands.warmThreshold}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={Heart}
              label={t("admin.affinity.stats.avgAffinity")}
              value={stats?.globalAverage?.toFixed(1) || "—"}
              suffix="/100"
              description={t("admin.affinity.stats.avgAffinityDesc")}
              trend="neutral"
            />
            <MetricCard
              icon={Users}
              label={t("admin.affinity.stats.activeRelations")}
              value={stats?.totalRelations || 0}
              description={t("admin.affinity.stats.activeRelationsDesc")}
              trend="up"
            />
            <MetricCard
              icon={Activity}
              label={t("admin.affinity.stats.interactions")}
              value={stats?.recentInteractions || 0}
              description={t("admin.affinity.stats.interactionsDesc")}
              trend="up"
            />
            <MetricCard
              icon={Zap}
              label={t("admin.affinity.stats.lastRecalc")}
              value={stats?.lastRecalc ? new Date(stats.lastRecalc).toLocaleDateString() : "—"}
              description={t("admin.affinity.stats.lastRecalcDesc")}
            />
          </div>

          {/* Distribución por contexto */}
          <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
            <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[var(--rowi-primary)]" />
              {t("admin.affinity.stats.byContext")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {(Object.keys(CONTEXT_ICONS) as Array<keyof typeof CONTEXT_ICONS>).map((context) => {
                const Icon = CONTEXT_ICONS[context];
                const colors = CONTEXT_COLORS[context];
                const avg = stats?.contextAverages?.[context] || 0;
                return (
                  <div
                    key={context}
                    className={`p-4 rounded-xl ${colors.bg} border border-[var(--rowi-border)]`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${colors.color}`} />
                      <span className="text-xs text-[var(--rowi-muted)]">
                        {t(`admin.affinity.contexts.${context}.title`)}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--rowi-foreground)]">
                      {avg > 0 ? avg.toFixed(0) : "—"}
                    </div>
                    <div className="mt-2 h-1.5 bg-[var(--rowi-muted)]/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.color.replace("text-", "bg-")}`}
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
                {t("admin.affinity.stats.topConnections")}
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
                        {t("admin.affinity.context")}: {conn.context}
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
                {t("admin.affinity.stats.needUpdate")}
              </p>
              <p className="text-sm text-[var(--rowi-muted)]">
                {t("admin.affinity.stats.needUpdateDesc")}
              </p>
            </div>
            <button
              onClick={handleRecalculate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white
                hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? t("admin.affinity.recalculating") : t("admin.affinity.recalculateNow")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
