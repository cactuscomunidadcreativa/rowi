// src/app/hub/ai/rowi-coach/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function RowiCoachPage() {
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadAgent() {
    try {
      const res = await fetch("/api/admin/agents/rowi-coach");
      const data = await res.json();
      if (data.ok) setAgent(data.agent);
      else toast.error(data.error);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar agente");
    } finally {
      setLoading(false);
    }
  }

  async function saveAgent() {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/agents/rowi-coach", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
      });
      const data = await res.json();
      if (data.ok) toast.success("Agente actualizado ✅");
      else toast.error(data.error);
    } catch (err) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadAgent();
  }, []);

  if (loading)
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando Rowi Coach...
      </div>
    );

  if (!agent)
    return (
      <div className="p-6 text-red-500 font-medium">
        ⚠️ Agente "rowi-coach" no encontrado.
      </div>
    );

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">🧠 Rowi Coach</h1>
      <p className="text-sm text-muted-foreground">
        Panel de configuración del agente base de coaching emocional.
      </p>

      <Card className="p-4 space-y-3">
        <div>
          <label className="text-xs font-medium">Nombre</label>
          <Input
            value={agent.name}
            onChange={(e) => setAgent({ ...agent, name: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-medium">Modelo</label>
          <Input
            value={agent.model || ""}
            onChange={(e) => setAgent({ ...agent, model: e.target.value })}
            placeholder="gpt-4o-mini"
          />
        </div>

        <div>
          <label className="text-xs font-medium">Descripción</label>
          <Textarea
            value={agent.description || ""}
            onChange={(e) => setAgent({ ...agent, description: e.target.value })}
            rows={2}
          />
        </div>

        <div>
          <label className="text-xs font-medium">Prompt principal</label>
          <Textarea
            value={agent.prompt || ""}
            onChange={(e) => setAgent({ ...agent, prompt: e.target.value })}
            rows={10}
            className="font-mono text-xs"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={saveAgent}
            disabled={saving}
            className="gap-1 text-sm px-3"
          >
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
    </main>
  );
}