"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Puzzle,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Globe2,
  Building2,
  Layers3,
  Building,
  ChevronDown,
  ChevronUp,
  Code2,
  Sparkles,
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
  AdminSelect,
  AdminEmpty,
  AdminIconButton,
  AdminViewToggle,
  AdminSearch,
} from "@/components/admin/AdminPage";

/* =========================================================
   🧩 Rowi Admin — Components
========================================================= */

interface ComponentData {
  id: string;
  name: string;
  type?: string;
  category?: string;
  description?: string;
  version?: string;
  aiEnabled?: boolean;
  config?: any;
  tenant?: { id: string; name: string };
  superHub?: { id: string; name: string };
  organization?: { id: string; name: string };
}

export default function ComponentsAdminPage() {
  const { t, ready } = useI18n();
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  async function loadComponents() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/components", { cache: "no-store" });
      const data = await res.json();
      setComponents(data.components || []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadComponents();
  }, [ready]);

  async function deleteComponent(id: string) {
    if (!confirm(t("admin.components.confirmDelete"))) return;
    try {
      await fetch("/api/admin/components", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      toast.success(t("admin.components.deleted"));
      loadComponents();
    } catch {
      toast.error(t("common.error"));
    }
  }

  const filtered = components.filter((c) => {
    if (filterLevel !== "all") {
      if (filterLevel === "global" && (c.tenant || c.superHub || c.organization)) return false;
      if (filterLevel === "tenant" && !c.tenant) return false;
      if (filterLevel === "superhub" && !c.superHub) return false;
      if (filterLevel === "organization" && !c.organization) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return c.name?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q);
    }
    return true;
  });

  function getLevelBadge(comp: ComponentData) {
    if (comp.organization) return { label: "Org", variant: "warning" as const };
    if (comp.superHub) return { label: "SuperHub", variant: "info" as const };
    if (comp.tenant) return { label: "Tenant", variant: "primary" as const };
    return { label: "Global", variant: "success" as const };
  }

  return (
    <AdminPage
      titleKey="admin.components.title"
      descriptionKey="admin.components.description"
      icon={Puzzle}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminSelect
            value={filterLevel}
            onChange={setFilterLevel}
            options={[
              { value: "all", label: t("admin.components.allLevels") },
              { value: "global", label: "Global" },
              { value: "superhub", label: "SuperHub" },
              { value: "tenant", label: "Tenant" },
              { value: "organization", label: t("admin.pages.organization") },
            ]}
          />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadComponents} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton icon={PlusCircle} size="sm">
            {t("admin.components.new")}
          </AdminButton>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={Puzzle}
          titleKey="admin.components.noComponents"
          descriptionKey="admin.components.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filtered.map((comp) => {
            const level = getLevelBadge(comp);
            return (
              <AdminListItem
                key={comp.id}
                icon={Puzzle}
                title={comp.name}
                subtitle={`${comp.type || "Component"} • ${comp.category || t("admin.components.category")}`}
                badge={
                  <div className="flex gap-1">
                    <AdminBadge variant={level.variant}>{level.label}</AdminBadge>
                    {comp.aiEnabled && (
                      <AdminBadge variant="primary">
                        <Sparkles className="w-3 h-3 mr-0.5" />AI
                      </AdminBadge>
                    )}
                  </div>
                }
                meta={<span className="font-mono text-[10px]">v{comp.version || "1.0"}</span>}
                actions={
                  <>
                    <AdminIconButton icon={Pencil} title={t("admin.common.edit")} />
                    <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteComponent(comp.id)} title={t("admin.common.delete")} />
                  </>
                }
              />
            );
          })}
        </AdminList>
      ) : (
        <AdminGrid cols={4}>
          {filtered.map((comp) => {
            const level = getLevelBadge(comp);
            return (
              <AdminCard key={comp.id} compact className="group">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--rowi-primary)]/10 flex items-center justify-center">
                    <Puzzle className="w-4 h-4 text-[var(--rowi-primary)]" />
                  </div>
                  <div className="flex gap-1">
                    <AdminBadge variant={level.variant}>{level.label}</AdminBadge>
                    {comp.aiEnabled && <AdminBadge variant="primary">AI</AdminBadge>}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">{comp.name}</h3>
                <p className="text-xs text-[var(--rowi-muted)] truncate">{comp.type || "Component"}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--rowi-border)]">
                  <span className="text-[10px] font-mono text-[var(--rowi-muted)]">v{comp.version || "1.0"}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AdminIconButton icon={Pencil} />
                    <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteComponent(comp.id)} />
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
