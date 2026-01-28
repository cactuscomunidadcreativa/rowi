"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckSquare, Building2, Layers, Users } from "lucide-react";
import { toast } from "sonner";

export default function ImportDetailPage({ params }: any) {
  const [batch, setBatch] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [assign, setAssign] = useState({ tenantId: "", hubId: "", organizationId: "" });
  const [loading, setLoading] = useState(true);

  async function loadBatch() {
    const res = await fetch(`/api/admin/imports/${params.id}`);
    const data = await res.json();
    setBatch(data);
    setLoading(false);
  }

  useEffect(() => {
    loadBatch();
  }, []);

  async function updateAssignments() {
    const res = await fetch(`/api/admin/imports/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...assign, selectedIds: selected }),
    });
    const j = await res.json();
    if (!res.ok) return toast.error(j.error);
    toast.success(j.message);
  }

  async function processBatch() {
    const res = await fetch(`/api/admin/imports/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedIds: selected }),
    });
    const j = await res.json();
    if (!res.ok) return toast.error(j.error);
    toast.success(j.message);
  }

  if (loading)
    return (
      <div className="flex items-center justify-center text-muted-foreground p-10">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando batch...
      </div>
    );

  if (!batch) return <p className="text-center p-6">Batch no encontrado</p>;

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-rowi-blueDay" /> {batch.name}
        </h1>
        <div className="flex gap-2">
          <Button onClick={updateAssignments} variant="outline">
            Asignar
          </Button>
          <Button onClick={processBatch} className="gap-1">
            Procesar seleccionados
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <select
          className="border rounded-md p-2 text-sm"
          onChange={(e) => setAssign({ ...assign, tenantId: e.target.value })}
        >
          <option value="">🧱 Tenant</option>
          <option value="tenant1">Tenant Ejemplo</option>
        </select>

        <select
          className="border rounded-md p-2 text-sm"
          onChange={(e) => setAssign({ ...assign, hubId: e.target.value })}
        >
          <option value="">🔹 Hub</option>
          <option value="hub1">Hub Ejemplo</option>
        </select>

        <select
          className="border rounded-md p-2 text-sm"
          onChange={(e) => setAssign({ ...assign, organizationId: e.target.value })}
        >
          <option value="">🏢 Organización</option>
          <option value="org1">Org Ejemplo</option>
        </select>
      </div>

      <Card className="p-4 overflow-y-auto max-h-[70vh]">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-gray-50 dark:bg-zinc-800">
            <tr>
              <th className="p-2 text-left">Seleccionar</th>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Rol</th>
            </tr>
          </thead>
          <tbody>
            {batch.rows.map((r: any) => (
              <tr key={r.id} className="border-b hover:bg-gray-50 dark:hover:bg-zinc-900">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    onChange={(e) =>
                      setSelected((prev) =>
                        e.target.checked
                          ? [...prev, r.id]
                          : prev.filter((x) => x !== r.id)
                      )
                    }
                  />
                </td>
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.email}</td>
                <td className="p-2">{r.jobRole || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  );
}