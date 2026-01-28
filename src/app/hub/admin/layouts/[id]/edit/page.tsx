"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Sortable from "sortablejs";
import {
  Loader2,
  Save,
  ArrowLeft,
  Plus,
  LayoutTemplate,
  X,
  Trash2,
  Eye,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

/* =========================================================
   🧱 Layout Visual Builder — v4.1
   ---------------------------------------------------------
   - Edición completa del layout
   - Zonas dinámicas (header, main, footer + custom)
   - Drag & drop real con SortableJS
   - Vista previa HTML en vivo
========================================================= */

// 🧩 Asegura una estructura válida
function normalizeLayout(layout: any) {
  const zones = layout?.structure?.zones || layout?.structure || {};
  return {
    ...layout,
    structure: {
      zones: {
        header: zones.header || { components: [] },
        main: zones.main || { components: [] },
        footer: zones.footer || { components: [] },
        ...Object.fromEntries(
          Object.entries(zones)
            .filter(([k]) => !["header", "main", "footer"].includes(k))
            .map(([k, v]) => [k, v || { components: [] }])
        ),
      },
    },
  };
}

export default function EditLayoutPage() {
  const router = useRouter();
  const { id } = useParams();
  const [layout, setLayout] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newZone, setNewZone] = useState("");
  const [previewHTML, setPreviewHTML] = useState<string>("");

  const dropRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const catalog = [
    "NavBar",
    "Hero",
    "FeatureList",
    "ChartCard",
    "CTASection",
    "FooterLinks",
  ];

  /* =========================================================
     🔁 Cargar layout por ID
  ========================================================== */
  async function loadLayout() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/layouts/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error al cargar layout");
      setLayout(normalizeLayout(data.layout));
    } catch (err: any) {
      toast.error(err.message || "Error al cargar layout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadLayout();
  }, [id]);

  /* =========================================================
     🧲 Inicializar SortableJS (drag & drop)
  ========================================================== */
  useEffect(() => {
    if (!layout?.structure?.zones) return;

    Object.keys(layout.structure.zones).forEach((zone) => {
      const container = dropRefs.current[zone];
      if (container && !container.dataset.sortableAttached) {
        Sortable.create(container, {
          animation: 150,
          ghostClass: "sortable-ghost",
          dragClass: "opacity-70",
          onEnd: (evt) => {
            const zones = { ...layout.structure.zones };
            const moved = zones[zone].components.splice(evt.oldIndex!, 1)[0];
            zones[zone].components.splice(evt.newIndex!, 0, moved);
            setLayout({ ...layout, structure: { zones } });
          },
        });
        container.dataset.sortableAttached = "true";
      }
    });
  }, [layout]);

  /* =========================================================
     ➕ Agregar componente / zona
  ========================================================== */
  function addComponent(zone: string, comp: string) {
    const zones = { ...layout.structure.zones };
    if (!zones[zone]) zones[zone] = { components: [] };
    if (!Array.isArray(zones[zone].components)) zones[zone].components = [];
    zones[zone].components.push(comp);
    setLayout({ ...layout, structure: { zones } });
  }

  function addZone() {
    if (!newZone.trim()) return toast.warning("Ingresa un nombre para la zona");
    const zoneKey = newZone.trim().replace(/\s+/g, "_").toLowerCase();
    const zones = { ...layout.structure.zones };
    if (zones[zoneKey]) return toast.error("Ya existe esa zona");
    zones[zoneKey] = { components: [] };
    setLayout({ ...layout, structure: { zones } });
    setNewZone("");
    toast.success(`🧩 Zona "${zoneKey}" agregada`);
  }

  function removeZone(zoneKey: string) {
    const zones = { ...layout.structure.zones };
    if (["header", "main", "footer"].includes(zoneKey))
      return toast.error("No puedes eliminar zonas base");
    delete zones[zoneKey];
    setLayout({ ...layout, structure: { zones } });
  }

  /* =========================================================
     💾 Guardar layout
  ========================================================== */
  async function save() {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/layouts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success("✅ Layout guardado correctamente");
      router.push("/hub/admin/layouts");
    } catch (err: any) {
      toast.error(err.message || "Error guardando layout");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     👁️ Generar preview HTML dinámico
  ========================================================== */
  useEffect(() => {
    if (!layout?.structure?.zones) return;
    const html = Object.entries(layout.structure.zones)
      .map(
        ([zone, data]: any) =>
          `<section style="padding:10px;border-bottom:1px solid #ddd;">
            <h3 style="font-size:11px;color:#555;text-transform:uppercase;margin-bottom:4px">${zone}</h3>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${(data.components || [])
                .map(
                  (c: string) =>
                    `<div style="padding:6px 8px;background:#eaf3ff;color:#0a3a75;border:1px solid #b3d1ff;border-radius:4px;font-size:11px;">${c}</div>`
                )
                .join("")}
            </div>
          </section>`
      )
      .join("");
    setPreviewHTML(html);
  }, [layout]);

  if (loading)
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando layout...
      </div>
    );

  const zones = layout?.structure?.zones || {};

  /* =========================================================
     🎨 Render principal
  ========================================================== */
  return (
    <main className="p-6 space-y-6 bg-gray-50 dark:bg-zinc-950 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push("/hub/admin/layouts")}>
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
          <h1 className="text-2xl font-semibold text-rowi-blueDay flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" />
            Editar Layout: {layout.name}
          </h1>
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="bg-rowi-blueDay text-white gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Guardar
            </>
          )}
        </Button>
      </div>

      {/* Info general */}
      <Card className="p-4 border border-border shadow-sm bg-white dark:bg-zinc-900">
        <Input
          placeholder="Nombre del layout"
          value={layout.name}
          onChange={(e) => setLayout({ ...layout, name: e.target.value })}
          className="mb-2"
        />
        <Textarea
          placeholder="Descripción..."
          value={layout.description || ""}
          onChange={(e) => setLayout({ ...layout, description: e.target.value })}
        />
      </Card>

      {/* Cuerpo principal */}
      <div className="grid grid-cols-4 gap-4">
        {/* 🧱 Zonas */}
        <div className="col-span-2 space-y-4">
          {Object.entries(zones).map(([zoneName, zoneData]: any) => (
            <Card key={zoneName} className="p-4 border-dashed">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold uppercase text-gray-500">
                  {zoneName}
                </h3>
                {!["header", "main", "footer"].includes(zoneName) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeZone(zoneName)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div
                ref={(el) => (dropRefs.current[zoneName] = el)}
                className="min-h-[60px] p-2 border border-gray-300 rounded flex flex-wrap gap-2 bg-gray-50 dark:bg-zinc-800"
              >
                {(zoneData.components || []).map((c: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs rounded bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 cursor-grab"
                  >
                    {c}
                  </span>
                ))}
                {(!zoneData.components || zoneData.components.length === 0) && (
                  <span className="text-[11px] text-gray-400 italic">
                    Arrastra componentes aquí
                  </span>
                )}
              </div>
            </Card>
          ))}

          {/* ➕ Agregar zona */}
          <Card className="p-4 flex items-center gap-2 border border-dashed">
            <Input
              placeholder="Nombre de nueva zona (ej: sidebar, hero, stats)"
              value={newZone}
              onChange={(e) => setNewZone(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addZone} className="gap-1 bg-rowi-blueDay text-white">
              <Plus className="w-4 h-4" /> Agregar Zona
            </Button>
          </Card>
        </div>

        {/* 📚 Catálogo */}
        <Card className="p-4 bg-white dark:bg-zinc-900 shadow-md">
          <h3 className="text-sm font-semibold mb-3">📦 Componentes</h3>
          <div className="grid grid-cols-2 gap-2">
            {catalog.map((comp) => (
              <Button
                key={comp}
                variant="outline"
                className="text-xs"
                onClick={() => addComponent("main", comp)}
              >
                <Plus className="w-3 h-3" /> {comp}
              </Button>
            ))}
          </div>
        </Card>

        {/* 👁️ Preview */}
        <Card className="p-4 bg-white dark:bg-zinc-900 shadow-md col-span-1">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <Eye className="w-4 h-4 text-blue-500" /> Vista previa
          </h3>
          <iframe
            className="w-full h-[700px] border rounded bg-white"
            srcDoc={`<html><body style="font-family:Inter, sans-serif; background:#fafafa;">${previewHTML}</body></html>`}
          />
        </Card>
      </div>
    </main>
  );
}