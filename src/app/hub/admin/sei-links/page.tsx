"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Link2,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Globe2,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Languages,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminButton,
  AdminBadge,
  AdminInput,
  AdminTextarea,
  AdminEmpty,
  AdminIconButton,
  AdminSearch,
  AdminViewToggle,
  AdminList,
  AdminListItem,
} from "@/components/admin/AdminPage";

/* =========================================================
   🔗 Rowi Admin — SEI Links Management
   ---------------------------------------------------------
   Manage SEI links by language and plan
========================================================= */

interface SeiLink {
  id: string;
  code: string;
  name: string;
  url: string;
  language: string;
  planSlug?: string;
  isDefault: boolean;
  sixSecondsProjectId?: string;
  isActive: boolean;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface EditorState {
  mode: "create" | "edit";
  id?: string;
  code: string;
  name: string;
  url: string;
  language: string;
  planSlug: string;
  isDefault: boolean;
  sixSecondsProjectId: string;
  isActive: boolean;
  description: string;
  notes: string;
}

const INITIAL_EDITOR: Omit<EditorState, "mode"> = {
  code: "",
  name: "",
  url: "",
  language: "es",
  planSlug: "",
  isDefault: false,
  sixSecondsProjectId: "",
  isActive: true,
  description: "",
  notes: "",
};

const LANGUAGES = [
  { code: "es", name: "Español" },
  { code: "en", name: "English" },
  { code: "pt", name: "Português" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
];

export default function SeiLinksAdminPage() {
  const { t, ready } = useI18n();
  const [links, setLinks] = useState<SeiLink[]>([]);
  const [byLanguage, setByLanguage] = useState<Record<string, SeiLink[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [showInactive, setShowInactive] = useState(false);
  const [filterLanguage, setFilterLanguage] = useState<string>("");
  const [editor, setEditor] = useState<EditorState | null>(null);

  async function loadLinks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (!showInactive) params.set("activeOnly", "true");
      if (filterLanguage) params.set("language", filterLanguage);

      const res = await fetch(`/api/admin/sei-links?${params}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok) {
        setLinks(data.links || []);
        setByLanguage(data.byLanguage || {});
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadLinks();
  }, [ready, showInactive, filterLanguage]);

  function openCreate() {
    setEditor({ mode: "create", ...INITIAL_EDITOR });
  }

  function openEdit(link: SeiLink) {
    setEditor({
      mode: "edit",
      id: link.id,
      code: link.code,
      name: link.name,
      url: link.url,
      language: link.language,
      planSlug: link.planSlug || "",
      isDefault: link.isDefault,
      sixSecondsProjectId: link.sixSecondsProjectId || "",
      isActive: link.isActive,
      description: link.description || "",
      notes: link.notes || "",
    });
  }

  async function save() {
    if (!editor) return;
    if (!editor.code.trim() || !editor.name.trim() || !editor.url.trim()) {
      toast.error(t("admin.seiLinks.requiredFields"));
      return;
    }

    setSaving(true);
    try {
      const method = editor.mode === "edit" ? "PATCH" : "POST";
      const res = await fetch("/api/admin/sei-links", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editor.id,
          code: editor.code,
          name: editor.name,
          url: editor.url,
          language: editor.language,
          planSlug: editor.planSlug || undefined,
          isDefault: editor.isDefault,
          sixSecondsProjectId: editor.sixSecondsProjectId || undefined,
          isActive: editor.isActive,
          description: editor.description || undefined,
          notes: editor.notes || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);

      toast.success(
        editor.mode === "edit"
          ? t("admin.seiLinks.updated")
          : t("admin.seiLinks.created")
      );
      setEditor(null);
      loadLinks();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteLink(id: string) {
    if (!confirm(t("admin.seiLinks.confirmDelete"))) return;
    try {
      const res = await fetch("/api/admin/sei-links", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(t("admin.seiLinks.deleted"));
      loadLinks();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    }
  }

  async function toggleActive(link: SeiLink) {
    try {
      const res = await fetch("/api/admin/sei-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, isActive: !link.isActive }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(
        link.isActive
          ? t("admin.seiLinks.deactivated")
          : t("admin.seiLinks.activated")
      );
      loadLinks();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success(t("admin.seiLinks.copied"));
  }

  const filtered = links.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase()) ||
      l.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPage
      titleKey="admin.seiLinks.title"
      descriptionKey="admin.seiLinks.description"
      icon={Link2}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-[var(--rowi-card)] border border-[var(--rowi-border)]"
          >
            <option value="">{t("admin.seiLinks.allLanguages")}</option>
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              showInactive
                ? "bg-[var(--rowi-warning)]/10 text-[var(--rowi-warning)]"
                : "bg-[var(--rowi-muted)]/10 text-[var(--rowi-muted)]"
            }`}
          >
            {showInactive ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
            {showInactive
              ? t("admin.common.hideInactive")
              : t("admin.common.showInactive")}
          </button>
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton
            variant="secondary"
            icon={RefreshCcw}
            onClick={loadLinks}
            size="sm"
          >
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton icon={PlusCircle} onClick={openCreate} size="sm">
            {t("admin.seiLinks.new")}
          </AdminButton>
        </div>
      }
    >
      {/* Editor Form */}
      {editor && (
        <AdminCard className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              {editor.mode === "create" ? (
                <PlusCircle className="w-4 h-4 text-white" />
              ) : (
                <Pencil className="w-4 h-4 text-white" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
              {editor.mode === "create"
                ? t("admin.seiLinks.new")
                : t("admin.seiLinks.edit")}
            </h3>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <AdminInput
              placeholderKey="admin.seiLinks.code"
              value={editor.code}
              onChange={(v) => setEditor({ ...editor, code: v })}
            />
            <AdminInput
              placeholderKey="admin.seiLinks.name"
              value={editor.name}
              onChange={(v) => setEditor({ ...editor, name: v })}
            />
            <div className="flex items-center gap-2">
              <select
                value={editor.language}
                onChange={(e) =>
                  setEditor({ ...editor, language: e.target.value })
                }
                className="flex-1 px-3 py-2 rounded-lg text-sm bg-[var(--rowi-card)] border border-[var(--rowi-border)]"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* URL */}
          <div className="mb-4">
            <AdminInput
              placeholderKey="admin.seiLinks.url"
              value={editor.url}
              onChange={(v) => setEditor({ ...editor, url: v })}
            />
          </div>

          {/* Plan & Project */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <AdminInput
              placeholderKey="admin.seiLinks.planSlug"
              value={editor.planSlug}
              onChange={(v) => setEditor({ ...editor, planSlug: v })}
            />
            <AdminInput
              placeholderKey="admin.seiLinks.sixSecondsProjectId"
              value={editor.sixSecondsProjectId}
              onChange={(v) => setEditor({ ...editor, sixSecondsProjectId: v })}
            />
          </div>

          {/* Description & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <AdminTextarea
              placeholderKey="admin.seiLinks.descriptionField"
              value={editor.description}
              onChange={(v) => setEditor({ ...editor, description: v })}
            />
            <AdminTextarea
              placeholderKey="admin.seiLinks.notes"
              value={editor.notes}
              onChange={(v) => setEditor({ ...editor, notes: v })}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-2 mb-4">
            <FeatureToggle
              active={editor.isDefault}
              onClick={() => setEditor({ ...editor, isDefault: !editor.isDefault })}
              icon={Check}
              label={t("admin.seiLinks.isDefault")}
            />
            <FeatureToggle
              active={editor.isActive}
              onClick={() => setEditor({ ...editor, isActive: !editor.isActive })}
              icon={Eye}
              label={t("admin.seiLinks.isActive")}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <AdminButton variant="secondary" onClick={() => setEditor(null)}>
              {t("admin.common.cancel")}
            </AdminButton>
            <AdminButton onClick={save} loading={saving}>
              {editor.mode === "create"
                ? t("admin.common.create")
                : t("admin.common.save")}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {/* Links by Language Summary */}
      {!filterLanguage && Object.keys(byLanguage).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(byLanguage).map(([lang, langLinks]) => (
            <button
              key={lang}
              onClick={() => setFilterLanguage(lang)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--rowi-card)] border border-[var(--rowi-border)] text-xs hover:border-[var(--rowi-primary)] transition-colors"
            >
              <Languages className="w-3 h-3" />
              <span className="font-medium uppercase">{lang}</span>
              <span className="text-[var(--rowi-muted)]">
                {langLinks.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Links List/Grid */}
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={Link2}
          titleKey="admin.seiLinks.noLinks"
          descriptionKey="admin.seiLinks.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filtered.map((link) => (
            <AdminListItem
              key={link.id}
              icon={Link2}
              title={
                <span className="flex items-center gap-2">
                  {link.name}
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] uppercase">
                    {link.language}
                  </span>
                  {link.isDefault && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/20 text-green-500">
                      {t("admin.seiLinks.default")}
                    </span>
                  )}
                  {!link.isActive && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-500">
                      {t("admin.seiLinks.inactive")}
                    </span>
                  )}
                </span>
              }
              subtitle={
                <span className="flex items-center gap-2">
                  <code className="text-[10px] text-[var(--rowi-muted)]">
                    {link.code}
                  </code>
                  <span className="text-[var(--rowi-muted)]">•</span>
                  <span className="truncate max-w-xs">{link.url}</span>
                </span>
              }
              badge={
                link.planSlug && (
                  <AdminBadge variant="info">{link.planSlug}</AdminBadge>
                )
              }
              actions={
                <>
                  <AdminIconButton
                    icon={Copy}
                    onClick={() => copyUrl(link.url)}
                    title={t("admin.seiLinks.copyUrl")}
                  />
                  <AdminIconButton
                    icon={ExternalLink}
                    onClick={() => window.open(link.url, "_blank")}
                    title={t("admin.seiLinks.openUrl")}
                  />
                  <AdminIconButton
                    icon={link.isActive ? EyeOff : Eye}
                    onClick={() => toggleActive(link)}
                    title={
                      link.isActive
                        ? t("admin.common.deactivate")
                        : t("admin.common.activate")
                    }
                  />
                  <AdminIconButton
                    icon={Pencil}
                    onClick={() => openEdit(link)}
                    title={t("admin.common.edit")}
                  />
                  <AdminIconButton
                    icon={Trash2}
                    variant="danger"
                    onClick={() => deleteLink(link.id)}
                    title={t("admin.common.delete")}
                  />
                </>
              }
            />
          ))}
        </AdminList>
      ) : (
        <AdminGrid cols={3}>
          {filtered.map((link) => (
            <AdminCard
              key={link.id}
              className={`group flex flex-col ${
                !link.isActive ? "opacity-60" : ""
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      link.isActive
                        ? "bg-gradient-to-br from-blue-500 to-purple-500"
                        : "bg-[var(--rowi-muted)]/20"
                    }`}
                  >
                    <Link2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                      {link.name}
                    </h3>
                    <code className="text-[10px] text-[var(--rowi-muted)]">
                      {link.code}
                    </code>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-0.5 text-[10px] rounded bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] uppercase font-medium">
                    {link.language}
                  </span>
                  {link.isDefault && (
                    <AdminBadge variant="success">
                      {t("admin.seiLinks.default")}
                    </AdminBadge>
                  )}
                </div>
              </div>

              {/* URL */}
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-[var(--rowi-muted)]/5 border border-[var(--rowi-border)]">
                <Globe2 className="w-3 h-3 text-[var(--rowi-muted)] flex-shrink-0" />
                <span className="text-[10px] truncate flex-1">
                  {link.url}
                </span>
                <button
                  onClick={() => copyUrl(link.url)}
                  className="p-1 hover:bg-[var(--rowi-muted)]/10 rounded"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>

              {/* Plan */}
              {link.planSlug && (
                <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)] mb-3">
                  <span>{t("admin.seiLinks.forPlan")}:</span>
                  <AdminBadge variant="info">{link.planSlug}</AdminBadge>
                </div>
              )}

              {/* Description */}
              {link.description && (
                <p className="text-xs text-[var(--rowi-muted)] mb-3 flex-1 line-clamp-2">
                  {link.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-1 pt-3 border-t border-[var(--rowi-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                <AdminIconButton
                  icon={ExternalLink}
                  onClick={() => window.open(link.url, "_blank")}
                />
                <AdminIconButton
                  icon={link.isActive ? EyeOff : Eye}
                  onClick={() => toggleActive(link)}
                />
                <AdminIconButton icon={Pencil} onClick={() => openEdit(link)} />
                <AdminIconButton
                  icon={Trash2}
                  variant="danger"
                  onClick={() => deleteLink(link.id)}
                />
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}

function FeatureToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
        active
          ? "bg-[var(--rowi-primary)]/10 border-[var(--rowi-primary)] text-[var(--rowi-primary)]"
          : "bg-[var(--rowi-background)] border-[var(--rowi-border)] text-[var(--rowi-muted)]"
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
      {active && <Check className="w-3 h-3" />}
    </button>
  );
}
