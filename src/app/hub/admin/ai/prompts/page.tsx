"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MessageSquareCode,
  RefreshCcw,
  Eye,
  EyeOff,
  Pencil,
  Save,
  Globe2,
  Building2,
  Layers3,
  Building,
  MapPin,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminButton,
  AdminBadge,
  AdminEmpty,
  AdminSearch,
  AdminTextarea,
} from "@/components/admin/AdminPage";
import ContextSelectorModal from "@/components/ai/ContextSelectorModal";

/* =========================================================
   🧠 Rowi Admin — AI Prompts Management
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

export default function AdminPromptsPage() {
  const { t, ready } = useI18n();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [showContextSelector, setShowContextSelector] = useState(false);

  async function loadPrompts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prompts", { cache: "no-store" });
      const data = await res.json();
      setAgents(Array.isArray(data.agents) ? data.agents : []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadPrompts();
  }, [ready]);

  const filtered = agents.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.slug?.toLowerCase().includes(search.toLowerCase())
  );

  async function savePrompt() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editing.slug,
          prompt: editing.prompt,
          tenantId: editing.tenantId,
          superHubId: editing.superHubId,
          organizationId: editing.organizationId,
        }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      toast.success(t("admin.prompts.updated"));
      setEditing(null);
      loadPrompts();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  function getLevelInfo(a: any) {
    if (a.tenant) return { label: a.tenant.name, type: "tenant", Icon: Building2, variant: "info" as const };
    if (a.superHub) return { label: a.superHub.name, type: "superhub", Icon: Layers3, variant: "warning" as const };
    if (a.organization) return { label: a.organization.name, type: "org", Icon: Building, variant: "success" as const };
    return { label: t("admin.prompts.global"), type: "global", Icon: Globe2, variant: "default" as const };
  }

  return (
    <AdminPage
      titleKey="admin.prompts.title"
      descriptionKey="admin.prompts.description"
      icon={MessageSquareCode}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-48" />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadPrompts} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={MessageSquareCode}
          titleKey="admin.prompts.noPrompts"
          descriptionKey="admin.prompts.description"
        />
      ) : (
        <AdminGrid cols={3}>
          {filtered.map((a) => {
            const level = getLevelInfo(a);
            const isExpanded = expanded[a.id];
            const promptText = a.prompt?.trim() || t("admin.prompts.noPromptDefined");

            return (
              <AdminCard key={a.id} className="flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                      <MessageSquareCode className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                        {a.name}
                      </h3>
                      <p className="text-[10px] text-[var(--rowi-muted)]">
                        {a.model || "—"} · {a.type?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <AdminBadge variant={level.variant}>
                    <level.Icon className="w-3 h-3 mr-0.5" />
                    {level.label}
                  </AdminBadge>
                </div>

                {/* Prompt Preview */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-semibold text-[var(--rowi-muted)] uppercase">
                      Prompt
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setExpanded((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                        className="text-xs text-[var(--rowi-primary)] hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {isExpanded ? t("admin.prompts.hide") : t("admin.prompts.view")}
                      </button>
                    </div>
                  </div>

                  <div
                    className={`rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-border)] p-2 text-xs text-[var(--rowi-foreground)] transition-all duration-300 ${
                      isExpanded ? "max-h-48 overflow-y-auto" : "max-h-12 overflow-hidden"
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-mono text-[10px]">
                      {promptText}
                    </pre>
                  </div>

                  {/* Activation Map */}
                  <AgentActivationMap slug={a.slug} t={t} />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-[var(--rowi-border)]">
                  <AdminButton variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(a)}>
                    {t("admin.common.edit")}
                  </AdminButton>
                </div>
              </AdminCard>
            );
          })}
        </AdminGrid>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <AdminCard className="w-full max-w-2xl relative">
            <button
              onClick={() => setEditing(null)}
              className="absolute top-4 right-4 text-[var(--rowi-muted)] hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                <Pencil className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                  {t("admin.prompts.editPrompt")}
                </h3>
                <p className="text-xs text-[var(--rowi-muted)]">
                  {editing.name} — {editing.tenant?.name || t("admin.prompts.global")}
                </p>
              </div>
            </div>

            <AdminTextarea
              value={editing.prompt || ""}
              onChange={(v) => setEditing({ ...editing, prompt: v })}
              className="h-64 font-mono text-xs"
            />

            {/* Clone to context */}
            <div className="border-t border-[var(--rowi-border)] pt-4 mt-4 space-y-3">
              <h4 className="text-xs font-semibold text-[var(--rowi-foreground)]">
                {t("admin.prompts.applyToContext")}
              </h4>

              <AdminButton
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setShowContextSelector(true)}
              >
                {t("admin.prompts.selectDestination")}
              </AdminButton>

              {editing?.targetName && (
                <p className="text-xs text-[var(--rowi-muted)]">
                  {t("admin.prompts.selectedDestination")}: {editing.targetName}
                </p>
              )}

              {editing?.targetId && (
                <AdminButton
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/admin/agents/clone", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: editing.id,
                          targetType: editing.targetType,
                          targetId: editing.targetId,
                        }),
                      });
                      const j = await res.json();
                      if (!j.ok) throw new Error(j.error);
                      toast.success(t("admin.prompts.applied"));
                    } catch (e: any) {
                      toast.error(e.message || t("common.error"));
                    }
                  }}
                >
                  {t("admin.prompts.applyPrompt")}
                </AdminButton>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <AdminButton variant="secondary" onClick={() => setEditing(null)}>
                {t("admin.common.cancel")}
              </AdminButton>
              <AdminButton onClick={savePrompt} loading={saving} icon={Save}>
                {t("admin.common.save")}
              </AdminButton>
            </div>
          </AdminCard>
        </div>
      )}

      {/* Context Selector Modal */}
      {showContextSelector && (
        <ContextSelectorModal
          onClose={() => setShowContextSelector(false)}
          onSelect={(type, id, name) => {
            setEditing((prev: any) => ({
              ...prev,
              targetType: type,
              targetId: id,
              targetName: name,
            }));
            setShowContextSelector(false);
          }}
        />
      )}
    </AdminPage>
  );
}

/* =========================================================
   🗺️ Agent Activation Map
========================================================= */

function AgentActivationMap({ slug, t }: { slug: string; t: (key: string) => string }) {
  const [instances, setInstances] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/admin/agents/map?slug=${slug}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setInstances(d.instances || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return null;
  if (instances.length === 0) return null;

  const summary = {
    global: instances.filter((i) => !i.tenant && !i.superHub && !i.organization).length,
    tenants: instances.filter((i) => i.tenant).length,
    superhubs: instances.filter((i) => i.superHub).length,
    orgs: instances.filter((i) => i.organization).length,
  };

  return (
    <div className="mt-3 pt-2 border-t border-[var(--rowi-border)]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[var(--rowi-muted)] flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {t("admin.prompts.activeIn")}:
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-[var(--rowi-primary)] hover:underline"
        >
          {expanded ? t("admin.prompts.hideMap") : t("admin.prompts.showMap")}
        </button>
      </div>

      <div className="text-[10px] text-[var(--rowi-foreground)] mt-1">
        <span className="inline-flex items-center gap-1 mr-2">
          <Globe2 className="w-3 h-3" /> {summary.global}
        </span>
        <span className="inline-flex items-center gap-1 mr-2">
          <Building2 className="w-3 h-3" /> {summary.tenants}
        </span>
        <span className="inline-flex items-center gap-1 mr-2">
          <Layers3 className="w-3 h-3" /> {summary.superhubs}
        </span>
        <span className="inline-flex items-center gap-1">
          <Building className="w-3 h-3" /> {summary.orgs}
        </span>
      </div>

      {expanded && (
        <ul className="mt-2 space-y-1">
          {instances.map((i, k) => (
            <li key={k} className="text-[10px] text-[var(--rowi-muted)] flex items-center gap-1">
              {i.organization ? (
                <><Building className="w-3 h-3" /> {i.organization.name}</>
              ) : i.superHub ? (
                <><Layers3 className="w-3 h-3" /> {i.superHub.name}</>
              ) : i.tenant ? (
                <><Building2 className="w-3 h-3" /> {i.tenant.name}</>
              ) : (
                <><Globe2 className="w-3 h-3" /> Global</>
              )}
              <span className={i.isActive ? "text-green-500" : "text-red-500"}>
                {i.isActive ? "✓" : "✗"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
