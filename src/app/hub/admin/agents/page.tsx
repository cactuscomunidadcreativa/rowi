"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  RefreshCcw,
  Zap,
  Globe,
  Building2,
  Network,
  Layers3,
  Building,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminList,
  AdminListItem,
  AdminButton,
  AdminBadge,
  AdminEmpty,
  AdminViewToggle,
  AdminSearch,
  AdminToggle,
} from "@/components/admin/AdminPage";

/* =========================================================
   🤖 Rowi Admin — Agentes IA
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

interface Agent {
  id: string;
  slug: string;
  name: string;
  description?: string;
  model?: string;
  type: string;
  isActive: boolean;
  accessLevel?: string;
}

interface AgentMap {
  type: string;
  name: string;
  activeCount: number;
}

export default function AgentsPage() {
  const { t, ready } = useI18n();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  async function loadAgents() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agents", { cache: "no-store" });
      const data = await res.json();
      setAgents(data.agents || []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadAgents();
  }, [ready]);

  async function syncAgents() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/agents/sync", { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success(data.message || t("admin.agents.syncSuccess"));
      loadAgents();
    } catch (err: any) {
      toast.error(err.message || t("common.error"));
    } finally {
      setSyncing(false);
    }
  }

  async function toggleAgent(id: string, isActive: boolean) {
    try {
      await fetch("/api/admin/agents/active", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive } : a))
      );
      toast.success(isActive ? t("admin.common.active") : t("admin.common.inactive"));
    } catch {
      toast.error(t("common.error"));
    }
  }

  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPage
      titleKey="admin.agents.title"
      descriptionKey="admin.agents.description"
      icon={Bot}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadAgents} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton icon={Zap} onClick={syncAgents} loading={syncing} size="sm">
            {t("admin.agents.sync")}
          </AdminButton>
        </div>
      }
    >
      {filteredAgents.length === 0 ? (
        <AdminEmpty
          icon={Bot}
          titleKey="admin.agents.noAgents"
          descriptionKey="admin.agents.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filteredAgents.map((agent) => (
            <AgentListItem key={agent.id} agent={agent} onToggle={toggleAgent} />
          ))}
        </AdminList>
      ) : (
        <AdminGrid cols={4}>
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onToggle={toggleAgent} />
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}

/* =========================================================
   📋 AgentListItem — List view item
========================================================= */

interface AgentItemProps {
  agent: Agent;
  onToggle: (id: string, isActive: boolean) => void;
}

function AgentListItem({ agent, onToggle }: AgentItemProps) {
  const { t } = useI18n();
  const [map, setMap] = useState<AgentMap[]>([]);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!agent.slug) return;
    fetch(`/api/admin/agents/map?slug=${agent.slug}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMap(d.instances || []));
  }, [agent.slug]);

  const stats = {
    global: map.filter((m) => m.type === "Global").reduce((acc, m) => acc + m.activeCount, 0),
    tenants: map.filter((m) => m.type === "Tenant").reduce((acc, m) => acc + m.activeCount, 0),
    hubs: map.filter((m) => m.type === "Hub").reduce((acc, m) => acc + m.activeCount, 0),
    superhubs: map.filter((m) => m.type === "SuperHub").reduce((acc, m) => acc + m.activeCount, 0),
    orgs: map.filter((m) => m.type === "Org").reduce((acc, m) => acc + m.activeCount, 0),
  };

  const total = stats.global + stats.tenants + stats.hubs + stats.superhubs + stats.orgs;

  return (
    <AdminListItem
      icon={Bot}
      title={agent.name}
      subtitle={`${agent.type} • ${agent.model || "gpt-4o-mini"}`}
      badge={
        <AdminBadge variant={agent.isActive ? "success" : "neutral"}>
          {agent.isActive ? t("admin.common.active") : t("admin.common.inactive")}
        </AdminBadge>
      }
      meta={
        <div className="flex items-center gap-2">
          <div className="flex gap-1 text-[10px]">
            <ScopeBadge icon={Globe} count={stats.global} />
            <ScopeBadge icon={Building2} count={stats.tenants} />
            <ScopeBadge icon={Network} count={stats.hubs} />
            <ScopeBadge icon={Layers3} count={stats.superhubs} />
            <ScopeBadge icon={Building} count={stats.orgs} />
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className="p-1 rounded hover:bg-[var(--rowi-border)] transition-colors"
          >
            {showMap ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      }
      actions={
        <AdminToggle
          checked={agent.isActive}
          onChange={(checked) => onToggle(agent.id, checked)}
        />
      }
      expandable={showMap && map.length > 0}
      expandedContent={
        <div className="mt-2 pt-2 border-t border-[var(--rowi-border)] grid grid-cols-2 md:grid-cols-4 gap-2">
          {map.map((m, i) => (
            <div key={i} className="flex items-center justify-between text-xs px-2 py-1 bg-[var(--rowi-background)] rounded">
              <span className="text-[var(--rowi-muted)] truncate">
                {m.type === "Global" ? `🌍 ${t("admin.agents.global")}` : m.name}
              </span>
              <AdminBadge variant={m.activeCount > 0 ? "success" : "neutral"}>
                {m.activeCount}
              </AdminBadge>
            </div>
          ))}
        </div>
      }
    />
  );
}

/* =========================================================
   🃏 AgentCard — Grid view card
========================================================= */

function AgentCard({ agent, onToggle }: AgentItemProps) {
  const { t } = useI18n();
  const [map, setMap] = useState<AgentMap[]>([]);

  useEffect(() => {
    if (!agent.slug) return;
    fetch(`/api/admin/agents/map?slug=${agent.slug}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMap(d.instances || []));
  }, [agent.slug]);

  const stats = {
    global: map.filter((m) => m.type === "Global").reduce((acc, m) => acc + m.activeCount, 0),
    tenants: map.filter((m) => m.type === "Tenant").reduce((acc, m) => acc + m.activeCount, 0),
    hubs: map.filter((m) => m.type === "Hub").reduce((acc, m) => acc + m.activeCount, 0),
    superhubs: map.filter((m) => m.type === "SuperHub").reduce((acc, m) => acc + m.activeCount, 0),
    orgs: map.filter((m) => m.type === "Org").reduce((acc, m) => acc + m.activeCount, 0),
  };

  return (
    <AdminCard compact className="group flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <AdminBadge variant={agent.isActive ? "success" : "neutral"}>
          {agent.isActive ? t("admin.common.active") : t("admin.common.inactive")}
        </AdminBadge>
      </div>

      <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">{agent.name}</h3>
      <p className="text-xs text-[var(--rowi-muted)]">{agent.type}</p>
      <p className="text-[10px] text-[var(--rowi-muted)] font-mono mt-1">{agent.model || "gpt-4o-mini"}</p>

      <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-[var(--rowi-border)]">
        <ScopeBadge icon={Globe} count={stats.global} label="G" />
        <ScopeBadge icon={Building2} count={stats.tenants} label="T" />
        <ScopeBadge icon={Network} count={stats.hubs} label="H" />
        <ScopeBadge icon={Layers3} count={stats.superhubs} label="S" />
        <ScopeBadge icon={Building} count={stats.orgs} label="O" />
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--rowi-border)]">
        <span className="text-xs text-[var(--rowi-muted)]">{t("admin.common.status")}</span>
        <AdminToggle
          checked={agent.isActive}
          onChange={(checked) => onToggle(agent.id, checked)}
        />
      </div>
    </AdminCard>
  );
}

/* =========================================================
   🏷️ ScopeBadge — Mini scope indicator
========================================================= */

function ScopeBadge({
  icon: Icon,
  count,
  label,
}: {
  icon: any;
  count: number;
  label?: string;
}) {
  return (
    <div
      className={`
        inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]
        ${count > 0
          ? "bg-[var(--rowi-success)]/10 text-[var(--rowi-success)]"
          : "bg-[var(--rowi-border)] text-[var(--rowi-muted)]"
        }
      `}
    >
      <Icon className="w-2.5 h-2.5" />
      <span>{count}</span>
      {label && <span className="hidden sm:inline">{label}</span>}
    </div>
  );
}
