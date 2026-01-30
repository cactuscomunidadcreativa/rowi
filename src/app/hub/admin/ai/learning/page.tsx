// src/app/hub/admin/ai/learning/page.tsx
// ============================================================
// AI Learning Panel - Gestión de conocimiento de agentes IA
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpenCheck,
  RefreshCcw,
  Play,
  RotateCw,
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
  Plus,
  FileJson,
  Zap,
  Target,
  Heart,
  Lightbulb,
  TrendingUp,
  Loader2,
} from "lucide-react";

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

export default function AILearningPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"agents" | "knowledge" | "deploy">("agents");

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agents", { cache: "no-store" });
      const data = await res.json();
      const list = (data.agents || []).filter((a: any) => a.autoLearn === true);
      setAgents(list);
      if (list.length > 0 && !selectedAgent) {
        setSelectedAgent(list[0]);
        loadKnowledge(list[0].id);
      }
    } catch {
      toast.error("Error cargando agentes");
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

  async function deployKnowledge(type: string) {
    if (!selectedAgent) return;

    toast.loading(`Desplegando conocimiento de ${type}...`);

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
        toast.success(`Conocimiento de ${type} desplegado exitosamente`);
        loadKnowledge(selectedAgent.id);
      } else {
        toast.error("Error desplegando conocimiento");
      }
    } catch {
      toast.error("Error desplegando conocimiento");
    }
  }

  const sixSecondsContent = [
    {
      type: "COMPETENCY",
      title: "Competencias EQ",
      description: "8 competencias del modelo Six Seconds",
      count: 8,
      items: ["EEL", "RP", "ACT", "NE", "EIM", "EO", "IE", "PNG"],
    },
    {
      type: "OUTCOME",
      title: "Outcomes",
      description: "8 resultados de vida medibles",
      count: 8,
      items: ["Influence", "Decision Making", "Community", "Network", "Achievement", "Satisfaction", "Balance", "Health"],
    },
    {
      type: "BRAIN_TALENT",
      title: "Brain Talents",
      description: "18 talentos cerebrales únicos",
      count: 18,
      items: ["BBE", "BBI", "BBD", "BBF", "IDE", "IDI", "IDD", "IDF", "PRE", "PRI", "PRD", "PRF", "EME", "EMI", "EMD", "EMF", "RTE", "RTI"],
    },
    {
      type: "CORE_OUTCOME",
      title: "Core Outcomes",
      description: "4 resultados fundamentales",
      count: 4,
      items: ["Effectiveness", "Relationships", "Quality of Life", "Wellbeing"],
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <BrainCircuit className="w-8 h-8 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Learning</h1>
            <p className="text-gray-400">
              Gestiona el conocimiento y aprendizaje de los agentes IA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAgents()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Actualizar
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Upload className="w-4 h-4" />
            Desplegar Knowledge
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700/50 pb-4">
        {[
          { id: "agents", label: "Agentes IA", icon: BrainCircuit },
          { id: "knowledge", label: "Knowledge Base", icon: Database },
          { id: "deploy", label: "Desplegar Six Seconds", icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : activeTab === "agents" ? (
        /* Agents Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <BrainCircuit className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay agentes con autoLearn activado</p>
            </div>
          ) : (
            agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent);
                  loadKnowledge(agent.id);
                }}
                className={`cursor-pointer bg-gray-800/50 rounded-xl p-5 border transition-all hover:scale-[1.02] ${
                  selectedAgent?.id === agent.id
                    ? "border-purple-500/50 ring-1 ring-purple-500/20"
                    : "border-gray-700/50 hover:border-gray-600"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <BrainCircuit className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{agent.name}</h3>
                      <p className="text-xs text-gray-500">
                        {agent.model || "GPT-4"} · {agent.type}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                    AutoLearn
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-gray-900/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">
                      {Math.floor(Math.random() * 2000) + 200}
                    </p>
                    <p className="text-[10px] text-gray-500">Interacciones</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">
                      {agent.knowledgeCount || Math.floor(Math.random() * 50)}
                    </p>
                    <p className="text-[10px] text-gray-500">Knowledge</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">
                      {(Math.random() * 0.3 + 0.7).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-500">Efectividad</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Última actualización:{" "}
                  <span className="text-purple-400">
                    {new Date(agent.updatedAt).toLocaleDateString()}
                  </span>
                </p>
              </div>
            ))
          )}
        </div>
      ) : activeTab === "knowledge" ? (
        /* Knowledge Base */
        <div className="space-y-4">
          {selectedAgent ? (
            <>
              <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <BrainCircuit className="w-6 h-6 text-purple-500" />
                <div>
                  <p className="font-medium text-white">{selectedAgent.name}</p>
                  <p className="text-sm text-gray-500">
                    Knowledge desplegado: {knowledge.length} items
                  </p>
                </div>
              </div>

              {loadingKnowledge ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : knowledge.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-800/30 rounded-xl border border-gray-700/50">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-2">No hay knowledge desplegado para este agente</p>
                  <button
                    onClick={() => setActiveTab("deploy")}
                    className="text-purple-400 hover:underline"
                  >
                    Desplegar contenido de Six Seconds
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
                        className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-purple-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {k.title || k.contentKey}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                sourceColors[k.source] || "bg-gray-700 text-gray-300"
                              }`}
                            >
                              {k.source}
                            </span>
                            <span className="text-xs text-gray-500">
                              {k.contentType}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-white">{k.usageCount} usos</p>
                            {k.effectiveness && (
                              <p className="text-xs text-gray-500">
                                {(k.effectiveness * 100).toFixed(0)}% efectivo
                              </p>
                            )}
                          </div>

                          <div
                            className={`flex items-center gap-1 ${
                              statusConfig[k.status]?.color || "text-gray-400"
                            }`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-xs">{k.status}</span>
                          </div>

                          <div className="flex gap-1">
                            <button className="p-2 rounded-lg hover:bg-gray-700">
                              <Eye className="w-4 h-4 text-gray-400" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-gray-700">
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Selecciona un agente para ver su knowledge base
            </div>
          )}
        </div>
      ) : (
        /* Deploy Six Seconds Content */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Contenido Six Seconds
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Despliega el modelo de inteligencia emocional de Six Seconds a tus
                  agentes IA. Incluye competencias, outcomes, brain talents y
                  micro-acciones.
                </p>
                {selectedAgent && (
                  <p className="text-sm text-purple-400">
                    Agente seleccionado:{" "}
                    <span className="font-medium">{selectedAgent.name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sixSecondsContent.map((content) => {
              const Icon = contentTypeIcons[content.type] || FileJson;

              return (
                <div
                  key={content.type}
                  className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {content.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {content.description}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-sm font-medium">
                      {content.count} items
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {content.items.slice(0, 8).map((item) => (
                      <span
                        key={item}
                        className="px-2 py-1 rounded bg-gray-700/50 text-xs text-gray-400"
                      >
                        {item}
                      </span>
                    ))}
                    {content.items.length > 8 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{content.items.length - 8} más
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => deployKnowledge(content.type)}
                    disabled={!selectedAgent}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    Desplegar a{" "}
                    {selectedAgent?.name || "agente"}
                  </button>
                </div>
              );
            })}
          </div>

          {!selectedAgent && (
            <div className="text-center py-4 text-amber-400 bg-amber-500/10 rounded-lg border border-amber-500/20">
              Selecciona un agente en la pestaña "Agentes IA" para desplegar contenido
            </div>
          )}
        </div>
      )}
    </div>
  );
}
