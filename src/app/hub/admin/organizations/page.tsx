"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Network,
  Building2,
  Layers3,
  Check,
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
  AdminInput,
  AdminSelect,
  AdminIconButton,
  AdminTextarea,
} from "@/components/admin/AdminPage";

/* =========================================================
   🏢 Rowi Admin — Organizations Management
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

interface OrgData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  superHubId?: string;
  superHub?: { id: string; name: string };
  tenantLinks?: { tenant: { id: string; name: string } }[];
  hubLinks?: { hub: { id: string; name: string } }[];
}

export default function OrganizationsPage() {
  const { t, ready } = useI18n();
  const [orgs, setOrgs] = useState<OrgData[]>([]);
  const [superhubs, setSuperhubs] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    id?: string;
    name: string;
    slug: string;
    description: string;
    superHubId: string;
    tenantIds: string[];
    hubIds: string[];
  } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [orgRes, shRes, tRes, hRes] = await Promise.all([
        fetch("/api/hub/organizations"),
        fetch("/api/hub/superhubs"),
        fetch("/api/hub/tenants"),
        fetch("/api/hub/hubs"),
      ]);

      const [orgData, shData, tData, hData] = await Promise.all([
        orgRes.json(),
        shRes.json(),
        tRes.json(),
        hRes.json(),
      ]);

      setOrgs(Array.isArray(orgData) ? orgData : orgData.organizations || []);
      setSuperhubs(Array.isArray(shData) ? shData : shData.superhubs || shData.superHubs || []);
      setTenants(Array.isArray(tData?.tenants) ? tData.tenants : Array.isArray(tData) ? tData : []);
      setHubs(Array.isArray(hData?.hubs) ? hData.hubs : Array.isArray(hData) ? hData : []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadData();
  }, [ready]);

  function openCreate() {
    setEditor({
      mode: "create",
      name: "",
      slug: "",
      description: "",
      superHubId: superhubs[0]?.id || "",
      tenantIds: [],
      hubIds: [],
    });
  }

  function openEdit(org: OrgData) {
    setEditor({
      mode: "edit",
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description || "",
      superHubId: org.superHubId || "",
      tenantIds: org.tenantLinks?.map((l) => l.tenant.id) || [],
      hubIds: org.hubLinks?.map((l) => l.hub.id) || [],
    });
  }

  async function save() {
    if (!editor) return;
    if (!editor.name || !editor.slug) {
      toast.error(t("admin.organizations.requiredFields"));
      return;
    }

    setSaving(true);
    try {
      const method = editor.mode === "create" ? "POST" : "PUT";
      const res = await fetch("/api/hub/organizations", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editor.id,
          name: editor.name,
          slug: editor.slug,
          description: editor.description,
          superHubId: editor.superHubId,
          tenantIds: editor.tenantIds,
          hubIds: editor.hubIds,
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error);

      toast.success(editor.mode === "create" ? t("admin.organizations.created") : t("admin.organizations.updated"));
      setEditor(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteOrg(id: string) {
    if (!confirm(t("admin.organizations.confirmDelete"))) return;
    try {
      const res = await fetch("/api/hub/organizations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(t("admin.organizations.deleted"));
      loadData();
    } catch (err: any) {
      toast.error(err.message || t("common.error"));
    }
  }

  function toggleSelection(field: "tenantIds" | "hubIds", id: string) {
    if (!editor) return;
    const current = editor[field];
    const updated = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setEditor({ ...editor, [field]: updated });
  }

  const filtered = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPage
      titleKey="admin.organizations.title"
      descriptionKey="admin.organizations.description"
      icon={Building}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadData} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton icon={PlusCircle} onClick={openCreate} size="sm">
            {t("admin.organizations.new")}
          </AdminButton>
        </div>
      }
    >
      {/* Editor Form */}
      {editor && (
        <AdminCard className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              {editor.mode === "create" ? (
                <PlusCircle className="w-4 h-4 text-white" />
              ) : (
                <Pencil className="w-4 h-4 text-white" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
              {editor.mode === "create" ? t("admin.organizations.new") : t("admin.organizations.edit")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              placeholderKey="admin.organizations.name"
              value={editor.name}
              onChange={(v) => setEditor({ ...editor, name: v, slug: editor.slug || v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
            />
            <AdminInput
              placeholderKey="admin.organizations.slug"
              value={editor.slug}
              onChange={(v) => setEditor({ ...editor, slug: v })}
            />
            <AdminSelect
              value={editor.superHubId}
              onChange={(v) => setEditor({ ...editor, superHubId: v })}
              options={[
                { value: "", label: t("admin.organizations.noSuperHub") },
                ...superhubs.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <div className="md:col-span-2">
              <AdminTextarea
                placeholderKey="admin.organizations.description"
                value={editor.description}
                onChange={(v) => setEditor({ ...editor, description: v })}
              />
            </div>
          </div>

          {/* Multi-select sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Tenants */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[var(--rowi-foreground)]">{t("admin.organizations.linkedTenants")}</h4>
              {tenants.length === 0 ? (
                <p className="text-xs text-[var(--rowi-muted)]">{t("admin.organizations.noTenantsAvailable")}</p>
              ) : (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {tenants.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleSelection("tenantIds", t.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded border transition-colors ${
                        editor.tenantIds.includes(t.id)
                          ? "bg-[var(--rowi-primary)]/10 border-[var(--rowi-primary)] text-[var(--rowi-primary)]"
                          : "bg-[var(--rowi-background)] border-[var(--rowi-border)] text-[var(--rowi-foreground)] hover:bg-[var(--rowi-border)]"
                      }`}
                    >
                      {editor.tenantIds.includes(t.id) && <Check className="w-3 h-3" />}
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hubs */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[var(--rowi-foreground)]">{t("admin.organizations.linkedHubs")}</h4>
              {hubs.length === 0 ? (
                <p className="text-xs text-[var(--rowi-muted)]">{t("admin.organizations.noHubsAvailable")}</p>
              ) : (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {hubs.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => toggleSelection("hubIds", h.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded border transition-colors ${
                        editor.hubIds.includes(h.id)
                          ? "bg-[var(--rowi-primary)]/10 border-[var(--rowi-primary)] text-[var(--rowi-primary)]"
                          : "bg-[var(--rowi-background)] border-[var(--rowi-border)] text-[var(--rowi-foreground)] hover:bg-[var(--rowi-border)]"
                      }`}
                    >
                      {editor.hubIds.includes(h.id) && <Check className="w-3 h-3" />}
                      <span className="truncate">{h.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <AdminButton variant="secondary" onClick={() => setEditor(null)}>
              {t("admin.common.cancel")}
            </AdminButton>
            <AdminButton onClick={save} loading={saving}>
              {editor.mode === "create" ? t("admin.common.create") : t("admin.common.save")}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {/* Organizations List/Grid */}
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={Building}
          titleKey="admin.organizations.noOrganizations"
          descriptionKey="admin.organizations.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filtered.map((org) => (
            <AdminListItem
              key={org.id}
              icon={Building}
              title={org.name}
              subtitle={<span className="font-mono text-[10px]">{org.slug}</span>}
              badge={
                org.superHub ? (
                  <AdminBadge variant="info">
                    <Layers3 className="w-3 h-3 mr-0.5" />
                    {org.superHub.name}
                  </AdminBadge>
                ) : null
              }
              meta={
                <div className="flex items-center gap-3 text-xs text-[var(--rowi-muted)]">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {org.tenantLinks?.length || 0} tenants
                  </span>
                  <span className="flex items-center gap-1">
                    <Network className="w-3 h-3" />
                    {org.hubLinks?.length || 0} hubs
                  </span>
                </div>
              }
              actions={
                <>
                  <AdminIconButton icon={Pencil} onClick={() => openEdit(org)} title={t("admin.common.edit")} />
                  <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteOrg(org.id)} title={t("admin.common.delete")} />
                </>
              }
            />
          ))}
        </AdminList>
      ) : (
        <AdminGrid cols={4}>
          {filtered.map((org) => (
            <AdminCard key={org.id} compact className="group">
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                  <Building className="w-4 h-4 text-white" />
                </div>
                {org.superHub && (
                  <AdminBadge variant="info">{org.superHub.name}</AdminBadge>
                )}
              </div>

              <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">{org.name}</h3>
              <p className="text-[10px] text-[var(--rowi-muted)] font-mono truncate">{org.slug}</p>
              {org.description && (
                <p className="text-xs text-[var(--rowi-muted)] mt-1 line-clamp-2">{org.description}</p>
              )}

              <div className="flex gap-2 mt-3 pt-2 border-t border-[var(--rowi-border)]">
                <div className="flex items-center gap-1 text-[10px] text-[var(--rowi-muted)]">
                  <Building2 className="w-3 h-3" />
                  {org.tenantLinks?.length || 0}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[var(--rowi-muted)]">
                  <Network className="w-3 h-3" />
                  {org.hubLinks?.length || 0}
                </div>
              </div>

              <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <AdminIconButton icon={Pencil} onClick={() => openEdit(org)} />
                <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteOrg(org.id)} />
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
