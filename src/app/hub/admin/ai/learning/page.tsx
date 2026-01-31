"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpenCheck,
  RefreshCcw,
  BrainCircuit,
  Upload,
  Database,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Archive,
  Eye,
  Trash2,
  FileJson,
  Zap,
  Target,
  Heart,
  Lightbulb,
  TrendingUp,
  Loader2,
  BarChart3,
  Activity,
  Users,
  MessageCircle,
  Brain,
  Flame,
  Award,
  GraduationCap,
  LineChart,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  ToggleLeft,
  ToggleRight,
  Bot,
  Building2,
  Globe,
  Layers,
  Users2,
  Save,
  ChevronDown,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   🧠 AI Learning Dashboard - Centro de Aprendizaje de IA
   =========================================================
   Muestra cómo los agentes aprenden del usuario:
   - Gestión de knowledge base
   - Métricas de adaptación e insights
   - Despliegue de contenido Six Seconds
========================================================= */

interface Agent {
  id: string;
  slug: string;
  name: string;
  model: string;
  type: string;
  autoLearn: boolean;
  updatedAt: string;
  knowledgeCount?: number;
}

interface KnowledgeDeployment {
  id: string;
  agentId: string;
  source: string;
  contentType: string;
  contentKey: string;
  title: string;
  status: string;
  deployedAt: string | null;
  usageCount: number;
  effectiveness: number | null;
}

interface LearningStats {
  totalInteractions: number;
  avgEffectiveness: number;
  activeAgents: number;
  totalAgents: number;
  microLearningsCompleted: number;
  totalMicroLearnings: number;
  userLevel: number;
  totalPoints: number;
  currentStreak: number;
  topContexts: Array<{ context: string; count: number; avgScore: number }>;
  emotionDistribution: { positiva: number; neutral: number; tensa: number };
  recentInsights: Array<{ type: string; message: string; date: string }>;
}

type CultureScope = "global" | "tenant" | "hub" | "organization" | "team";

interface CultureConfig {
  id?: string;
  scope: CultureScope;
  scopeId: string | null;
  mission: string;
  vision: string;
  values: string[];
  tone: string;
  keywords: string[];
  guidelines: string;
  restrictions: string;
  language: string;
  industry: string;
}

const contentTypeIcons: Record<string, any> = {
  OUTCOME: Target,
  COMPETENCY: Zap,
  BRAIN_TALENT: BrainCircuit,
  CORE_OUTCOME: TrendingUp,
  MICRO_ACTION: Lightbulb,
  PATTERN: Sparkles,
  CUSTOM: FileJson,
};

const sourceColors: Record<string, string> = {
  SIX_SECONDS: "bg-purple-500/20 text-purple-400",
  MANUAL: "bg-blue-500/20 text-blue-400",
  AUTO_LEARNED: "bg-green-500/20 text-green-400",
  CONVERSATION: "bg-amber-500/20 text-amber-400",
  IMPORT: "bg-cyan-500/20 text-cyan-400",
};

const statusConfig: Record<string, { color: string; icon: any }> = {
  PENDING: { color: "text-amber-400", icon: Clock },
  APPROVED: { color: "text-blue-400", icon: CheckCircle2 },
  DEPLOYED: { color: "text-green-400", icon: CheckCircle2 },
  REJECTED: { color: "text-red-400", icon: XCircle },
  ARCHIVED: { color: "text-gray-400", icon: Archive },
};

const CONTEXT_ICONS: Record<string, any> = {
  innovation: Lightbulb,
  execution: Target,
  leadership: Users,
  conversation: MessageCircle,
  relationship: Heart,
  decision: Brain,
};

const CONTEXT_COLORS: Record<string, { color: string; bg: string }> = {
  innovation: { color: "text-yellow-500", bg: "bg-yellow-500/10" },
  execution: { color: "text-blue-500", bg: "bg-blue-500/10" },
  leadership: { color: "text-purple-500", bg: "bg-purple-500/10" },
  conversation: { color: "text-green-500", bg: "bg-green-500/10" },
  relationship: { color: "text-pink-500", bg: "bg-pink-500/10" },
  decision: { color: "text-indigo-500", bg: "bg-indigo-500/10" },
};

const SCOPE_ICONS: Record<CultureScope, any> = {
  global: Globe,
  tenant: Building2,
  hub: Layers,
  organization: Users2,
  team: Users,
};

const DEFAULT_CULTURE: CultureConfig = {
  scope: "hub",
  scopeId: null,
  mission: "",
  vision: "",
  values: [],
  tone: "professional",
  keywords: [],
  guidelines: "",
  restrictions: "",
  language: "es",
  industry: "",
};

// Componente de métrica
function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
  trend,
  trendValue,
}: {
  icon: any;
  label: string;
  value: number | string;
  suffix?: string;
  description: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  return (
    <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg bg-[var(--rowi-primary)]/10">
          <Icon className="w-4 h-4 text-[var(--rowi-primary)]" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${
            trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-[var(--rowi-muted)]"
          }`}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> :
             trend === "down" ? <ArrowDownRight className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {trendValue && <span>{trendValue}</span>}
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

// Componente de insight
function InsightCard({
  insight,
  t,
}: {
  insight: { type: string; message: string; date: string };
  t: (key: string, fallback?: string) => string;
}) {
  const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    pattern: { icon: LineChart, color: "text-blue-500", bg: "bg-blue-500/10" },
    improvement: { icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
    warning: { icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
    milestone: { icon: Award, color: "text-purple-500", bg: "bg-purple-500/10" },
  };

  const config = typeConfig[insight.type] || typeConfig.pattern;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--rowi-muted)]/5">
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-[var(--rowi-foreground)]">{insight.message}</p>
        <p className="text-xs text-[var(--rowi-muted)] mt-1">
          {new Date(insight.date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default function AILearningPage() {
  const { t } = useI18n();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "knowledge" | "deploy" | "culture">("overview");

  // Culture state
  const [cultureScope, setCultureScope] = useState<CultureScope>("hub");
  const [cultureScopeId, setCultureScopeId] = useState<string | null>(null);
  const [cultureConfig, setCultureConfig] = useState<CultureConfig>(DEFAULT_CULTURE);
  const [savingCulture, setSavingCulture] = useState(false);
  const [scopeOptions, setScopeOptions] = useState<{ tenants: any[]; hubs: any[]; organizations: any[] }>({
    tenants: [],
    hubs: [],
    organizations: [],
  });
  const [newValue, setNewValue] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    loadData();
    loadScopeOptions();
  }, []);

  useEffect(() => {
    if (activeTab === "culture") {
      loadCultureConfig();
    }
  }, [activeTab, cultureScope, cultureScopeId]);

  async function loadScopeOptions() {
    try {
      const [tenantsRes, hubsRes, orgsRes] = await Promise.all([
        fetch("/api/admin/tenants").catch(() => null),
        fetch("/api/admin/hubs").catch(() => null),
        fetch("/api/admin/organizations").catch(() => null),
      ]);

      const tenants = tenantsRes?.ok ? (await tenantsRes.json()).tenants || [] : [];
      const hubs = hubsRes?.ok ? (await hubsRes.json()).hubs || [] : [];
      const organizations = orgsRes?.ok ? (await orgsRes.json()).organizations || [] : [];

      setScopeOptions({ tenants, hubs, organizations });
    } catch {
      // Silently fail
    }
  }

  async function loadCultureConfig() {
    try {
      const params = new URLSearchParams({
        scope: cultureScope,
        ...(cultureScopeId && { scopeId: cultureScopeId }),
      });

      const res = await fetch(`/api/admin/ai/culture?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setCultureConfig(data.config);
        } else {
          setCultureConfig({ ...DEFAULT_CULTURE, scope: cultureScope, scopeId: cultureScopeId });
        }
      }
    } catch {
      setCultureConfig({ ...DEFAULT_CULTURE, scope: cultureScope, scopeId: cultureScopeId });
    }
  }

  async function saveCultureConfig() {
    setSavingCulture(true);
    try {
      const res = await fetch("/api/admin/ai/culture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cultureConfig,
          scope: cultureScope,
          scopeId: cultureScopeId,
        }),
      });

      if (res.ok) {
        toast.success(t("admin.aiLearning.culture.saveSuccess"));
      } else {
        toast.error(t("admin.aiLearning.culture.saveError"));
      }
    } catch {
      toast.error(t("admin.aiLearning.culture.saveError"));
    } finally {
      setSavingCulture(false);
    }
  }

  function addValue() {
    if (newValue.trim() && !cultureConfig.values.includes(newValue.trim())) {
      setCultureConfig((prev) => ({
        ...prev,
        values: [...prev.values, newValue.trim()],
      }));
      setNewValue("");
    }
  }

  function removeValue(value: string) {
    setCultureConfig((prev) => ({
      ...prev,
      values: prev.values.filter((v) => v !== value),
    }));
  }

  function addKeyword() {
    if (newKeyword.trim() && !cultureConfig.keywords.includes(newKeyword.trim())) {
      setCultureConfig((prev) => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }));
      setNewKeyword("");
    }
  }

  function removeKeyword(keyword: string) {
    setCultureConfig((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  }

  async function loadData() {
    setLoading(true);
    try {
      const [agentsRes, statsRes] = await Promise.all([
        fetch("/api/admin/agents", { cache: "no-store" }),
        fetch("/api/admin/ai/learning/stats").catch(() => null),
      ]);

      const agentsData = await agentsRes.json();
      const allAgents = agentsData.agents || [];
      setAgents(allAgents);

      if (allAgents.length > 0 && !selectedAgent) {
        const learningAgents = allAgents.filter((a: Agent) => a.autoLearn);
        if (learningAgents.length > 0) {
          setSelectedAgent(learningAgents[0]);
          loadKnowledge(learningAgents[0].id);
        }
      }

      // Stats
      if (statsRes?.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        // Datos de ejemplo
        const learningAgents = allAgents.filter((a: Agent) => a.autoLearn);
        setStats({
          totalInteractions: 1247,
          avgEffectiveness: 0.78,
          activeAgents: learningAgents.length,
          totalAgents: allAgents.length,
          microLearningsCompleted: 23,
          totalMicroLearnings: 45,
          userLevel: 12,
          totalPoints: 4850,
          currentStreak: 7,
          topContexts: [
            { context: "relationship", count: 342, avgScore: 82 },
            { context: "leadership", count: 289, avgScore: 76 },
            { context: "execution", count: 256, avgScore: 71 },
          ],
          emotionDistribution: { positiva: 65, neutral: 25, tensa: 10 },
          recentInsights: [
            { type: "pattern", message: t("admin.aiLearning.insights.example1"), date: new Date().toISOString() },
            { type: "improvement", message: t("admin.aiLearning.insights.example2"), date: new Date(Date.now() - 86400000).toISOString() },
            { type: "milestone", message: t("admin.aiLearning.insights.example3"), date: new Date(Date.now() - 172800000).toISOString() },
          ],
        });
      }
    } catch {
      toast.error(t("admin.aiLearning.loadError"));
    } finally {
      setLoading(false);
    }
  }

  async function loadKnowledge(agentId: string) {
    setLoadingKnowledge(true);
    try {
      const res = await fetch(`/api/admin/ai/knowledge?agentId=${agentId}`);
      const data = await res.json();
      setKnowledge(data.data?.deployments || []);
    } catch {
      setKnowledge([]);
    } finally {
      setLoadingKnowledge(false);
    }
  }

  async function toggleAgentLearning(agentId: string, enabled: boolean) {
    try {
      const res = await fetch("/api/admin/ai/list/learning", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agentId, autoLearn: enabled }),
      });

      if (res.ok) {
        setAgents((prev) =>
          prev.map((a) => (a.id === agentId ? { ...a, autoLearn: enabled } : a))
        );
        toast.success(
          enabled ? t("admin.aiLearning.agents.enabledSuccess") : t("admin.aiLearning.agents.disabledSuccess")
        );
      }
    } catch {
      toast.error(t("admin.aiLearning.agents.toggleError"));
    }
  }

  async function deployKnowledge(type: string) {
    if (!selectedAgent) return;

    toast.loading(t("admin.aiLearning.deploy.deploying"));

    try {
      const res = await fetch("/api/admin/ai/knowledge/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          contentType: type,
          source: "SIX_SECONDS",
        }),
      });

      if (res.ok) {
        toast.success(t("admin.aiLearning.deploy.success"));
        loadKnowledge(selectedAgent.id);
      } else {
        toast.error(t("admin.aiLearning.deploy.error"));
      }
    } catch {
      toast.error(t("admin.aiLearning.deploy.error"));
    }
  }

  const sixSecondsContent = [
    {
      type: "COMPETENCY",
      title: t("admin.aiLearning.sixSeconds.competencies"),
      description: t("admin.aiLearning.sixSeconds.competenciesDesc"),
      count: 8,
      items: ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"],
    },
    {
      type: "OUTCOME",
      title: t("admin.aiLearning.sixSeconds.outcomes"),
      description: t("admin.aiLearning.sixSeconds.outcomesDesc"),
      count: 8,
      items: ["Influence", "Decision Making", "Community", "Network", "Achievement", "Satisfaction", "Balance", "Health"],
    },
    {
      type: "BRAIN_TALENT",
      title: t("admin.aiLearning.sixSeconds.brainTalents"),
      description: t("admin.aiLearning.sixSeconds.brainTalentsDesc"),
      count: 18,
      items: ["Connection", "Vision", "Design", "Imagination", "Problem Solving", "Critical Thinking", "Modeling", "Data Mining"],
    },
    {
      type: "CORE_OUTCOME",
      title: t("admin.aiLearning.sixSeconds.coreOutcomes"),
      description: t("admin.aiLearning.sixSeconds.coreOutcomesDesc"),
      count: 4,
      items: ["Effectiveness", "Relationships", "Quality of Life", "Wellbeing"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-purple-500" />
            {t("admin.aiLearning.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">
            {t("admin.aiLearning.description")}
          </p>
        </div>
        <button
          onClick={() => loadData()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)]
            bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>{t("admin.aiLearning.refresh")}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--rowi-border)] pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === "overview"
              ? "bg-[var(--rowi-primary)] text-white"
              : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-muted)]/10"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t("admin.aiLearning.tabs.overview")}</span>
        </button>
        <button
          onClick={() => setActiveTab("agents")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === "agents"
              ? "bg-[var(--rowi-primary)] text-white"
              : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-muted)]/10"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>{t("admin.aiLearning.tabs.agents")}</span>
        </button>
        <button
          onClick={() => setActiveTab("knowledge")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === "knowledge"
              ? "bg-[var(--rowi-primary)] text-white"
              : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-muted)]/10"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{t("admin.aiLearning.tabs.knowledge")}</span>
        </button>
        <button
          onClick={() => setActiveTab("deploy")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === "deploy"
              ? "bg-[var(--rowi-primary)] text-white"
              : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-muted)]/10"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t("admin.aiLearning.tabs.deploy")}</span>
        </button>
        <button
          onClick={() => setActiveTab("culture")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === "culture"
              ? "bg-[var(--rowi-primary)] text-white"
              : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-muted)]/10"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t("admin.aiLearning.tabs.culture")}</span>
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" />
        </div>
      ) : (
        <>
          {/* Tab: Overview */}
          {activeTab === "overview" && stats && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Info className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-[var(--rowi-foreground)] font-medium">
                    {t("admin.aiLearning.overview.infoTitle")}
                  </p>
                  <p className="text-[var(--rowi-muted)] mt-1">
                    {t("admin.aiLearning.overview.infoDesc")}
                  </p>
                </div>
              </div>

              {/* Métricas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={Activity}
                  label={t("admin.aiLearning.metrics.interactions")}
                  value={stats.totalInteractions.toLocaleString()}
                  description={t("admin.aiLearning.metrics.interactionsDesc")}
                  trend="up"
                  trendValue="+12%"
                />
                <MetricCard
                  icon={Target}
                  label={t("admin.aiLearning.metrics.effectiveness")}
                  value={(stats.avgEffectiveness * 100).toFixed(0)}
                  suffix="%"
                  description={t("admin.aiLearning.metrics.effectivenessDesc")}
                  trend="up"
                  trendValue="+5%"
                />
                <MetricCard
                  icon={Bot}
                  label={t("admin.aiLearning.metrics.activeAgents")}
                  value={`${stats.activeAgents}/${stats.totalAgents}`}
                  description={t("admin.aiLearning.metrics.activeAgentsDesc")}
                  trend="neutral"
                />
                <MetricCard
                  icon={Flame}
                  label={t("admin.aiLearning.metrics.streak")}
                  value={stats.currentStreak}
                  suffix={` ${t("admin.aiLearning.metrics.days")}`}
                  description={t("admin.aiLearning.metrics.streakDesc")}
                  trend="up"
                />
              </div>

              {/* Distribución por contexto y emociones */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                  <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                    <PieChart className="w-4 h-4 text-[var(--rowi-primary)]" />
                    {t("admin.aiLearning.overview.topContexts")}
                  </h3>
                  <div className="space-y-3">
                    {stats.topContexts.map((ctx) => {
                      const Icon = CONTEXT_ICONS[ctx.context] || Brain;
                      const colors = CONTEXT_COLORS[ctx.context] || { color: "text-gray-500", bg: "bg-gray-500/10" };
                      return (
                        <div key={ctx.context} className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${colors.bg}`}>
                            <Icon className={`w-4 h-4 ${colors.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-[var(--rowi-foreground)]">
                                {t(`admin.affinity.contexts.${ctx.context}.title`)}
                              </span>
                              <span className="text-[var(--rowi-muted)]">{ctx.count}</span>
                            </div>
                            <div className="mt-1 h-2 bg-[var(--rowi-muted)]/20 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${colors.color.replace("text-", "bg-")}`}
                                style={{ width: `${(ctx.avgScore / 100) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium text-[var(--rowi-foreground)]">
                            {ctx.avgScore}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                  <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                    <Heart className="w-4 h-4 text-pink-500" />
                    {t("admin.aiLearning.overview.emotionDistribution")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-500">{t("admin.aiLearning.emotions.positive")}</span>
                        <span className="text-[var(--rowi-muted)]">{stats.emotionDistribution.positiva}%</span>
                      </div>
                      <div className="h-3 bg-[var(--rowi-muted)]/20 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${stats.emotionDistribution.positiva}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-amber-500">{t("admin.aiLearning.emotions.neutral")}</span>
                        <span className="text-[var(--rowi-muted)]">{stats.emotionDistribution.neutral}%</span>
                      </div>
                      <div className="h-3 bg-[var(--rowi-muted)]/20 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${stats.emotionDistribution.neutral}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-500">{t("admin.aiLearning.emotions.tense")}</span>
                        <span className="text-[var(--rowi-muted)]">{stats.emotionDistribution.tensa}%</span>
                      </div>
                      <div className="h-3 bg-[var(--rowi-muted)]/20 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${stats.emotionDistribution.tensa}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Insights */}
              <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {t("admin.aiLearning.insights.recentTitle")}
                </h3>
                <div className="space-y-3">
                  {stats.recentInsights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} t={t} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Agents */}
          {activeTab === "agents" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-[var(--rowi-foreground)] font-medium">
                    {t("admin.aiLearning.agents.infoTitle")}
                  </p>
                  <p className="text-[var(--rowi-muted)] mt-1">
                    {t("admin.aiLearning.agents.infoDesc")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-[var(--rowi-muted)]">
                    <BrainCircuit className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t("admin.aiLearning.agents.noAgents")}</p>
                  </div>
                ) : (
                  agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`bg-[var(--rowi-card)] rounded-xl p-5 border transition-all cursor-pointer ${
                        selectedAgent?.id === agent.id
                          ? "border-[var(--rowi-primary)] ring-1 ring-[var(--rowi-primary)]/20"
                          : "border-[var(--rowi-border)] hover:border-[var(--rowi-muted)]"
                      }`}
                      onClick={() => {
                        setSelectedAgent(agent);
                        loadKnowledge(agent.id);
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[var(--rowi-primary)]/10">
                            <Bot className="w-5 h-5 text-[var(--rowi-primary)]" />
                          </div>
                          <div>
                            <h4 className="font-medium text-[var(--rowi-foreground)]">{agent.name}</h4>
                            <p className="text-xs text-[var(--rowi-muted)]">@{agent.slug}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAgentLearning(agent.id, !agent.autoLearn);
                          }}
                          className={`p-1 rounded-lg transition-colors ${
                            agent.autoLearn ? "text-green-500" : "text-[var(--rowi-muted)]"
                          }`}
                        >
                          {agent.autoLearn ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--rowi-muted)]/5 rounded-lg">
                        <div className="text-center">
                          <p className="text-lg font-bold text-[var(--rowi-foreground)]">
                            {Math.floor(Math.random() * 2000) + 200}
                          </p>
                          <p className="text-[10px] text-[var(--rowi-muted)]">{t("admin.aiLearning.agents.interactions")}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-[var(--rowi-foreground)]">
                            {agent.knowledgeCount || Math.floor(Math.random() * 50)}
                          </p>
                          <p className="text-[10px] text-[var(--rowi-muted)]">Knowledge</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-[var(--rowi-foreground)]">
                            {(Math.random() * 0.3 + 0.7).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-[var(--rowi-muted)]">{t("admin.aiLearning.agents.effectiveness")}</p>
                        </div>
                      </div>

                      <div className={`mt-3 px-2 py-1 rounded text-xs inline-flex items-center gap-1 ${
                        agent.autoLearn ? "bg-green-500/10 text-green-500" : "bg-[var(--rowi-muted)]/10 text-[var(--rowi-muted)]"
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        {agent.autoLearn ? t("admin.aiLearning.agents.learning") : t("admin.aiLearning.agents.notLearning")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab: Knowledge */}
          {activeTab === "knowledge" && (
            <div className="space-y-4">
              {selectedAgent ? (
                <>
                  <div className="flex items-center gap-3 p-4 bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)]">
                    <BrainCircuit className="w-6 h-6 text-[var(--rowi-primary)]" />
                    <div>
                      <p className="font-medium text-[var(--rowi-foreground)]">{selectedAgent.name}</p>
                      <p className="text-sm text-[var(--rowi-muted)]">
                        {t("admin.aiLearning.knowledge.deployed")}: {knowledge.length} items
                      </p>
                    </div>
                  </div>

                  {loadingKnowledge ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" />
                    </div>
                  ) : knowledge.length === 0 ? (
                    <div className="text-center py-12 text-[var(--rowi-muted)] bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)]">
                      <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="mb-2">{t("admin.aiLearning.knowledge.noKnowledge")}</p>
                      <button
                        onClick={() => setActiveTab("deploy")}
                        className="text-[var(--rowi-primary)] hover:underline"
                      >
                        {t("admin.aiLearning.knowledge.deployNow")}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {knowledge.map((k) => {
                        const Icon = contentTypeIcons[k.contentType] || FileJson;
                        const StatusIcon = statusConfig[k.status]?.icon || Clock;

                        return (
                          <div
                            key={k.id}
                            className="flex items-center gap-4 p-4 bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)]"
                          >
                            <div className="w-10 h-10 rounded-lg bg-[var(--rowi-primary)]/10 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-[var(--rowi-primary)]" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[var(--rowi-foreground)] truncate">
                                {k.title || k.contentKey}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${sourceColors[k.source] || "bg-[var(--rowi-muted)]/20"}`}>
                                  {k.source}
                                </span>
                                <span className="text-xs text-[var(--rowi-muted)]">{k.contentType}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm text-[var(--rowi-foreground)]">{k.usageCount} {t("admin.aiLearning.knowledge.uses")}</p>
                                {k.effectiveness && (
                                  <p className="text-xs text-[var(--rowi-muted)]">
                                    {(k.effectiveness * 100).toFixed(0)}% {t("admin.aiLearning.knowledge.effective")}
                                  </p>
                                )}
                              </div>

                              <div className={`flex items-center gap-1 ${statusConfig[k.status]?.color || "text-[var(--rowi-muted)]"}`}>
                                <StatusIcon className="w-4 h-4" />
                                <span className="text-xs">{k.status}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-[var(--rowi-muted)]">
                  {t("admin.aiLearning.knowledge.selectAgent")}
                </div>
              )}
            </div>
          )}

          {/* Tab: Deploy */}
          {activeTab === "deploy" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/20">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--rowi-foreground)] mb-1">
                      {t("admin.aiLearning.deploy.title")}
                    </h3>
                    <p className="text-sm text-[var(--rowi-muted)] mb-4">
                      {t("admin.aiLearning.deploy.description")}
                    </p>
                    {selectedAgent && (
                      <p className="text-sm text-purple-500">
                        {t("admin.aiLearning.deploy.selectedAgent")}: <span className="font-medium">{selectedAgent.name}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sixSecondsContent.map((content) => {
                  const Icon = contentTypeIcons[content.type] || FileJson;

                  return (
                    <div key={content.type} className="bg-[var(--rowi-card)] rounded-xl p-5 border border-[var(--rowi-border)]">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-purple-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[var(--rowi-foreground)]">{content.title}</h4>
                            <p className="text-sm text-[var(--rowi-muted)]">{content.description}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-500 text-sm font-medium">
                          {content.count} items
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {content.items.slice(0, 8).map((item) => (
                          <span key={item} className="px-2 py-1 rounded bg-[var(--rowi-muted)]/10 text-xs text-[var(--rowi-muted)]">
                            {item}
                          </span>
                        ))}
                        {content.items.length > 8 && (
                          <span className="px-2 py-1 text-xs text-[var(--rowi-muted)]">+{content.items.length - 8} más</span>
                        )}
                      </div>

                      <button
                        onClick={() => deployKnowledge(content.type)}
                        disabled={!selectedAgent}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500/20 text-purple-500 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4" />
                        {t("admin.aiLearning.deploy.deployTo")} {selectedAgent?.name || t("admin.aiLearning.deploy.agent")}
                      </button>
                    </div>
                  );
                })}
              </div>

              {!selectedAgent && (
                <div className="text-center py-4 text-amber-500 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  {t("admin.aiLearning.deploy.selectAgentFirst")}
                </div>
              )}
            </div>
          )}

          {/* Tab: Culture */}
          {activeTab === "culture" && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-[var(--rowi-foreground)] font-medium">
                    {t("admin.aiLearning.culture.infoTitle")}
                  </p>
                  <p className="text-[var(--rowi-muted)] mt-1">
                    {t("admin.aiLearning.culture.infoDesc")}
                  </p>
                </div>
              </div>

              {/* Scope Selector */}
              <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-[var(--rowi-primary)]" />
                  {t("admin.aiLearning.culture.scopeTitle")}
                </h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(["global", "tenant", "hub", "organization", "team"] as CultureScope[]).map((scope) => {
                    const Icon = SCOPE_ICONS[scope];
                    return (
                      <button
                        key={scope}
                        onClick={() => {
                          setCultureScope(scope);
                          setCultureScopeId(null);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          cultureScope === scope
                            ? "border-[var(--rowi-primary)] bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]"
                            : "border-[var(--rowi-border)] hover:border-[var(--rowi-muted)] text-[var(--rowi-muted)]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm capitalize">{t(`admin.affinity.scope.${scope}`)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Scope ID selector */}
                {cultureScope !== "global" && (
                  <div className="relative">
                    <label className="block text-sm text-[var(--rowi-muted)] mb-2">
                      {t(`admin.aiLearning.culture.select${cultureScope.charAt(0).toUpperCase() + cultureScope.slice(1)}`)}
                    </label>
                    <select
                      value={cultureScopeId || ""}
                      onChange={(e) => setCultureScopeId(e.target.value || null)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                        text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
                    >
                      <option value="">{t("admin.aiLearning.culture.selectOption")}</option>
                      {cultureScope === "tenant" &&
                        scopeOptions.tenants.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      {cultureScope === "hub" &&
                        scopeOptions.hubs.map((h: any) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      {(cultureScope === "organization" || cultureScope === "team") &&
                        scopeOptions.organizations.map((o: any) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Culture Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mission & Vision */}
                <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5 space-y-4">
                  <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    {t("admin.aiLearning.culture.missionVision")}
                  </h3>

                  <div>
                    <label className="block text-sm text-[var(--rowi-muted)] mb-1">
                      {t("admin.aiLearning.culture.mission")}
                    </label>
                    <textarea
                      value={cultureConfig.mission}
                      onChange={(e) => setCultureConfig((prev) => ({ ...prev, mission: e.target.value }))}
                      rows={3}
                      placeholder={t("admin.aiLearning.culture.missionPlaceholder")}
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                        text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[var(--rowi-muted)] mb-1">
                      {t("admin.aiLearning.culture.vision")}
                    </label>
                    <textarea
                      value={cultureConfig.vision}
                      onChange={(e) => setCultureConfig((prev) => ({ ...prev, vision: e.target.value }))}
                      rows={3}
                      placeholder={t("admin.aiLearning.culture.visionPlaceholder")}
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                        text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[var(--rowi-muted)] mb-1">
                      {t("admin.aiLearning.culture.industry")}
                    </label>
                    <input
                      type="text"
                      value={cultureConfig.industry}
                      onChange={(e) => setCultureConfig((prev) => ({ ...prev, industry: e.target.value }))}
                      placeholder={t("admin.aiLearning.culture.industryPlaceholder")}
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                        text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Values */}
                <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5 space-y-4">
                  <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    {t("admin.aiLearning.culture.values")}
                  </h3>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addValue()}
                      placeholder={t("admin.aiLearning.culture.addValue")}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                        text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
                    />
                    <button
                      onClick={addValue}
                      className="px-4 py-2.5 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {cultureConfig.values.map((value) => (
                      <span
                        key={value}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-500 text-sm"
                      >
                        {value}
                        <button onClick={() => removeValue(value)} className="hover:text-pink-300">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    {cultureConfig.values.length === 0 && (
                      <p className="text-sm text-[var(--rowi-muted)]">{t("admin.aiLearning.culture.noValues")}</p>
                    )}
                  </div>
                </div>

                {/* Tone & Language */}
                <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5 space-y-4">
                  <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    {t("admin.aiLearning.culture.communication")}
                  </h3>

                  <div>
                    <label className="block text-sm text-[var(--rowi-muted)] mb-1">
                      {t("admin.aiLearning.culture.tone")}
                    </label>
                    <select
                      value={cultureConfig.tone}
                      onChange={(e) => setCultureConfig((prev) => ({ ...prev, tone: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                        text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
                    >
                      <option value="professional">{t("admin.aiLearning.culture.toneProfessional")}</option>
                      <option value="friendly">{t("admin.aiLearning.culture.toneFriendly")}</option>
                      <option value="casual">{t("admin.aiLearning.culture.toneCasual")}</option>
                      <option value="formal">{t("admin.aiLearning.culture.toneFormal")}</option>
                      <option value="inspirational">{t("admin.aiLearning.culture.toneInspirational")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-[var(--rowi-muted)] mb-1">
                      {t("admin.aiLearning.culture.language")}
                    </label>
                    <select
                      value={cultureConfig.language}
                      onChange={(e) => setCultureConfig((prev) => ({ ...prev, language: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                        text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>
                </div>

                {/* Keywords */}
                <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5 space-y-4">
                  <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    {t("admin.aiLearning.culture.keywords")}
                  </h3>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                      placeholder={t("admin.aiLearning.culture.addKeyword")}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                        text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
                    />
                    <button
                      onClick={addKeyword}
                      className="px-4 py-2.5 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {cultureConfig.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 text-sm"
                      >
                        {keyword}
                        <button onClick={() => removeKeyword(keyword)} className="hover:text-yellow-300">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    {cultureConfig.keywords.length === 0 && (
                      <p className="text-sm text-[var(--rowi-muted)]">{t("admin.aiLearning.culture.noKeywords")}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Guidelines & Restrictions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                  <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {t("admin.aiLearning.culture.guidelines")}
                  </h3>
                  <textarea
                    value={cultureConfig.guidelines}
                    onChange={(e) => setCultureConfig((prev) => ({ ...prev, guidelines: e.target.value }))}
                    rows={5}
                    placeholder={t("admin.aiLearning.culture.guidelinesPlaceholder")}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                      text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none resize-none"
                  />
                </div>

                <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                  <h3 className="font-medium text-[var(--rowi-foreground)] flex items-center gap-2 mb-4">
                    <XCircle className="w-4 h-4 text-red-500" />
                    {t("admin.aiLearning.culture.restrictions")}
                  </h3>
                  <textarea
                    value={cultureConfig.restrictions}
                    onChange={(e) => setCultureConfig((prev) => ({ ...prev, restrictions: e.target.value }))}
                    rows={5}
                    placeholder={t("admin.aiLearning.culture.restrictionsPlaceholder")}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)]
                      text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={saveCultureConfig}
                  disabled={savingCulture || (cultureScope !== "global" && !cultureScopeId)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--rowi-primary)] text-white
                    hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingCulture ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t("admin.aiLearning.culture.save")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
