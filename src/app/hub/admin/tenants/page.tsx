"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  ExternalLink,
  Calendar,
  Cpu,
  Mail,
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
} from "@/components/admin/AdminPage";

/* =========================================================
   🏢 Rowi Admin — Tenants Management
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

interface TenantData {
  id: string;
  name: string;
  slug: string;
  createdAt: string | Date;
  billingEmail?: string | null;
  planId?: string | null;
  plan?: { id: string; name: string } | null;
}

interface PlanData {
  id: string;
  name: string;
}

export default function TenantsPage() {
  const { t, ready } = useI18n();
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    id?: string;
    name: string;
    slug: string;
    planId?: string;
    billingEmail?: string;
  } | null>(null);

  async function loadPlans() {
    try {
      const res = await fetch("/api/admin/plans", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : data.plans ?? []);
      }
    } catch {
      setPlans([]);
    }
  }

  async function loadTenants() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tenants", { cache: "no-store" });
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t("common.error"));
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) {
      loadPlans();
      loadTenants();
    }
  }, [ready]);

  function openCreate() {
    setEditor({
      mode: "create",
      name: "",
      slug: "",
      planId: plans[0]?.id ?? "",
      billingEmail: "",
    });
  }

  function openEdit(t: TenantData) {
    setEditor({
      mode: "edit",
      id: t.id,
      name: t.name,
      slug: t.slug,
      planId: t.plan?.id || t.planId || "",
      billingEmail: t.billingEmail ?? "",
    });
  }

  async function save() {
    if (!editor) return;
    if (!editor.name || !editor.slug) {
      toast.error(t("admin.tenants.requiredFields"));
      return;
    }

    setSaving(true);
    try {
      const method = editor.mode === "create" ? "POST" : "PUT";
      const res = await fetch("/api/admin/tenants", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editor.id,
          name: editor.name,
          slug: editor.slug,
          planId: editor.planId || null,
          billingEmail: editor.billingEmail || null,
        }),
      });

      if (!res.ok) throw new Error(t("common.error"));
      toast.success(editor.mode === "create" ? t("admin.tenants.created") : t("admin.tenants.updated"));
      setEditor(null);
      loadTenants();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteTenant(id: string) {
    if (!confirm(t("admin.tenants.confirmDelete"))) return;
    try {
      await fetch("/api/admin/tenants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      toast.success(t("admin.tenants.deleted"));
      loadTenants();
    } catch {
      toast.error(t("common.error"));
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tenants.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(q) ||
        (t.slug || "").toLowerCase().includes(q)
    );
  }, [tenants, search]);

  return (
    <AdminPage
      titleKey="admin.tenants.title"
      descriptionKey="admin.tenants.description"
      icon={Building2}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadTenants} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton icon={PlusCircle} onClick={openCreate} size="sm">
            {t("admin.tenants.new")}
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
              {editor.mode === "create" ? t("admin.tenants.new") : t("admin.tenants.edit")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              placeholderKey="admin.tenants.name"
              value={editor.name}
              onChange={(v) => setEditor({ ...editor, name: v, slug: editor.slug || v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
            />
            <AdminInput
              placeholderKey="admin.tenants.slug"
              value={editor.slug}
              onChange={(v) => setEditor({ ...editor, slug: v })}
            />
            <AdminSelect
              value={editor.planId || ""}
              onChange={(v) => setEditor({ ...editor, planId: v })}
              options={[
                { value: "", label: t("admin.tenants.noPlan") },
                ...plans.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <AdminInput
              placeholderKey="admin.tenants.billingEmail"
              value={editor.billingEmail || ""}
              onChange={(v) => setEditor({ ...editor, billingEmail: v })}
            />
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

      {/* Tenants List/Grid */}
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={Building2}
          titleKey="admin.tenants.noTenants"
          descriptionKey="admin.tenants.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filtered.map((tenant) => (
            <AdminListItem
              key={tenant.id}
              icon={Building2}
              title={tenant.name}
              subtitle={
                <span className="font-mono text-[10px]">{tenant.slug}</span>
              }
              badge={
                tenant.plan ? (
                  <AdminBadge variant="primary">{tenant.plan.name}</AdminBadge>
                ) : (
                  <AdminBadge variant="neutral">{t("admin.tenants.noPlan")}</AdminBadge>
                )
              }
              meta={
                <div className="flex items-center gap-3 text-xs text-[var(--rowi-muted)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </span>
                  {tenant.billingEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {tenant.billingEmail}
                    </span>
                  )}
                </div>
              }
              actions={
                <>
                  <AdminIconButton
                    icon={ExternalLink}
                    onClick={() => window.open(`/hub/tenant/${tenant.slug}`, "_blank")}
                    title={t("admin.tenants.openHub")}
                  />
                  <AdminIconButton icon={Pencil} onClick={() => openEdit(tenant)} title={t("admin.common.edit")} />
                  <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteTenant(tenant.id)} title={t("admin.common.delete")} />
                </>
              }
            />
          ))}
        </AdminList>
      ) : (
        <AdminGrid cols={4}>
          {filtered.map((tenant) => (
            <AdminCard key={tenant.id} compact className="group">
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                {tenant.plan ? (
                  <AdminBadge variant="primary">{tenant.plan.name}</AdminBadge>
                ) : (
                  <AdminBadge variant="neutral">—</AdminBadge>
                )}
              </div>

              <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">{tenant.name}</h3>
              <p className="text-[10px] text-[var(--rowi-muted)] font-mono truncate">{tenant.slug}</p>

              <div className="mt-2 space-y-1 text-[10px] text-[var(--rowi-muted)]">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </div>
                {tenant.billingEmail && (
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3" />
                    {tenant.billingEmail}
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-1 mt-3 pt-2 border-t border-[var(--rowi-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                <AdminButton variant="ghost" size="xs" icon={ExternalLink} onClick={() => window.open(`/hub/tenant/${tenant.slug}`, "_blank")}>
                  {t("admin.tenants.openHub")}
                </AdminButton>
                <div className="flex gap-1">
                  <AdminIconButton icon={Pencil} onClick={() => openEdit(tenant)} />
                  <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteTenant(tenant.id)} />
                </div>
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
