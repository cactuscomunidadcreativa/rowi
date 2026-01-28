// src/app/hub/ai/prompts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Eye,
  EyeOff,
  Pencil,
  Save,
  RefreshCcw,
  Layers,
  Globe2,
  Building2,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";

/* =========================================================
   🌐 Panel de Prompts IA — Rowi Prompt Manager
   ---------------------------------------------------------
   Muestra todos los prompts jerárquicos (Global, Tenant, SuperHub, Org)
   y permite editarlos directamente.
========================================================= */

export default function PromptsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadPrompts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prompts", { cache: "no-store" });
      const data = await res.json();
      setAgents(Array.isArray(data.agents) ? data.agents : []);
    } catch (err) {
      console.error(err);
      toast.error("Error cargando prompts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrompts();
  }, []);

  const filtered = agents.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.slug?.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================================================
     💾 Guardar cambios (update prompt)
  ========================================================= */
  async function savePrompt() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editing.slug,
          prompt: editing.prompt,
          tenantId: editing.tenantId,
          superHubId: editing.superHubId,
          organizationId: editing.organizationId,
        }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      toast.success(j.message);
      setEditing(null);
      loadPrompts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">🧠 Panel de Prompts IA</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona y personaliza los prompts de los agentes según el nivel jerárquico.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar agente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
          <Button onClick={loadPrompts} className="gap-1">
            <RefreshCcw className="w-4 h-4" /> Refrescar
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando prompts...
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No se encontraron prompts.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const nivel = a.tenant
              ? { label: `🧱 Tenant: ${a.tenant.name}`, icon: <Building2 className="w-4 h-4" /> }
              : a.superHub
              ? { label: `🏛 SuperHub: ${a.superHub.name}`, icon: <Landmark className="w-4 h-4" /> }
              : a.organization
              ? { label: `🏢 Org: ${a.organization.name}`, icon: <Layers className="w-4 h-4" /> }
              : { label: "🌐 Global", icon: <Globe2 className="w-4 h-4" /> };

            const isExpanded = expanded[a.id];
            const promptText =
              a.prompt?.trim() || "— (sin prompt definido o aún no sincronizado)";

            return (
              <Card
                key={a.id}
                className="p-4 border border-border shadow-sm bg-white dark:bg-zinc-900 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg text-rowi-blueDay">
                      {a.name}
                    </h2>
                    <span className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
                      {nivel.icon}
                      {nivel.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Modelo: <strong>{a.model || "—"}</strong> · Tipo:{" "}
                    <span className="uppercase">{a.type}</span>
                  </p>
                </div>

                {/* Prompt Section */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-[11px] text-muted-foreground">
                      Prompt:
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs gap-1"
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [a.id]: !prev[a.id],
                          }))
                        }
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className="w-3 h-3" /> Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Ver
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() => setEditing(a)}
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </Button>
                    </div>
                  </div>

                  <div
                    className={`rounded-lg border bg-gray-50 dark:bg-zinc-800 text-xs text-gray-700 dark:text-gray-300 p-3 transition-all duration-500 ${
                      isExpanded ? "max-h-80 overflow-y-auto" : "max-h-14 overflow-hidden"
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-mono text-[11px]">
                      {promptText}
                    </pre>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 🧩 Modal de edición */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="p-6 w-full max-w-2xl bg-white dark:bg-zinc-900 border shadow-lg space-y-3">
            <h2 className="text-lg font-semibold">✏️ Editar prompt</h2>
            <p className="text-sm text-muted-foreground">
              {editing.name} — {editing.tenant?.name || "Global"}
            </p>
            <Textarea
              value={editing.prompt || ""}
              onChange={(e) => setEditing({ ...editing, prompt: e.target.value })}
              className="h-64 text-sm font-mono"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button onClick={savePrompt} disabled={saving} className="gap-1">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}