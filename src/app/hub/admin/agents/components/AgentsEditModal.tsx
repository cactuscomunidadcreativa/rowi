// src/app/hub/admin/agents/components/AgentsEditModal.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function AgentsEditModal({ agent, tenants, superHubs, orgs, onClose }: any) {
  const [scope, setScope] = useState("tenant");
  const [prompt, setPrompt] = useState(agent.prompt || "");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(agent.tenantId || "");

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/agents/prompt", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: agent.slug,
          prompt,
          tenantId: scope === "tenant" ? selected : null,
          superHubId: scope === "superhub" ? selected : null,
          organizationId: scope === "org" ? selected : null,
        }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      toast.success(j.message);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const options =
    scope === "tenant"
      ? tenants
      : scope === "superhub"
      ? superHubs
      : orgs;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">
        ✏️ Editar agente: {agent.name}
      </h2>

      {/* Nivel jerárquico */}
      <div className="flex gap-3">
        <select
          className="border rounded-md px-2 py-1 text-sm"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value="tenant">Tenant</option>
          <option value="superhub">SuperHub</option>
          <option value="org">Organización</option>
        </select>

        <select
          className="border rounded-md px-2 py-1 text-sm flex-1"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {options.map((o: any) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt editor */}
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Escribe o personaliza el prompt aquí..."
        className="h-60 text-sm font-mono"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onClose} variant="outline">
          Cancelar
        </Button>
        <Button onClick={saveChanges} disabled={saving} className="gap-1">
          <Save className="w-4 h-4" /> Guardar
        </Button>
      </div>
    </div>
  );
}