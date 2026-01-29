"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Languages,
  FolderOpen,
  Copy,
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
  AdminList,
  AdminListItem,
} from "@/components/admin/AdminPage";

/* =========================================================
   📝 Rowi Admin — CMS Content Management
   ---------------------------------------------------------
   Manage translatable content for onboarding, landing, etc.
========================================================= */

interface CmsContent {
  id: string;
  key: string;
  language: string;
  value: string;
  valueType: string;
  category?: string;
  subcategory?: string;
  description?: string;
  placeholder?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface EditorState {
  mode: "create" | "edit";
  id?: string;
  key: string;
  language: string;
  value: string;
  valueType: string;
  category: string;
  subcategory: string;
  description: string;
  placeholder: string;
  isActive: boolean;
}

const INITIAL_EDITOR: Omit<EditorState, "mode"> = {
  key: "",
  language: "es",
  value: "",
  valueType: "TEXT",
  category: "",
  subcategory: "",
  description: "",
  placeholder: "",
  isActive: true,
};

const CATEGORIES = [
  { value: "", label: "Todas" },
  { value: "onboarding", label: "Onboarding" },
  { value: "landing", label: "Landing" },
  { value: "pricing", label: "Pricing" },
  { value: "email", label: "Emails" },
  { value: "general", label: "General" },
];

const VALUE_TYPES = [
  { value: "TEXT", label: "Texto" },
  { value: "HTML", label: "HTML" },
  { value: "MARKDOWN", label: "Markdown" },
  { value: "JSON", label: "JSON" },
];

export default function CmsAdminPage() {
  const { t, ready } = useI18n();
  const [content, setContent] = useState<CmsContent[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, CmsContent[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);

  async function loadContent() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      if (filterLanguage) params.set("language", filterLanguage);

      const res = await fetch(`/api/admin/cms/content?${params}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok) {
        setContent(data.content || []);
        setByCategory(data.byCategory || {});
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
    if (ready) loadContent();
  }, [ready, filterCategory, filterLanguage]);

  function openCreate() {
    setEditor({ mode: "create", ...INITIAL_EDITOR });
  }

  function openEdit(item: CmsContent) {
    setEditor({
      mode: "edit",
      id: item.id,
      key: item.key,
      language: item.language,
      value: item.value,
      valueType: item.valueType,
      category: item.category || "",
      subcategory: item.subcategory || "",
      description: item.description || "",
      placeholder: item.placeholder || "",
      isActive: item.isActive,
    });
  }

  function duplicateForLanguage(item: CmsContent, newLanguage: string) {
    setEditor({
      mode: "create",
      key: item.key,
      language: newLanguage,
      value: item.value,
      valueType: item.valueType,
      category: item.category || "",
      subcategory: item.subcategory || "",
      description: item.description || "",
      placeholder: item.placeholder || "",
      isActive: true,
    });
  }

  async function save() {
    if (!editor) return;
    if (!editor.key.trim() || !editor.value.trim()) {
      toast.error(t("admin.cms.requiredFields"));
      return;
    }

    setSaving(true);
    try {
      const method = editor.mode === "edit" ? "PATCH" : "POST";
      const res = await fetch("/api/admin/cms/content", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editor.id,
          key: editor.key,
          language: editor.language,
          value: editor.value,
          valueType: editor.valueType,
          category: editor.category || undefined,
          subcategory: editor.subcategory || undefined,
          description: editor.description || undefined,
          placeholder: editor.placeholder || undefined,
          isActive: editor.isActive,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);

      toast.success(
        editor.mode === "edit"
          ? t("admin.cms.updated")
          : t("admin.cms.created")
      );
      setEditor(null);
      loadContent();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteContent(id: string) {
    if (!confirm(t("admin.cms.confirmDelete"))) return;
    try {
      const res = await fetch("/api/admin/cms/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(t("admin.cms.deleted"));
      loadContent();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    }
  }

  const filtered = content.filter((c) => {
    const matchesSearch =
      c.key.toLowerCase().includes(search.toLowerCase()) ||
      c.value.toLowerCase().includes(search.toLowerCase());
    const matchesActive = showInactive || c.isActive;
    return matchesSearch && matchesActive;
  });

  return (
    <AdminPage
      titleKey="admin.cms.title"
      descriptionKey="admin.cms.description"
      icon={FileText}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-[var(--rowi-card)] border border-[var(--rowi-border)]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-[var(--rowi-card)] border border-[var(--rowi-border)]"
          >
            <option value="">{t("admin.cms.allLanguages")}</option>
            <option value="es">Español</option>
            <option value="en">English</option>
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
          </button>
          <AdminButton
            variant="secondary"
            icon={RefreshCcw}
            onClick={loadContent}
            size="sm"
          >
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton icon={PlusCircle} onClick={openCreate} size="sm">
            {t("admin.cms.new")}
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
              {editor.mode === "create"
                ? t("admin.cms.new")
                : t("admin.cms.edit")}
            </h3>
          </div>

          {/* Key & Language */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <AdminInput
              placeholderKey="admin.cms.key"
              value={editor.key}
              onChange={(v) => setEditor({ ...editor, key: v })}
            />
            <select
              value={editor.language}
              onChange={(e) =>
                setEditor({ ...editor, language: e.target.value })
              }
              className="px-4 py-2 rounded-lg bg-[var(--rowi-card)] border border-[var(--rowi-border)]"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
            <select
              value={editor.valueType}
              onChange={(e) =>
                setEditor({ ...editor, valueType: e.target.value })
              }
              className="px-4 py-2 rounded-lg bg-[var(--rowi-card)] border border-[var(--rowi-border)]"
            >
              {VALUE_TYPES.map((vt) => (
                <option key={vt.value} value={vt.value}>
                  {vt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <AdminInput
              placeholderKey="admin.cms.category"
              value={editor.category}
              onChange={(v) => setEditor({ ...editor, category: v })}
            />
            <AdminInput
              placeholderKey="admin.cms.subcategory"
              value={editor.subcategory}
              onChange={(v) => setEditor({ ...editor, subcategory: v })}
            />
          </div>

          {/* Value */}
          <div className="mb-4">
            <label className="block text-sm text-[var(--rowi-muted)] mb-2">
              {t("admin.cms.value")}
            </label>
            <textarea
              value={editor.value}
              onChange={(e) => setEditor({ ...editor, value: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-[var(--rowi-card)] border border-[var(--rowi-border)] focus:border-[var(--rowi-primary)] focus:outline-none font-mono text-sm"
              placeholder={t("admin.cms.valuePlaceholder")}
            />
          </div>

          {/* Description & Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <AdminInput
              placeholderKey="admin.cms.descriptionField"
              value={editor.description}
              onChange={(v) => setEditor({ ...editor, description: v })}
            />
            <AdminInput
              placeholderKey="admin.cms.placeholder"
              value={editor.placeholder}
              onChange={(v) => setEditor({ ...editor, placeholder: v })}
            />
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setEditor({ ...editor, isActive: !editor.isActive })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                editor.isActive
                  ? "bg-[var(--rowi-primary)]/10 border-[var(--rowi-primary)] text-[var(--rowi-primary)]"
                  : "bg-[var(--rowi-background)] border-[var(--rowi-border)] text-[var(--rowi-muted)]"
              }`}
            >
              {editor.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {t("admin.cms.isActive")}
              {editor.isActive && <Check className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex justify-end gap-3">
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

      {/* Category Summary */}
      {!filterCategory && Object.keys(byCategory).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(byCategory).map(([cat, items]) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--rowi-card)] border border-[var(--rowi-border)] text-xs hover:border-[var(--rowi-primary)] transition-colors"
            >
              <FolderOpen className="w-3 h-3" />
              <span className="font-medium">{cat || "general"}</span>
              <span className="text-[var(--rowi-muted)]">{items.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content List */}
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={FileText}
          titleKey="admin.cms.noContent"
          descriptionKey="admin.cms.description"
        />
      ) : (
        <AdminList>
          {filtered.map((item) => (
            <AdminListItem
              key={item.id}
              icon={FileText}
              title={
                <span className="flex items-center gap-2">
                  <code className="text-xs bg-[var(--rowi-muted)]/10 px-2 py-0.5 rounded">
                    {item.key}
                  </code>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] uppercase">
                    {item.language}
                  </span>
                  {!item.isActive && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-500">
                      {t("admin.cms.inactive")}
                    </span>
                  )}
                </span>
              }
              subtitle={
                <span className="line-clamp-1">
                  {item.value.substring(0, 100)}
                  {item.value.length > 100 ? "..." : ""}
                </span>
              }
              badge={
                item.category && (
                  <AdminBadge variant="info">{item.category}</AdminBadge>
                )
              }
              actions={
                <>
                  <AdminIconButton
                    icon={Copy}
                    onClick={() =>
                      duplicateForLanguage(
                        item,
                        item.language === "es" ? "en" : "es"
                      )
                    }
                    title={t("admin.cms.duplicateForLanguage")}
                  />
                  <AdminIconButton
                    icon={Pencil}
                    onClick={() => openEdit(item)}
                    title={t("admin.common.edit")}
                  />
                  <AdminIconButton
                    icon={Trash2}
                    variant="danger"
                    onClick={() => deleteContent(item.id)}
                    title={t("admin.common.delete")}
                  />
                </>
              }
            />
          ))}
        </AdminList>
      )}
    </AdminPage>
  );
}
