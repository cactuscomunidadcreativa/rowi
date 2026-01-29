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
  UserPlus,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  X,
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
   100% responsive + 100% translatable
========================================================= */

// ─────────────────────────────────────────────────────────
// Traducciones inline para elementos no cubiertos por i18n
// ─────────────────────────────────────────────────────────
const T: Record<string, Record<string, string>> = {
  filterBy: { es: "Filtrar por", en: "Filter by" },
  all: { es: "Todos", en: "All" },
  showing: { es: "Mostrando", en: "Showing" },
  of: { es: "de", en: "of" },
  results: { es: "resultados", en: "results" },
  actions: { es: "Acciones", en: "Actions" },
  moreActions: { es: "Más acciones", en: "More actions" },
  members: { es: "miembros", en: "members" },
  noDescription: { es: "Sin descripción", en: "No description" },
};

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
  const { t, ready, lang } = useI18n();
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [superHubs, setSuperHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
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

  // Helper para traducciones inline
  const tt = (key: string) => T[key]?.[lang] || T[key]?.es || key;

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

  // Stats
  const totalMembers = communities.reduce((acc, c) => acc + (c._count?.members || 0), 0);
  const publicCount = communities.filter((c) => c.visibility === "public").length;
  const privateCount = communities.filter((c) => c.visibility === "private").length;

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
        <>
          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <AdminSearch value={search} onChange={setSearch} className="w-48" />
            <AdminViewToggle view={viewMode} onChange={setViewMode} />
            <Link href="/hub/admin/communities/import">
              <AdminButton variant="secondary" icon={FileSpreadsheet} size="sm">
                {t("admin.communities.import")}
              </AdminButton>
            </Link>
            <Link href="/hub/admin/communities/members">
              <AdminButton variant="secondary" icon={Users} size="sm">
                {t("admin.communities.allMembers")}
              </AdminButton>
            </Link>
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

          {/* Tablet Actions */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            <AdminSearch value={search} onChange={setSearch} className="w-36" />
            <AdminViewToggle view={viewMode} onChange={setViewMode} />
            <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadData} size="sm" />
            <AdminButton icon={PlusCircle} onClick={openCreate} size="sm">
              {t("admin.communities.new")}
            </AdminButton>
            <div className="relative">
              <AdminButton
                variant="secondary"
                icon={showMobileActions ? ChevronUp : ChevronDown}
                onClick={() => setShowMobileActions(!showMobileActions)}
                size="sm"
              >
                {tt("moreActions")}
              </AdminButton>
              {showMobileActions && (
                <div className="absolute right-0 top-full mt-1 bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg shadow-lg p-2 z-50 min-w-[180px]">
                  <Link href="/hub/admin/communities/import" className="block">
                    <AdminButton variant="ghost" icon={FileSpreadsheet} size="sm" className="w-full justify-start">
                      {t("admin.communities.import")}
                    </AdminButton>
                  </Link>
                  <Link href="/hub/admin/communities/members" className="block">
                    <AdminButton variant="ghost" icon={Users} size="sm" className="w-full justify-start">
                      {t("admin.communities.allMembers")}
                    </AdminButton>
                  </Link>
                  <Link href="/hub/admin/communities/summary" className="block">
                    <AdminButton variant="ghost" icon={BarChart3} size="sm" className="w-full justify-start">
                      {t("admin.communities.summary")}
                    </AdminButton>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <AdminSearch value={search} onChange={setSearch} className="flex-1 min-w-0" />
            <AdminButton icon={PlusCircle} onClick={openCreate} size="sm" />
            <div className="relative">
              <AdminButton
                variant="secondary"
                icon={showMobileActions ? X : ChevronDown}
                onClick={() => setShowMobileActions(!showMobileActions)}
                size="sm"
              />
              {showMobileActions && (
                <div className="absolute right-0 top-full mt-1 bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
                  <div className="flex items-center gap-2 px-2 py-1 mb-2">
                    <AdminViewToggle view={viewMode} onChange={setViewMode} />
                  </div>
                  <AdminButton variant="ghost" icon={RefreshCcw} size="sm" className="w-full justify-start" onClick={() => { loadData(); setShowMobileActions(false); }}>
                    {t("admin.common.refresh")}
                  </AdminButton>
                  <Link href="/hub/admin/communities/import" className="block" onClick={() => setShowMobileActions(false)}>
                    <AdminButton variant="ghost" icon={FileSpreadsheet} size="sm" className="w-full justify-start">
                      {t("admin.communities.import")}
                    </AdminButton>
                  </Link>
                  <Link href="/hub/admin/communities/members" className="block" onClick={() => setShowMobileActions(false)}>
                    <AdminButton variant="ghost" icon={Users} size="sm" className="w-full justify-start">
                      {t("admin.communities.allMembers")}
                    </AdminButton>
                  </Link>
                  <Link href="/hub/admin/communities/summary" className="block" onClick={() => setShowMobileActions(false)}>
                    <AdminButton variant="ghost" icon={BarChart3} size="sm" className="w-full justify-start">
                      {t("admin.communities.summary")}
                    </AdminButton>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      }
    >
      {/* Stats Cards - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <AdminCard compact className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[var(--rowi-primary)]">{communities.length}</p>
          <p className="text-[10px] md:text-xs text-[var(--rowi-muted)] truncate">{t("admin.communities.totalCommunities")}</p>
        </AdminCard>
        <AdminCard compact className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-[var(--rowi-secondary)]">{totalMembers}</p>
          <p className="text-[10px] md:text-xs text-[var(--rowi-muted)] truncate">{t("admin.communities.totalMembers")}</p>
        </AdminCard>
        <AdminCard compact className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-green-500">{publicCount}</p>
          <p className="text-[10px] md:text-xs text-[var(--rowi-muted)] truncate">{t("admin.communities.publicCommunities")}</p>
        </AdminCard>
        <AdminCard compact className="text-center">
          <p className="text-2xl md:text-3xl font-bold text-amber-500">{privateCount}</p>
          <p className="text-[10px] md:text-xs text-[var(--rowi-muted)] truncate">{t("admin.communities.privateCommunities")}</p>
        </AdminCard>
      </div>

      {/* Editor Form - Responsive */}
      {editor && (
        <AdminCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center flex-shrink-0">
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
            <button
              onClick={() => setEditor(null)}
              className="p-1 hover:bg-[var(--rowi-muted)]/10 rounded md:hidden"
            >
              <X className="w-5 h-5 text-[var(--rowi-muted)]" />
            </button>
          </div>

          {/* Basic Info */}
          <p className="text-xs text-[var(--rowi-muted)] mb-2 font-medium">{t("admin.communities.basicInfo")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
            <div className="md:col-span-2">
              <AdminInput
                placeholderKey="admin.communities.bannerUrl"
                value={editor.bannerUrl}
                onChange={(v) => setEditor({ ...editor, bannerUrl: v })}
              />
            </div>
            <div className="md:col-span-2">
              <AdminTextarea
                placeholderKey="admin.communities.descriptionPlaceholder"
                value={editor.description}
                onChange={(v) => setEditor({ ...editor, description: v })}
              />
            </div>
          </div>

          {/* Hierarchy Links */}
          <p className="text-xs text-[var(--rowi-muted)] mb-2 mt-4 font-medium">{t("admin.communities.hierarchy")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
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

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
            <AdminButton variant="secondary" onClick={() => setEditor(null)} className="w-full sm:w-auto">
              {t("admin.common.cancel")}
            </AdminButton>
            <AdminButton onClick={save} loading={saving} className="w-full sm:w-auto">
              {editor.mode === "create" ? t("admin.common.create") : t("admin.common.save")}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {/* Results count */}
      {search && (
        <p className="text-xs text-[var(--rowi-muted)] mb-3">
          {tt("showing")} {filtered.length} {tt("of")} {communities.length} {tt("results")}
        </p>
      )}

      {/* Communities List/Grid - Responsive */}
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
                    <span className="hidden sm:inline">{t(`admin.communities.visibility.${c.visibility || "public"}`)}</span>
                  </AdminBadge>
                }
                meta={
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-[var(--rowi-muted)]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {c._count?.members || 0} <span className="hidden sm:inline">{tt("members")}</span>
                    </span>
                    {c.hub && (
                      <span className="hidden md:flex items-center gap-1">
                        <Network className="w-3 h-3" />
                        {c.hub.name}
                      </span>
                    )}
                    {c.tenant && (
                      <span className="hidden lg:flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {c.tenant.name}
                      </span>
                    )}
                  </div>
                }
                actions={
                  <>
                    <Link href={`/hub/admin/communities/${c.id}/members`}>
                      <AdminIconButton icon={Users} title={t("admin.communities.viewMembers")} />
                    </Link>
                    <Link href={`/hub/admin/communities/import?communityId=${c.id}`} className="hidden sm:block">
                      <AdminIconButton icon={UserPlus} title={t("admin.communities.addMembers")} />
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
        <AdminGrid cols={3} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const VisIcon = getVisibilityIcon(c.visibility || "public");
            const isExpanded = expandedCard === c.id;
            return (
              <AdminCard
                key={c.id}
                compact
                className="group"
                onClick={() => setExpandedCard(isExpanded ? null : c.id)}
              >
                {c.bannerUrl && (
                  <div
                    className="h-16 sm:h-20 -mx-3 -mt-3 mb-3 rounded-t-lg bg-cover bg-center"
                    style={{ backgroundImage: `url(${c.bannerUrl})` }}
                  />
                )}
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center flex-shrink-0">
                    <HeartHandshake className="w-4 h-4 text-white" />
                  </div>
                  <AdminBadge variant={getVisibilityColor(c.visibility || "public")}>
                    <VisIcon className="w-3 h-3 mr-0.5" />
                    <span className="hidden xs:inline">{t(`admin.communities.visibility.${c.visibility || "public"}`)}</span>
                  </AdminBadge>
                </div>

                <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">{c.name}</h3>
                <p className="text-[10px] text-[var(--rowi-muted)] font-mono truncate">{c.slug}</p>
                {c.description && (
                  <p className="text-xs text-[var(--rowi-muted)] mt-1 line-clamp-2">{c.description}</p>
                )}

                <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 pt-2 border-t border-[var(--rowi-border)]">
                  <div className="flex items-center gap-1 text-[10px] text-[var(--rowi-muted)]">
                    <Users className="w-3 h-3" />
                    {c._count?.members || 0}
                  </div>
                  {c.hub && (
                    <div className="flex items-center gap-1 text-[10px] text-[var(--rowi-muted)]">
                      <Network className="w-3 h-3" />
                      <span className="truncate max-w-[80px]">{c.hub.name}</span>
                    </div>
                  )}
                  {c.tenant && (
                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--rowi-muted)]">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate max-w-[80px]">{c.tenant.name}</span>
                    </div>
                  )}
                </div>

                {/* Actions - visible on hover (desktop) or always on mobile */}
                <div
                  className={`flex justify-end gap-1 mt-2 transition-opacity ${
                    isExpanded ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/hub/admin/communities/${c.id}/members`}>
                    <AdminIconButton icon={Users} title={t("admin.communities.viewMembers")} />
                  </Link>
                  <Link href={`/hub/admin/communities/import?communityId=${c.id}`}>
                    <AdminIconButton icon={UserPlus} title={t("admin.communities.addMembers")} />
                  </Link>
                  <AdminIconButton icon={Pencil} onClick={() => openEdit(c)} title={t("admin.common.edit")} />
                  <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteCommunity(c.id)} title={t("admin.common.delete")} />
                </div>
              </AdminCard>
            );
          })}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
