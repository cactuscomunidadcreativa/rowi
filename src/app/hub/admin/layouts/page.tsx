"use client";

import { useState, useEffect, useRef } from "react";
import Sortable from "sortablejs";
import { toast } from "sonner";
import {
  Blocks,
  RefreshCcw,
  Pencil,
  Trash2,
  PlusCircle,
  Layers,
  GripVertical,
  Plus,
  Minus,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminList,
  AdminListItem,
  AdminButton,
  AdminEmpty,
  AdminIconButton,
  AdminBadge,
  AdminViewToggle,
  AdminSearch,
} from "@/components/admin/AdminPage";

/* =========================================================
   🎨 Rowi Admin — Layouts
========================================================= */

interface LayoutData {
  id: string;
  name: string;
  description?: string;
  structure: {
    zones: {
      header: { components: string[] };
      main: { components: string[] };
      footer: { components: string[] };
    };
  };
}

function normalizeStructure(input: any): LayoutData["structure"] {
  try {
    if (!input || typeof input !== "object") {
      return { zones: { header: { components: [] }, main: { components: [] }, footer: { components: [] } } };
    }
    if (input.zones) {
      const z = input.zones;
      return {
        zones: {
          header: Array.isArray(z.header) ? { components: z.header } : { components: z.header?.components || [] },
          main: Array.isArray(z.main) ? { components: z.main } : { components: z.main?.components || [] },
          footer: Array.isArray(z.footer) ? { components: z.footer } : { components: z.footer?.components || [] },
        },
      };
    }
    return {
      zones: {
        header: Array.isArray(input.header) ? { components: input.header } : { components: input.header?.components || [] },
        main: Array.isArray(input.main) ? { components: input.main } : { components: input.main?.components || [] },
        footer: Array.isArray(input.footer) ? { components: input.footer } : { components: input.footer?.components || [] },
      },
    };
  } catch {
    return { zones: { header: { components: [] }, main: { components: [] }, footer: { components: [] } } };
  }
}

export default function LayoutsAdminPage() {
  const { t, ready } = useI18n();
  const [layouts, setLayouts] = useState<LayoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LayoutData | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");

  async function loadLayouts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/layouts", { cache: "no-store" });
      const data = await res.json();
      const list = Array.isArray(data.layouts) ? data.layouts : [];
      setLayouts(list.map((l: any) => ({ ...l, structure: normalizeStructure(l.structure) })));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadLayouts();
  }, [ready]);

  async function deleteLayout(id: string) {
    if (!confirm(t("admin.layouts.confirmDelete"))) return;
    try {
      await fetch("/api/admin/layouts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      toast.success(t("admin.layouts.deleted"));
      loadLayouts();
    } catch {
      toast.error(t("common.error"));
    }
  }

  const filtered = layouts.filter((l) =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPage
      titleKey="admin.layouts.title"
      descriptionKey="admin.layouts.description"
      icon={Blocks}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadLayouts} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton icon={PlusCircle} size="sm">
            {t("admin.layouts.new")}
          </AdminButton>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={Blocks}
          titleKey="admin.layouts.noLayouts"
          descriptionKey="admin.layouts.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filtered.map((layout) => {
            const total =
              (layout.structure.zones.header?.components?.length || 0) +
              (layout.structure.zones.main?.components?.length || 0) +
              (layout.structure.zones.footer?.components?.length || 0);
            return (
              <AdminListItem
                key={layout.id}
                icon={Blocks}
                title={layout.name}
                subtitle={layout.description}
                badge={<AdminBadge variant="neutral">{total} comp.</AdminBadge>}
                meta={
                  <div className="flex gap-1 text-[10px]">
                    <span className="px-1 py-0.5 bg-[var(--rowi-border)] rounded">H:{layout.structure.zones.header?.components?.length || 0}</span>
                    <span className="px-1 py-0.5 bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] rounded">M:{layout.structure.zones.main?.components?.length || 0}</span>
                    <span className="px-1 py-0.5 bg-[var(--rowi-border)] rounded">F:{layout.structure.zones.footer?.components?.length || 0}</span>
                  </div>
                }
                actions={
                  <>
                    <AdminIconButton icon={Pencil} onClick={() => setEditing({ ...layout, structure: normalizeStructure(layout.structure) })} title={t("admin.common.edit")} />
                    <AdminIconButton icon={Trash2} variant="danger" onClick={() => deleteLayout(layout.id)} title={t("admin.common.delete")} />
                  </>
                }
              />
            );
          })}
        </AdminList>
      ) : (
        <AdminGrid cols={3}>
          {filtered.map((layout) => {
            const total =
              (layout.structure.zones.header?.components?.length || 0) +
              (layout.structure.zones.main?.components?.length || 0) +
              (layout.structure.zones.footer?.components?.length || 0);
            return (
              <AdminCard key={layout.id} compact className="group">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                    <Blocks className="w-4 h-4 text-white" />
                  </div>
                  <AdminBadge variant="neutral">{total}</AdminBadge>
                </div>
                <h3 className="text-sm font-medium text-[var(--rowi-foreground)] truncate">{layout.name}</h3>
                {layout.description && (
                  <p className="text-xs text-[var(--rowi-muted)] truncate">{layout.description}</p>
                )}
                <div className="flex gap-1 mt-3 text-[10px]">
                  <span className="flex-1 text-center py-1 bg-[var(--rowi-border)] rounded">H:{layout.structure.zones.header?.components?.length || 0}</span>
                  <span className="flex-1 text-center py-1 bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] rounded font-medium">M:{layout.structure.zones.main?.components?.length || 0}</span>
                  <span className="flex-1 text-center py-1 bg-[var(--rowi-border)] rounded">F:{layout.structure.zones.footer?.components?.length || 0}</span>
                </div>
                <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-[var(--rowi-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <AdminButton variant="secondary" size="xs" icon={Pencil} onClick={() => setEditing({ ...layout, structure: normalizeStructure(layout.structure) })}>
                    {t("admin.common.edit")}
                  </AdminButton>
                  <AdminButton variant="danger" size="xs" icon={Trash2} onClick={() => deleteLayout(layout.id)}>
                    {t("admin.common.delete")}
                  </AdminButton>
                </div>
              </AdminCard>
            );
          })}
        </AdminGrid>
      )}

      {editing && (
        <LayoutEditor
          layout={editing}
          onClose={() => setEditing(null)}
          onSaved={loadLayouts}
        />
      )}
    </AdminPage>
  );
}

/* =========================================================
   🧱 LayoutEditor — Drag & Drop Editor
========================================================= */

function LayoutEditor({
  layout,
  onClose,
  onSaved,
}: {
  layout: LayoutData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState(layout);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<string[]>([]);
  const dropRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  async function loadCatalog() {
    try {
      const res = await fetch(`/api/admin/components?flat=1&search=${query}`);
      const data = await res.json();
      const comps = (data.components || []).map((c: any) => c.name);
      setCatalog(comps.slice(0, 25));
    } catch {
      toast.error(t("common.error"));
    }
  }

  useEffect(() => {
    Object.keys(form.structure.zones).forEach((zone) => {
      const container = dropRefs.current[zone];
      if (container && !container.dataset.sortableAttached) {
        Sortable.create(container, {
          group: "zones",
          animation: 150,
          ghostClass: "opacity-50",
          handle: ".drag-handle",
          onEnd: (evt) => {
            const from = (evt.from as HTMLElement).dataset.zone!;
            const to = (evt.to as HTMLElement).dataset.zone!;
            const updated = { ...form.structure.zones };
            const [moved] = updated[from as keyof typeof updated].components.splice(evt.oldIndex!, 1);
            updated[to as keyof typeof updated].components.splice(evt.newIndex!, 0, moved);
            setForm({ ...form, structure: { zones: updated } });
          },
        });
        container.dataset.sortableAttached = "true";
      }
    });
  }, [form.structure]);

  function addComponent(zone: string, comp: string) {
    const updated = { ...form.structure.zones };
    const zoneData = updated[zone as keyof typeof updated];
    if (!zoneData.components) zoneData.components = [];
    zoneData.components.push(comp);
    setForm({ ...form, structure: { zones: updated } });
  }

  function removeComponent(zone: string, index: number) {
    const updated = { ...form.structure.zones };
    updated[zone as keyof typeof updated].components.splice(index, 1);
    setForm({ ...form, structure: { zones: updated } });
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/layouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      toast.success(t("admin.layouts.updated"));
      onClose();
      onSaved();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-[var(--rowi-surface)] rounded-xl shadow-xl border border-[var(--rowi-border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--rowi-border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--rowi-foreground)]">{form.name}</h2>
              <p className="text-xs text-[var(--rowi-muted)]">{t("admin.layouts.editDescription")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AdminButton variant="ghost" size="sm" onClick={onClose}>{t("admin.common.cancel")}</AdminButton>
            <AdminButton onClick={save} loading={saving} size="sm">{t("admin.common.save")}</AdminButton>
          </div>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-3 divide-x divide-[var(--rowi-border)]">
          {/* Zones */}
          <div className="col-span-2 p-4 overflow-y-auto bg-[var(--rowi-background)] space-y-3">
            {(["header", "main", "footer"] as const).map((zone) => (
              <div key={zone} className="bg-[var(--rowi-surface)] rounded-lg border border-[var(--rowi-border)] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-[var(--rowi-background)] border-b border-[var(--rowi-border)]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[var(--rowi-primary)]/10 flex items-center justify-center text-[10px] font-semibold text-[var(--rowi-primary)]">
                      {zone.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-[var(--rowi-foreground)]">{t(`admin.layouts.${zone}`)}</span>
                    <AdminBadge variant="neutral">{form.structure.zones[zone].components.length}</AdminBadge>
                  </div>
                  <AdminButton variant="ghost" size="xs" icon={Plus} onClick={() => addComponent(zone, "Placeholder")}>
                    {t("admin.layouts.addComponent")}
                  </AdminButton>
                </div>
                <div ref={(el) => (dropRefs.current[zone] = el)} data-zone={zone} className="min-h-[60px] p-2 space-y-1">
                  {form.structure.zones[zone].components.map((comp, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-[var(--rowi-primary)]/5 border border-[var(--rowi-primary)]/10 rounded group">
                      <GripVertical className="w-3 h-3 text-[var(--rowi-muted)] cursor-move drag-handle" />
                      <span className="flex-1 text-xs font-medium text-[var(--rowi-foreground)]">{comp}</span>
                      <button onClick={() => removeComponent(zone, i)} className="p-0.5 rounded text-[var(--rowi-muted)] hover:text-[var(--rowi-error)] hover:bg-[var(--rowi-error)]/10 opacity-0 group-hover:opacity-100 transition-all">
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {form.structure.zones[zone].components.length === 0 && (
                    <div className="flex items-center justify-center py-4 text-xs text-[var(--rowi-muted)] border border-dashed border-[var(--rowi-border)] rounded">
                      {t("admin.layouts.empty")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Catalog */}
          <div className="p-4 overflow-y-auto">
            <p className="text-xs font-medium text-[var(--rowi-muted)] uppercase tracking-wide mb-2">{t("admin.layouts.componentCatalog")}</p>
            <div className="flex gap-2 mb-3">
              <AdminSearch value={query} onChange={setQuery} className="flex-1" />
              <AdminButton variant="secondary" size="sm" onClick={loadCatalog}>{t("admin.common.search")}</AdminButton>
            </div>
            {catalog.length > 0 ? (
              <div className="space-y-1">
                {catalog.map((c) => (
                  <button key={c} onClick={() => addComponent("main", c)} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left bg-[var(--rowi-background)] hover:bg-[var(--rowi-border)] rounded truncate transition-colors group">
                    <Plus className="w-3 h-3 text-[var(--rowi-muted)] group-hover:text-[var(--rowi-primary)] transition-colors" />
                    <span className="truncate">{c}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[var(--rowi-muted)]">{t("admin.layouts.searchComponent")}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
