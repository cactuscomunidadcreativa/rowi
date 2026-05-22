"use client";

/**
 * Admin Workspaces — gestión administrativa de los workspaces
 * (RowiCommunity con workspaceType definido). Filtros por tipo y status,
 * edición inline de nombre/descripción/status, links a miembros y a la
 * vista usuario.
 */
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Briefcase,
  RefreshCcw,
  Pencil,
  Users,
  ExternalLink,
  PlusCircle,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminList,
  AdminListItem,
  AdminButton,
  AdminBadge,
  AdminEmpty,
  AdminSearch,
  AdminInput,
  AdminSelect,
  AdminIconButton,
  AdminTextarea,
} from "@/components/admin/AdminPage";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  workspaceType: string | null;
  projectStatus: string | null;
  targetRole: string | null;
  projectStartDate: string | null;
  projectEndDate: string | null;
  clientOrgId: string | null;
  createdAt: string;
  tenant: { id: string; name: string; slug: string } | null;
  clientOrg: { id: string; name: string } | null;
  _count: {
    members: number;
    communityMembers: number;
    serviceEngagements: number;
  };
}

const WORKSPACE_TYPES = [
  { value: "", labelES: "Todos", labelEN: "All", color: "gray" },
  { value: "COACHING", labelES: "Coaching", labelEN: "Coaching", color: "purple" },
  { value: "SELECTION", labelES: "Selección", labelEN: "Selection", color: "blue" },
  { value: "TEAM_UNIT", labelES: "Equipo / Unidad", labelEN: "Team / Unit", color: "emerald" },
  { value: "HR_COHORT", labelES: "Cohorte HR", labelEN: "HR Cohort", color: "amber" },
  { value: "MENTORING", labelES: "Mentoring", labelEN: "Mentoring", color: "rose" },
  { value: "CONSULTING", labelES: "Consultoría", labelEN: "Consulting", color: "cyan" },
] as const;

const STATUS_OPTIONS = [
  { value: "", labelES: "Todos los estados", labelEN: "All statuses" },
  { value: "active", labelES: "Activo", labelEN: "Active" },
  { value: "paused", labelES: "Pausado", labelEN: "Paused" },
  { value: "completed", labelES: "Completado", labelEN: "Completed" },
  { value: "archived", labelES: "Archivado", labelEN: "Archived" },
] as const;

function typeColor(type: string | null): "neutral" | "info" | "success" | "warning" | "danger" {
  const v = type ?? "";
  if (v === "COACHING" || v === "MENTORING") return "info";
  if (v === "TEAM_UNIT") return "success";
  if (v === "HR_COHORT") return "warning";
  if (v === "SELECTION" || v === "CONSULTING") return "neutral";
  return "neutral";
}

function statusColor(status: string | null): "neutral" | "success" | "warning" | "danger" {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  if (status === "completed") return "neutral";
  if (status === "archived") return "danger";
  return "neutral";
}

function AdminWorkspacesInner() {
  const { t, ready, lang } = useI18n();
  const isEN = lang === "en";
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") ?? "";

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState(initialType);
  const [filterStatus, setFilterStatus] = useState("");
  const [editor, setEditor] = useState<{
    id: string;
    name: string;
    slug: string;
    description: string;
    projectStatus: string;
    targetRole: string;
  } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterType) qs.set("workspaceType", filterType);
      if (filterStatus) qs.set("projectStatus", filterStatus);
      if (search) qs.set("search", search);
      const res = await fetch(`/api/admin/workspaces?${qs.toString()}`);
      const data = await res.json();
      if (!data?.ok) {
        toast.error(data?.error ?? (isEN ? "Could not load" : "No pudimos cargar"));
        setWorkspaces([]);
        return;
      }
      setWorkspaces(data.items as Workspace[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, filterType, filterStatus]);

  // Re-filter local on search change to avoid roundtrip on every keystroke
  const filtered = useMemo(() => {
    if (!search) return workspaces;
    const q = search.toLowerCase();
    return workspaces.filter(
      (w) => w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q),
    );
  }, [workspaces, search]);

  function openEdit(w: Workspace) {
    setEditor({
      id: w.id,
      name: w.name,
      slug: w.slug,
      description: w.description ?? "",
      projectStatus: w.projectStatus ?? "",
      targetRole: w.targetRole ?? "",
    });
  }

  async function save() {
    if (!editor) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${editor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editor.name,
          slug: editor.slug,
          description: editor.description || null,
          projectStatus: editor.projectStatus || null,
          targetRole: editor.targetRole || null,
        }),
      });
      const data = await res.json();
      if (!data?.ok) {
        toast.error(data?.error ?? (isEN ? "Could not save" : "No pudimos guardar"));
        return;
      }
      toast.success(isEN ? "Saved" : "Guardado");
      setEditor(null);
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  async function quickStatus(w: Workspace, status: string) {
    try {
      const res = await fetch(`/api/admin/workspaces/${w.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectStatus: status }),
      });
      const data = await res.json();
      if (!data?.ok) {
        toast.error(data?.error ?? (isEN ? "Could not update" : "No pudimos actualizar"));
        return;
      }
      toast.success(isEN ? "Status updated" : "Estado actualizado");
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error");
    }
  }

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    let active = 0;
    let archived = 0;
    for (const w of workspaces) {
      if (w.workspaceType) byType[w.workspaceType] = (byType[w.workspaceType] ?? 0) + 1;
      if (w.projectStatus === "active") active++;
      if (w.projectStatus === "archived") archived++;
    }
    return { total: workspaces.length, active, archived, byType };
  }, [workspaces]);

  return (
    <AdminPage
      titleKey="admin.workspaces.title"
      descriptionKey="admin.workspaces.description"
      icon={Briefcase}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-48" />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadData} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <Link href="/workspace/new">
            <AdminButton icon={PlusCircle} size="sm">
              {isEN ? "New workspace" : "Nuevo workspace"}
            </AdminButton>
          </Link>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <AdminCard compact className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[var(--rowi-primary)]">{stats.total}</p>
          <p className="text-[10px] md:text-xs text-[var(--rowi-muted)]">
            {isEN ? "Workspaces" : "Workspaces"}
          </p>
        </AdminCard>
        <AdminCard compact className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-emerald-500">{stats.active}</p>
          <p className="text-[10px] md:text-xs text-[var(--rowi-muted)]">
            {isEN ? "Active" : "Activos"}
          </p>
        </AdminCard>
        <AdminCard compact className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-rose-500">{stats.archived}</p>
          <p className="text-[10px] md:text-xs text-[var(--rowi-muted)]">
            {isEN ? "Archived" : "Archivados"}
          </p>
        </AdminCard>
        <AdminCard compact className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[var(--rowi-secondary)]">
            {workspaces.reduce((acc, w) => acc + w._count.members + w._count.communityMembers, 0)}
          </p>
          <p className="text-[10px] md:text-xs text-[var(--rowi-muted)]">
            {isEN ? "Total members" : "Miembros totales"}
          </p>
        </AdminCard>
      </div>

      {/* Filtros */}
      <AdminCard compact className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 flex flex-wrap gap-2">
            {WORKSPACE_TYPES.map((opt) => {
              const isActive = filterType === opt.value;
              const count =
                opt.value === "" ? workspaces.length : stats.byType[opt.value] ?? 0;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilterType(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[var(--rowi-primary)] text-white"
                      : "bg-[var(--rowi-background)] text-[var(--rowi-muted)] hover:bg-[var(--rowi-border)]"
                  }`}
                >
                  {isEN ? opt.labelEN : opt.labelES}
                  {opt.value && <span className="opacity-60 ml-1">({count})</span>}
                </button>
              );
            })}
          </div>
          <div className="md:w-48">
            <AdminSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={STATUS_OPTIONS.map((s) => ({
                value: s.value,
                label: isEN ? s.labelEN : s.labelES,
              }))}
            />
          </div>
        </div>
      </AdminCard>

      {/* Editor inline */}
      {editor && (
        <AdminCard className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                <Pencil className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {isEN ? "Edit workspace" : "Editar workspace"}
              </h3>
            </div>
            <button
              onClick={() => setEditor(null)}
              className="p-1 hover:bg-[var(--rowi-muted)]/10 rounded"
            >
              <X className="w-5 h-5 text-[var(--rowi-muted)]" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AdminInput
              placeholderKey="admin.workspaces.name"
              value={editor.name}
              onChange={(v) => setEditor({ ...editor, name: v })}
            />
            <AdminInput
              placeholderKey="admin.workspaces.slug"
              value={editor.slug}
              onChange={(v) => setEditor({ ...editor, slug: v })}
            />
            <AdminInput
              placeholderKey="admin.workspaces.targetRole"
              value={editor.targetRole}
              onChange={(v) => setEditor({ ...editor, targetRole: v })}
            />
            <AdminSelect
              value={editor.projectStatus}
              onChange={(v) => setEditor({ ...editor, projectStatus: v })}
              options={STATUS_OPTIONS.filter((s) => s.value).map((s) => ({
                value: s.value,
                label: isEN ? s.labelEN : s.labelES,
              }))}
            />
            <div className="md:col-span-2">
              <AdminTextarea
                placeholderKey="admin.workspaces.description"
                value={editor.description}
                onChange={(v) => setEditor({ ...editor, description: v })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <AdminButton variant="secondary" onClick={() => setEditor(null)}>
              {t("admin.common.cancel")}
            </AdminButton>
            <AdminButton onClick={save} loading={saving}>
              {t("admin.common.save")}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={Briefcase}
          titleKey="admin.workspaces.noWorkspaces"
          descriptionKey="admin.workspaces.noWorkspacesDesc"
        />
      ) : (
        <AdminList>
          {filtered.map((w) => {
            const typeLabel =
              WORKSPACE_TYPES.find((tt) => tt.value === w.workspaceType) ?? null;
            const totalMembers = w._count.members + w._count.communityMembers;
            return (
              <AdminListItem
                key={w.id}
                icon={Briefcase}
                title={w.name}
                subtitle={
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px]">{w.slug}</span>
                    {w.tenant && (
                      <span className="text-[10px] text-[var(--rowi-muted)]">
                        · {w.tenant.name}
                      </span>
                    )}
                    {w.targetRole && (
                      <span className="text-[10px] text-[var(--rowi-muted)]">
                        · {w.targetRole}
                      </span>
                    )}
                  </div>
                }
                badge={
                  <div className="flex items-center gap-1.5">
                    {typeLabel && (
                      <AdminBadge variant={typeColor(w.workspaceType)}>
                        {isEN ? typeLabel.labelEN : typeLabel.labelES}
                      </AdminBadge>
                    )}
                    {w.projectStatus && (
                      <AdminBadge variant={statusColor(w.projectStatus)}>
                        {w.projectStatus}
                      </AdminBadge>
                    )}
                  </div>
                }
                meta={
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--rowi-muted)]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {totalMembers}
                    </span>
                    {w._count.serviceEngagements > 0 && (
                      <span className="text-[10px]">
                        {w._count.serviceEngagements}{" "}
                        {isEN ? "providers" : "proveedores"}
                      </span>
                    )}
                    {w.clientOrg && (
                      <span className="text-[10px]">
                        · {w.clientOrg.name}
                      </span>
                    )}
                  </div>
                }
                actions={
                  <>
                    <Link href={`/hub/admin/communities/${w.id}/members`}>
                      <AdminIconButton
                        icon={Users}
                        title={isEN ? "View members" : "Ver miembros"}
                      />
                    </Link>
                    <AdminIconButton
                      icon={Pencil}
                      onClick={() => openEdit(w)}
                      title={t("admin.common.edit")}
                    />
                    {w.projectStatus !== "archived" ? (
                      <AdminIconButton
                        icon={X}
                        variant="danger"
                        onClick={() => quickStatus(w, "archived")}
                        title={isEN ? "Archive" : "Archivar"}
                      />
                    ) : (
                      <AdminIconButton
                        icon={RefreshCcw}
                        onClick={() => quickStatus(w, "active")}
                        title={isEN ? "Reactivate" : "Reactivar"}
                      />
                    )}
                    <Link
                      href={`/workspace?type=${w.workspaceType ?? ""}`}
                      target="_blank"
                    >
                      <AdminIconButton
                        icon={ExternalLink}
                        title={isEN ? "Open user view" : "Abrir vista usuario"}
                      />
                    </Link>
                  </>
                }
              />
            );
          })}
        </AdminList>
      )}
    </AdminPage>
  );
}

export default function AdminWorkspacesPage() {
  return (
    <Suspense fallback={null}>
      <AdminWorkspacesInner />
    </Suspense>
  );
}
