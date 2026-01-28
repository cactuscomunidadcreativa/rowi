"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  HeartHandshake,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Users,
  BarChart3,
  Globe2,
  Lock,
  Network,
  Building2,
  Layers3,
  Eye,
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
   🧭 Rowi Admin — Communities Management
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

interface CommunityData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  visibility?: string;
  category?: string;
  bannerUrl?: string;
  hubId?: string;
  tenantId?: string;
  superHubId?: string;
  hub?: { id: string; name: string };
  tenant?: { id: string; name: string };
  superHub?: { id: string; name: string };
  _count?: { members: number };
}

const VISIBILITY_OPTIONS = [
  { value: "public", labelKey: "admin.communities.visibility.public", icon: Globe2 },
  { value: "invite", labelKey: "admin.communities.visibility.invite", icon: Users },
  { value: "private", labelKey: "admin.communities.visibility.private", icon: Lock },
];

const CATEGORY_OPTIONS = [
  { value: "", labelKey: "admin.communities.category.none" },
  { value: "mindfulness", labelKey: "admin.communities.category.mindfulness" },
  { value: "leadership", labelKey: "admin.communities.category.leadership" },
  { value: "relationships", labelKey: "admin.communities.category.relationships" },
  { value: "education", labelKey: "admin.communities.category.education" },
  { value: "innovation", labelKey: "admin.communities.category.innovation" },
];

export default function AdminCommunitiesPage() {
  const { t, ready } = useI18n();
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [superHubs, setSuperHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    id?: string;
    name: string;
    slug: string;
    description: string;
    visibility: string;
    category: string;
    bannerUrl: string;
    hubId: string;
    tenantId: string;
    superHubId: string;
  } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [comRes, hRes, tRes, shRes] = await Promise.all([
        fetch("/api/hub/communities"),
        fetch("/api/hub/hubs"),
        fetch("/api/hub/tenants"),
        fetch("/api/hub/superhubs"),
      ]);

      const [comData, hData, tData, shData] = await Promise.all([
        comRes.json(),
        hRes.json(),
        tRes.json(),
        shRes.json(),
      ]);

      setCommunities(Array.isArray(comData) ? comData : []);
      setHubs(Array.isArray(hData?.hubs) ? hData.hubs : Array.isArray(hData) ? hData : []);
      setTenants(Array.isArray(tData?.tenants) ? tData.tenants : Array.isArray(tData) ? tData : []);
      setSuperHubs(Array.isArray(shData?.superHubs) ? shData.superHubs : Array.isArray(shData) ? shData : []);
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
      visibility: "public",
      category: "",
      bannerUrl: "",
      hubId: "",
      tenantId: "",
      superHubId: "",
    });
  }

  function openEdit(c: CommunityData) {
    setEditor({
      mode: "edit",
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      visibility: c.visibility || "public",
      category: c.category || "",
      bannerUrl: c.bannerUrl || "",
      hubId: c.hubId || "",
      tenantId: c.tenantId || "",
      superHubId: c.superHubId || "",
    });
  }

  async function save() {
    if (!editor) return;
    if (!editor.name) {
      toast.error(t("admin.communities.requiredFields"));
      return;
    }

    setSaving(true);
    try {
      const method = editor.mode === "create" ? "POST" : "PUT";
      const url = editor.mode === "create" ? "/api/hub/communities" : `/api/hub/communities/${editor.id}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editor.name,
          slug: editor.slug || editor.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          description: editor.description,
          visibility: editor.visibility,
          category: editor.category,
          bannerUrl: editor.bannerUrl,
          hubId: editor.hubId || null,
          tenantId: editor.tenantId || null,
          superHubId: editor.superHubId || null,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success(editor.mode === "create" ? t("admin.communities.created") : t("admin.communities.updated"));
      setEditor(null);
      loadData();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCommunity(id: string) {
    if (!confirm(t("admin.communities.confirmDelete"))) return;
    try {
      const res = await fetch(`/api/hub/communities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(t("admin.communities.deleted"));
      loadData();
    } catch {
      toast.error(t("common.error"));
    }
  }

  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  function getVisibilityColor(v: string) {
    switch (v) {
      case "public": return "success";
      case "invite": return "info";
      case "private": return "warning";
      default: return "default";
    }
  }

  function getVisibilityIcon(v: string) {
    switch (v) {
      case "public": return Globe2;
      case "invite": return Users;
      case "private": return Lock;
      default: return Globe2;
    }
  }

  return (
    <AdminPage
      titleKey="admin.communities.title"
      descriptionKey="admin.communities.description"
      icon={HeartHandshake}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <Link href="/hub/admin/communities/summary">
            <AdminButton variant="secondary" icon={BarChart3} size="sm">
              {t("admin.communities.summary")}
            </AdminButton>
          </Link>
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadData} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton icon={PlusCircle} onClick={openCreate} size="sm">
            {t("admin.communities.new")}
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
              {editor.mode === "create" ? t("admin.communities.new") : t("admin.communities.edit")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              placeholderKey="admin.communities.name"
              value={editor.name}
              onChange={(v) => setEditor({ ...editor, name: v, slug: editor.slug || v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
            />
            <AdminInput
              placeholderKey="admin.communities.slug"
              value={editor.slug}
              onChange={(v) => setEditor({ ...editor, slug: v })}
            />
            <AdminSelect
              value={editor.visibility}
              onChange={(v) => setEditor({ ...editor, visibility: v })}
              options={VISIBILITY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
            <AdminSelect
              value={editor.category}
              onChange={(v) => setEditor({ ...editor, category: v })}
              options={CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
            <AdminInput
              placeholderKey="admin.communities.bannerUrl"
              value={editor.bannerUrl}
              onChange={(v) => setEditor({ ...editor, bannerUrl: v })}
            />
            <div className="md:col-span-2">
              <AdminTextarea
                placeholderKey="admin.communities.descriptionPlaceholder"
                value={editor.description}
                onChange={(v) => setEditor({ ...editor, description: v })}
              />
            </div>
          </div>

          {/* Hierarchy Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <AdminSelect
              value={editor.tenantId}
              onChange={(v) => setEditor({ ...editor, tenantId: v })}
              options={[
                { value: "", label: t("admin.communities.noTenant") },
                ...tenants.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
            <AdminSelect
              value={editor.hubId}
              onChange={(v) => setEditor({ ...editor, hubId: v })}
              options={[
                { value: "", label: t("admin.communities.noHub") },
                ...hubs.map((h) => ({ value: h.id, label: h.name })),
              ]}
            />
            <AdminSelect
              value={editor.superHubId}
              onChange={(v) => setEditor({ ...editor, superHubId: v })}
              options={[
                { value: "", label: t("admin.communities.noSuperHub") },
                ...superHubs.map((s) => ({ value: s.id, label: s.name })),
              ]}
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

      {/* Communities List/Grid */}
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={HeartHandshake}
          titleKey="admin.communities.noCommunities"
          descriptionKey="admin.communities.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filtered.map((c) => {
            const VisIcon = getVisibilityIcon(c.visibility || "public");
            return (
              <AdminListItem
                key={c.id}
                icon={HeartHandshake}
                title={c.name}
                subtitle={<span className="font-mono text-[10px]">{c.slug}</span>}
                badge={
                  <AdminBadge variant={getVisibilityColor(c.visibility || "public")}>
                    <VisIcon className="w-3 h-3 mr-0.5" />
                    {t(`admin.communities.visibility.${c.visibility || "public"}`)}
                  </AdminBadge>
                }
                meta={
                  <div className="flex items-center gap-4 text-xs text-[var(--rowi-muted)]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {c._count?.members || 0} {t("admin.communities.membersCount")}
                    </span>
                    {c.hub && (
                      <span className="flex items-center gap-1">
                        <Network className="w-3 h-3" />
                        {c.hub.name}
                      </span>
                    )}
                    {c.tenant && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {c.tenant.name}
                      </span>
                    )}
                  </div>
                }
                actions={
                  <>
                    <Link href={`/hub/admin/communities/${c.id}/members`}>
                      <AdminIconButton icon={Eye} title={t("admin.communities.viewMembers")} />
                    </Link>
                    <AdminIconButton icon={Pencil} onClick={() => openEdit(c)} title={t("admin.common.edit")} />
                    <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteCommunity(c.id)} title={t("admin.common.delete")} />
                  </>
                }
              />
            );
          })}
        </AdminList>
      ) : (
        <AdminGrid cols={3}>
          {filtered.map((c) => {
            const VisIcon = getVisibilityIcon(c.visibility || "public");
            return (
              <AdminCard key={c.id} compact className="group">
                {c.bannerUrl && (
                  <div className="h-20 -mx-3 -mt-3 mb-3 rounded-t-lg bg-cover bg-center" style={{ backgroundImage: `url(${c.bannerUrl})` }} />
                )}
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                    <HeartHandshake className="w-4 h-4 text-white" />
                  </div>
                  <AdminBadge variant={getVisibilityColor(c.visibility || "public")}>
                    <VisIcon className="w-3 h-3 mr-0.5" />
                    {t(`admin.communities.visibility.${c.visibility || "public"}`)}
                  </AdminBadge>
                </div>

                <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">{c.name}</h3>
                <p className="text-[10px] text-[var(--rowi-muted)] font-mono truncate">{c.slug}</p>
                {c.description && (
                  <p className="text-xs text-[var(--rowi-muted)] mt-1 line-clamp-2">{c.description}</p>
                )}

                <div className="flex gap-3 mt-3 pt-2 border-t border-[var(--rowi-border)]">
                  <div className="flex items-center gap-1 text-[10px] text-[var(--rowi-muted)]">
                    <Users className="w-3 h-3" />
                    {c._count?.members || 0}
                  </div>
                  {c.hub && (
                    <div className="flex items-center gap-1 text-[10px] text-[var(--rowi-muted)]">
                      <Network className="w-3 h-3" />
                      {c.hub.name}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/hub/admin/communities/${c.id}/members`}>
                    <AdminIconButton icon={Eye} />
                  </Link>
                  <AdminIconButton icon={Pencil} onClick={() => openEdit(c)} />
                  <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteCommunity(c.id)} />
                </div>
              </AdminCard>
            );
          })}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
