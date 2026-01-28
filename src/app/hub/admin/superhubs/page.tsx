"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Layers3,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Network,
  Building2,
  Building,
  ShieldCheck,
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
  AdminInput,
  AdminTextarea,
  AdminEmpty,
  AdminViewToggle,
  AdminSearch,
  AdminIconButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   🏛️ Rowi Admin — SuperHubs Management
   ---------------------------------------------------------
   Federation nodes of the Rowi ecosystem
   Clean, organized, and 100% translatable
========================================================= */

interface SuperHub {
  id: string;
  name: string;
  slug: string;
  description?: string;
  vision?: string;
  mission?: string;
  hubs?: any[];
  tenants?: any[];
  organizations?: any[];
  rolesDynamic?: any[];
}

export default function SuperHubsPage() {
  const { t, ready } = useI18n();
  const [superhubs, setSuperhubs] = useState<SuperHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    vision: "",
    mission: "",
  });

  /* =========================================================
     📦 Load SuperHubs
  ========================================================== */
  async function loadSuperHubs() {
    setLoading(true);
    try {
      const res = await fetch("/api/hub/superhubs", { cache: "no-store" });
      const raw = await res.json();

      let list: SuperHub[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (Array.isArray(raw.superhubs)) {
        list = raw.superhubs;
      } else if (Array.isArray(raw.superHubs)) {
        list = raw.superHubs;
      } else if (raw.superHub) {
        list = [raw.superHub];
      }

      setSuperhubs(list);
    } catch {
      toast.error(t("common.error"));
      setSuperhubs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadSuperHubs();
  }, [ready]);

  /* =========================================================
     ✳️ Form handling
  ========================================================== */
  function resetForm() {
    setForm({
      id: "",
      name: "",
      description: "",
      vision: "",
      mission: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(sh: SuperHub) {
    setEditing(sh.id);
    setForm({
      id: sh.id,
      name: sh.name,
      description: sh.description || "",
      vision: sh.vision || "",
      mission: sh.mission || "",
    });
    setShowForm(true);
  }

  /* =========================================================
     💾 Save SuperHub (create or update)
  ========================================================== */
  async function saveSuperHub() {
    if (!form.name.trim()) {
      toast.error(t("admin.superhubs.nameRequired"));
      return;
    }

    setSaving(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const body = form.id ? { id: form.id, ...form } : form;

      const res = await fetch("/api/hub/superhubs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(form.id ? t("admin.superhubs.updated") : t("admin.superhubs.created"));
      resetForm();
      loadSuperHubs();
    } catch (err: any) {
      toast.error(err.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     🗑️ Delete SuperHub
  ========================================================== */
  async function deleteSuperHub(id: string) {
    if (!confirm(t("admin.superhubs.confirmDelete"))) return;
    try {
      const res = await fetch("/api/hub/superhubs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(t("admin.superhubs.deleted"));
      loadSuperHubs();
    } catch (err: any) {
      toast.error(err.message || t("common.error"));
    }
  }

  /* =========================================================
     🔍 Filter SuperHubs
  ========================================================== */
  const filteredSuperHubs = superhubs.filter(
    (sh) =>
      sh.name.toLowerCase().includes(search.toLowerCase()) ||
      sh.slug?.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================================================
     🎨 Render
  ========================================================== */
  return (
    <AdminPage
      titleKey="admin.superhubs.title"
      descriptionKey="admin.superhubs.description"
      icon={Layers3}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadSuperHubs} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton
            icon={PlusCircle}
            size="sm"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            {t("admin.superhubs.new")}
          </AdminButton>
        </div>
      }
    >
      {/* Form Card */}
      {showForm && (
        <AdminCard className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              {editing ? (
                <Pencil className="w-4 h-4 text-white" />
              ) : (
                <PlusCircle className="w-4 h-4 text-white" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
              {editing ? t("admin.superhubs.edit") : t("admin.superhubs.new")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              placeholderKey="admin.superhubs.name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
            />
            <AdminInput
              placeholderKey="admin.superhubs.vision"
              value={form.vision}
              onChange={(v) => setForm({ ...form, vision: v })}
            />
            <AdminInput
              placeholderKey="admin.superhubs.mission"
              value={form.mission}
              onChange={(v) => setForm({ ...form, mission: v })}
            />
            <div className="md:col-span-2">
              <AdminTextarea
                placeholderKey="admin.superhubs.descriptionField"
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <AdminButton variant="secondary" onClick={resetForm}>
              {t("admin.common.cancel")}
            </AdminButton>
            <AdminButton onClick={saveSuperHub} loading={saving}>
              {editing ? t("admin.common.save") : t("admin.common.create")}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {/* SuperHubs List/Grid */}
      {filteredSuperHubs.length === 0 ? (
        <AdminEmpty
          icon={Layers3}
          titleKey="admin.superhubs.noSuperHubs"
          descriptionKey="admin.superhubs.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filteredSuperHubs.map((sh) => {
            const stats = {
              hubs: sh.hubs?.length || 0,
              tenants: sh.tenants?.length || 0,
              orgs: sh.organizations?.length || 0,
            };
            return (
              <AdminListItem
                key={sh.id}
                icon={Layers3}
                title={sh.name}
                subtitle={<span className="font-mono text-[10px]">{sh.slug}</span>}
                badge={
                  <div className="flex gap-1">
                    <AdminBadge variant={stats.hubs > 0 ? "success" : "neutral"}>
                      <Network className="w-3 h-3 mr-0.5" />{stats.hubs}
                    </AdminBadge>
                    <AdminBadge variant={stats.tenants > 0 ? "success" : "neutral"}>
                      <Building2 className="w-3 h-3 mr-0.5" />{stats.tenants}
                    </AdminBadge>
                    <AdminBadge variant={stats.orgs > 0 ? "success" : "neutral"}>
                      <Building className="w-3 h-3 mr-0.5" />{stats.orgs}
                    </AdminBadge>
                  </div>
                }
                meta={sh.description && (
                  <span className="text-xs text-[var(--rowi-muted)] truncate">{sh.description}</span>
                )}
                actions={
                  <>
                    <AdminIconButton icon={Pencil} onClick={() => startEdit(sh)} title={t("admin.common.edit")} />
                    <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteSuperHub(sh.id)} title={t("admin.common.delete")} />
                  </>
                }
              />
            );
          })}
        </AdminList>
      ) : (
        <AdminGrid cols={4}>
          {filteredSuperHubs.map((sh) => (
            <SuperHubCard
              key={sh.id}
              superHub={sh}
              onEdit={startEdit}
              onDelete={deleteSuperHub}
            />
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}

/* =========================================================
   🃏 SuperHubCard — Individual SuperHub card
========================================================= */

interface SuperHubCardProps {
  superHub: SuperHub;
  onEdit: (sh: SuperHub) => void;
  onDelete: (id: string) => void;
}

function SuperHubCard({ superHub, onEdit, onDelete }: SuperHubCardProps) {
  const { t } = useI18n();

  const stats = {
    hubs: superHub.hubs?.length || 0,
    tenants: superHub.tenants?.length || 0,
    orgs: superHub.organizations?.length || 0,
    roles: superHub.rolesDynamic?.length || 0,
  };

  return (
    <AdminCard compact className="group flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
          <Layers3 className="w-4 h-4 text-white" />
        </div>
      </div>

      <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">{superHub.name}</h3>
      <p className="text-[10px] text-[var(--rowi-muted)] font-mono truncate">{superHub.slug}</p>

      {superHub.description && (
        <p className="text-xs text-[var(--rowi-muted)] mt-1 line-clamp-2">{superHub.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1 mt-3 pt-2 border-t border-[var(--rowi-border)]">
        <StatBadge icon={Network} count={stats.hubs} label="Hubs" variant={stats.hubs > 0 ? "success" : "neutral"} />
        <StatBadge icon={Building2} count={stats.tenants} label="Tenants" variant={stats.tenants > 0 ? "success" : "neutral"} />
        <StatBadge icon={Building} count={stats.orgs} label="Orgs" variant={stats.orgs > 0 ? "success" : "neutral"} />
        <StatBadge icon={ShieldCheck} count={stats.roles} label="Roles" variant={stats.roles > 0 ? "success" : "neutral"} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <AdminIconButton icon={Pencil} onClick={() => onEdit(superHub)} />
        <AdminIconButton icon={Trash2} variant="danger" onClick={() => onDelete(superHub.id)} />
      </div>
    </AdminCard>
  );
}

/* =========================================================
   📊 StatBadge — Mini stat display
========================================================= */

interface StatBadgeProps {
  icon: any;
  count: number;
  label: string;
  variant: "success" | "neutral";
}

function StatBadge({ icon: Icon, count, label, variant }: StatBadgeProps) {
  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-1 rounded text-[10px]
        ${variant === "success"
          ? "bg-[var(--rowi-success)]/10 text-[var(--rowi-success)]"
          : "bg-[var(--rowi-border)] text-[var(--rowi-muted)]"
        }
      `}
    >
      <Icon className="w-3 h-3" />
      <span className="font-semibold">{count}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
