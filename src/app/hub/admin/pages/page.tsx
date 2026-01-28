"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Globe2,
  Lock,
  Settings2,
  Type,
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
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminEmpty,
  AdminIconButton,
  AdminTabs,
  AdminViewToggle,
  AdminSearch,
} from "@/components/admin/AdminPage";

/* =========================================================
   📄 Rowi Admin — Pages CMS
========================================================= */

interface PageData {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  lang: string;
  visibility: string;
  accessLevel: string;
  content?: any;
  seo?: any;
}

export default function AdminPagesPage() {
  const { t, ready } = useI18n();
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PageData | null>(null);
  const [creating, setCreating] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  async function loadPages() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pages", { cache: "no-store" });
      const data = await res.json();
      setPages(data.pages || []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadPages();
  }, [ready]);

  async function scanPages() {
    setScanning(true);
    try {
      const res = await fetch("/api/admin/pages/scan", { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success(`${data.created} ${t("admin.pages.newPages")}, ${data.updated} ${t("admin.pages.updatedPages")}`);
      loadPages();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setScanning(false);
    }
  }

  async function createPage() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t("admin.pages.untitled"),
          slug: `page-${Date.now()}`,
          lang: "es",
          visibility: "global",
          accessLevel: "public",
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success(t("admin.pages.created"));
      loadPages();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setCreating(false);
    }
  }

  async function deletePage(id: string) {
    if (!confirm(t("admin.pages.confirmDelete"))) return;
    try {
      await fetch("/api/admin/pages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      toast.success(t("admin.pages.deleted"));
      loadPages();
    } catch {
      toast.error(t("common.error"));
    }
  }

  const filteredPages = pages.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPage
      titleKey="admin.pages.title"
      descriptionKey="admin.pages.description"
      icon={FileText}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadPages} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton variant="secondary" icon={Eye} onClick={scanPages} loading={scanning} size="sm">
            {t("admin.pages.scan")}
          </AdminButton>
          <AdminButton icon={PlusCircle} onClick={createPage} loading={creating} size="sm">
            {t("admin.pages.new")}
          </AdminButton>
        </div>
      }
    >
      {filteredPages.length === 0 ? (
        <AdminEmpty
          icon={FileText}
          titleKey="admin.pages.noPages"
          descriptionKey="admin.pages.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filteredPages.map((page) => (
            <AdminListItem
              key={page.id}
              icon={FileText}
              title={page.title}
              subtitle={`/${page.slug}`}
              badge={
                <AdminBadge variant={page.accessLevel === "public" ? "success" : "neutral"}>
                  {page.accessLevel === "public" ? (
                    <><Globe2 className="w-3 h-3 mr-0.5" />Public</>
                  ) : (
                    <><Lock className="w-3 h-3 mr-0.5" />Private</>
                  )}
                </AdminBadge>
              }
              meta={<span className="uppercase text-[10px] font-medium">{page.lang}</span>}
              actions={
                <>
                  <AdminIconButton icon={Eye} onClick={() => window.open(`/${page.slug}`, '_blank')} title={t("admin.common.preview")} />
                  <AdminIconButton icon={Pencil} onClick={() => setEditing(page)} title={t("admin.common.edit")} />
                  <AdminIconButton icon={Trash2} variant="danger" onClick={() => deletePage(page.id)} title={t("admin.common.delete")} />
                </>
              }
            />
          ))}
        </AdminList>
      ) : (
        <AdminGrid cols={4}>
          {filteredPages.map((page) => (
            <AdminCard key={page.id} compact className="group">
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--rowi-primary)]/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[var(--rowi-primary)]" />
                </div>
                <AdminBadge variant={page.accessLevel === "public" ? "success" : "neutral"}>
                  {page.accessLevel === "public" ? "Public" : "Private"}
                </AdminBadge>
              </div>
              <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">{page.title}</h3>
              <p className="text-xs text-[var(--rowi-muted)] font-mono truncate">/{page.slug}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--rowi-border)]">
                <span className="text-[10px] font-medium text-[var(--rowi-muted)] uppercase">{page.lang}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <AdminIconButton icon={Eye} onClick={() => window.open(`/${page.slug}`, '_blank')} />
                  <AdminIconButton icon={Pencil} onClick={() => setEditing(page)} />
                  <AdminIconButton icon={Trash2} variant="danger" onClick={() => deletePage(page.id)} />
                </div>
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}

      {editing && (
        <PageEditorModal
          page={editing}
          onClose={() => setEditing(null)}
          onSaved={loadPages}
        />
      )}
    </AdminPage>
  );
}

/* =========================================================
   📝 PageEditorModal
========================================================= */

function PageEditorModal({
  page,
  onClose,
  onSaved,
}: {
  page: PageData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState(page);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("general");

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success(t("admin.pages.updated"));
      onClose();
      onSaved();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col bg-[var(--rowi-surface)] rounded-xl shadow-xl border border-[var(--rowi-border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--rowi-border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--rowi-foreground)]">{t("admin.pages.edit")}</h2>
              <p className="text-xs text-[var(--rowi-muted)]">/{form.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AdminButton variant="ghost" size="sm" onClick={onClose}>{t("admin.common.cancel")}</AdminButton>
            <AdminButton size="sm" onClick={save} loading={saving}>{t("admin.common.save")}</AdminButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3">
          <AdminTabs
            tabs={[
              { id: "general", labelKey: "admin.pages.tab.general", icon: Type },
              { id: "content", labelKey: "admin.pages.tab.content", icon: FileText },
              { id: "seo", labelKey: "admin.pages.tab.seo", icon: Eye },
              { id: "access", labelKey: "admin.pages.tab.access", icon: Settings2 },
            ]}
            activeTab={tab}
            onChange={setTab}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === "general" && (
            <>
              <AdminInput
                labelKey="admin.pages.titleField"
                value={form.title}
                onChange={(v) => setForm({ ...form, title: v })}
              />
              <AdminInput
                labelKey="admin.pages.slug"
                value={form.slug}
                onChange={(v) => setForm({ ...form, slug: v })}
              />
              <AdminTextarea
                labelKey="admin.pages.summary"
                value={form.summary || ""}
                onChange={(v) => setForm({ ...form, summary: v })}
                rows={2}
              />
              <AdminSelect
                labelKey="admin.pages.language"
                value={form.lang}
                onChange={(v) => setForm({ ...form, lang: v })}
                options={[
                  { value: "es", label: "Español" },
                  { value: "en", label: "English" },
                  { value: "pt", label: "Português" },
                  { value: "it", label: "Italiano" },
                ]}
              />
            </>
          )}

          {tab === "content" && (
            <AdminTextarea
              labelKey="admin.pages.content"
              value={JSON.stringify(form.content || {}, null, 2)}
              onChange={(v) => {
                try { setForm({ ...form, content: JSON.parse(v) }); } catch {}
              }}
              rows={12}
            />
          )}

          {tab === "seo" && (
            <AdminTextarea
              labelKey="admin.pages.seoConfig"
              value={JSON.stringify(form.seo || {}, null, 2)}
              onChange={(v) => {
                try { setForm({ ...form, seo: JSON.parse(v) }); } catch {}
              }}
              rows={8}
            />
          )}

          {tab === "access" && (
            <>
              <AdminSelect
                labelKey="admin.pages.visibility"
                value={form.visibility}
                onChange={(v) => setForm({ ...form, visibility: v })}
                options={[
                  { value: "global", label: "Global" },
                  { value: "tenant", label: "Tenant" },
                  { value: "superhub", label: "SuperHub" },
                  { value: "organization", label: "Organization" },
                ]}
              />
              <AdminSelect
                labelKey="admin.pages.accessLevel"
                value={form.accessLevel}
                onChange={(v) => setForm({ ...form, accessLevel: v })}
                options={[
                  { value: "public", label: t("admin.pages.public") },
                  { value: "private", label: t("admin.pages.private") },
                  { value: "internal", label: t("admin.pages.internal") },
                ]}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
