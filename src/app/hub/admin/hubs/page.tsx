"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Network,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Building2,
  Layers3,
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
  AdminSelect,
  AdminEmpty,
  AdminViewToggle,
  AdminSearch,
  AdminIconButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   🌐 Rowi Admin — Hubs Management
   ---------------------------------------------------------
   Clean, organized, and 100% translatable
========================================================= */

interface Hub {
  id: string;
  name: string;
  slug: string;
  description?: string;
  visibility: string;
  tenantId?: string;
  superHubId?: string;
  tenant?: { id: string; name: string; plan?: { name: string } };
  superHub?: { id: string; name: string; slug: string };
}

interface Tenant {
  id: string;
  name: string;
  plan?: { name: string };
}

interface SuperHub {
  id: string;
  name: string;
  slug: string;
}

export default function AdminHubsPage() {
  const { t, ready } = useI18n();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [superHubs, setSuperHubs] = useState<SuperHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const [form, setForm] = useState({
    id: "",
    tenantId: "",
    superHubId: "",
    name: "",
    slug: "",
    description: "",
    visibility: "private",
  });

  /* =========================================================
     📦 Load data
  ========================================================== */
  async function loadAll() {
    setLoading(true);
    try {
      const [hubsRes, tenantsRes, superHubsRes] = await Promise.allSettled([
        fetch("/api/hub/hubs", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/hub/tenants", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/hub/superhubs", { cache: "no-store" }).then((r) => r.json()),
      ]);

      const hubsData = hubsRes.status === "fulfilled" ? hubsRes.value?.hubs || [] : [];
      const tenantsData = tenantsRes.status === "fulfilled"
        ? Array.isArray(tenantsRes.value) ? tenantsRes.value : tenantsRes.value?.tenants || []
        : [];
      const superHubsData = superHubsRes.status === "fulfilled"
        ? superHubsRes.value?.superHubs || superHubsRes.value || []
        : [];

      setHubs(hubsData);
      setTenants(tenantsData);
      setSuperHubs(Array.isArray(superHubsData) ? superHubsData : []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadAll();
  }, [ready]);

  /* =========================================================
     ✳️ Form handling
  ========================================================== */
  function resetForm() {
    setForm({
      id: "",
      tenantId: "",
      superHubId: "",
      name: "",
      slug: "",
      description: "",
      visibility: "private",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(hub: Hub) {
    setEditingId(hub.id);
    setForm({
      id: hub.id,
      tenantId: hub.tenantId || "",
      superHubId: hub.superHubId || "",
      name: hub.name,
      slug: hub.slug,
      description: hub.description || "",
      visibility: hub.visibility,
    });
    setShowForm(true);
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  /* =========================================================
     💾 Save hub (create or update)
  ========================================================== */
  async function saveHub() {
    if (!form.name || !form.slug || !form.tenantId) {
      toast.error(t("admin.hubs.requiredFields"));
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        // Update
        const res = await fetch(`/api/hub/hubs/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            slug: form.slug,
            description: form.description,
            tenantId: form.tenantId,
            superHubId: form.superHubId || null,
            visibility: form.visibility,
          }),
        });
        const j = await res.json();
        if (!j.ok) throw new Error(j.error);
        toast.success(t("admin.hubs.updated"));
      } else {
        // Create
        const res = await fetch("/api/hub/hubs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const j = await res.json();
        if (!j.ok) throw new Error(j.error);
        toast.success(t("admin.hubs.created"));
      }
      resetForm();
      loadAll();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     🗑️ Delete hub
  ========================================================== */
  async function deleteHub(id: string) {
    if (!confirm(t("admin.hubs.confirmDelete"))) return;
    try {
      const res = await fetch("/api/hub/hubs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      toast.success(t("admin.hubs.deleted"));
      setHubs((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    }
  }

  /* =========================================================
     🔍 Filter hubs
  ========================================================== */
  const filteredHubs = hubs.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.slug.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================================================
     🎨 Render
  ========================================================== */
  return (
    <AdminPage
      titleKey="admin.hubs.title"
      descriptionKey="admin.hubs.description"
      icon={Network}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadAll} size="sm">
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
            {t("admin.hubs.new")}
          </AdminButton>
        </div>
      }
    >
      {/* Form Card */}
      {showForm && (
        <AdminCard className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              {editingId ? (
                <Pencil className="w-4 h-4 text-white" />
              ) : (
                <PlusCircle className="w-4 h-4 text-white" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
              {editingId ? t("admin.hubs.edit") : t("admin.hubs.new")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminSelect
              placeholderKey="admin.hubs.selectTenant"
              value={form.tenantId}
              onChange={(v) => setForm({ ...form, tenantId: v })}
              options={[
                { value: "", label: t("admin.hubs.selectTenant") },
                ...tenants.map((t) => ({
                  value: t.id,
                  label: `${t.name} ${t.plan ? `— ${t.plan.name}` : ""}`,
                })),
              ]}
            />
            <AdminSelect
              placeholderKey="admin.hubs.selectSuperHub"
              value={form.superHubId}
              onChange={(v) => setForm({ ...form, superHubId: v })}
              options={[
                { value: "", label: t("admin.hubs.noSuperHub") },
                ...superHubs.map((sh) => ({
                  value: sh.id,
                  label: `${sh.name} (${sh.slug})`,
                })),
              ]}
            />
            <AdminInput
              placeholderKey="admin.hubs.name"
              value={form.name}
              onChange={(v) =>
                setForm({
                  ...form,
                  name: v,
                  slug: form.slug || generateSlug(v),
                })
              }
            />
            <AdminInput
              placeholderKey="admin.hubs.slug"
              value={form.slug}
              onChange={(v) => setForm({ ...form, slug: v })}
            />
            <AdminSelect
              placeholderKey="admin.hubs.visibility"
              value={form.visibility}
              onChange={(v) => setForm({ ...form, visibility: v })}
              options={[
                { value: "private", label: t("admin.hubs.private") },
                { value: "public", label: t("admin.hubs.public") },
              ]}
            />
            <div className="md:col-span-2">
              <AdminTextarea
                placeholderKey="admin.hubs.descriptionField"
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <AdminButton variant="secondary" onClick={resetForm}>
              {t("admin.common.cancel")}
            </AdminButton>
            <AdminButton onClick={saveHub} loading={saving}>
              {editingId ? t("admin.common.save") : t("admin.common.create")}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {/* Hubs List/Grid */}
      {filteredHubs.length === 0 ? (
        <AdminEmpty
          icon={Network}
          titleKey="admin.hubs.noHubs"
          descriptionKey="admin.hubs.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filteredHubs.map((hub) => (
            <AdminListItem
              key={hub.id}
              icon={Network}
              title={hub.name}
              subtitle={<span className="font-mono text-[10px]">{hub.slug}</span>}
              badge={
                <AdminBadge variant={hub.visibility === "public" ? "success" : "neutral"}>
                  {hub.visibility === "public" ? (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {t("admin.hubs.public")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      {t("admin.hubs.private")}
                    </span>
                  )}
                </AdminBadge>
              }
              meta={
                <div className="flex items-center gap-3 text-xs text-[var(--rowi-muted)]">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {hub.tenant?.name || "—"}
                  </span>
                  {hub.superHub && (
                    <span className="flex items-center gap-1 text-[var(--rowi-success)]">
                      <Layers3 className="w-3 h-3" />
                      {hub.superHub.name}
                    </span>
                  )}
                </div>
              }
              actions={
                <>
                  <AdminIconButton icon={Pencil} onClick={() => startEdit(hub)} title={t("admin.common.edit")} />
                  <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteHub(hub.id)} title={t("admin.common.delete")} />
                </>
              }
            />
          ))}
        </AdminList>
      ) : (
        <AdminGrid cols={4}>
          {filteredHubs.map((hub) => (
            <HubCard
              key={hub.id}
              hub={hub}
              onEdit={startEdit}
              onDelete={deleteHub}
            />
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}

/* =========================================================
   🃏 HubCard — Individual hub card
========================================================= */

interface HubCardProps {
  hub: Hub;
  onEdit: (hub: Hub) => void;
  onDelete: (id: string) => void;
}

function HubCard({ hub, onEdit, onDelete }: HubCardProps) {
  const { t } = useI18n();

  return (
    <AdminCard compact className="group flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
          <Network className="w-4 h-4 text-white" />
        </div>
        <AdminBadge variant={hub.visibility === "public" ? "success" : "neutral"}>
          {hub.visibility === "public" ? t("admin.hubs.public") : t("admin.hubs.private")}
        </AdminBadge>
      </div>

      <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">{hub.name}</h3>
      <p className="text-[10px] text-[var(--rowi-muted)] font-mono truncate">{hub.slug}</p>

      {hub.description && (
        <p className="text-xs text-[var(--rowi-muted)] mt-1 line-clamp-2">{hub.description}</p>
      )}

      {/* Info */}
      <div className="mt-2 space-y-1 text-[10px] text-[var(--rowi-muted)]">
        <div className="flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {hub.tenant?.name || t("admin.hubs.noTenant")}
        </div>
        {hub.superHub && (
          <div className="flex items-center gap-1 text-[var(--rowi-success)]">
            <Layers3 className="w-3 h-3" />
            {hub.superHub.name}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-[var(--rowi-border)] opacity-0 group-hover:opacity-100 transition-opacity">
        <AdminIconButton icon={Pencil} onClick={() => onEdit(hub)} />
        <AdminIconButton icon={Trash2} variant="danger" onClick={() => onDelete(hub.id)} />
      </div>
    </AdminCard>
  );
}
