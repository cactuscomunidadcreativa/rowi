"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle, Building2, Landmark, Layers } from "lucide-react";
import { toast } from "sonner";

/* =========================================================
   🎯 ContextSelectorModal
   ---------------------------------------------------------
   Permite elegir visualmente el destino (Tenant, SuperHub,
   Organización) para aplicar o clonar un prompt.
========================================================= */
export default function ContextSelectorModal({
  onSelect,
  onClose,
}: {
  onSelect: (targetType: string, targetId: string, targetName: string) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [superHubs, setSuperHubs] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [view, setView] = useState<"tenants" | "superhubs" | "orgs" | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [t, s, o] = await Promise.all([
        fetch("/api/admin/tenants").then((r) => r.json()),
        fetch("/api/admin/superhubs").then((r) => r.json()),
        fetch("/api/admin/organizations").then((r) => r.json()),
      ]);
      setTenants(t || []);
      setSuperHubs(s || []);
      setOrgs(o || []);
    } catch {
      toast.error("Error cargando contextos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
        >
          <XCircle className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold">🌍 Selecciona destino del prompt</h2>
        <p className="text-sm text-muted-foreground">
          Aplica este prompt a otro nivel (Tenant, SuperHub u Organización).
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando contextos...
          </div>
        ) : !view ? (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <Button onClick={() => setView("superhubs")} className="gap-2">
              <Landmark className="w-4 h-4" /> SuperHubs
            </Button>
            <Button onClick={() => setView("tenants")} className="gap-2">
              <Building2 className="w-4 h-4" /> Tenants
            </Button>
            <Button onClick={() => setView("orgs")} className="gap-2">
              <Layers className="w-4 h-4" /> Organizaciones
            </Button>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            <Button
              variant="outline"
              className="text-xs mb-2"
              onClick={() => setView(null)}
            >
              ⬅️ Volver
            </Button>
            <h3 className="text-sm font-semibold capitalize mb-1">
              {view === "tenants"
                ? "🧱 Tenants disponibles"
                : view === "superhubs"
                ? "🏛 SuperHubs disponibles"
                : "🏢 Organizaciones disponibles"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto border rounded-md p-2 bg-gray-50 dark:bg-zinc-800">
              {(view === "tenants"
                ? tenants
                : view === "superhubs"
                ? superHubs
                : orgs
              ).map((ctx: any) => (
                <Button
                  key={ctx.id}
                  variant="ghost"
                  className="w-full justify-start text-left bg-white hover:bg-blue-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border"
                  onClick={() => {
                    onSelect(view, ctx.id, ctx.name);
                    toast.success(`✅ Seleccionado: ${ctx.name}`);
                    onClose();
                  }}
                >
                  {view === "tenants" && <Building2 className="w-4 h-4 mr-2" />}
                  {view === "superhubs" && <Landmark className="w-4 h-4 mr-2" />}
                  {view === "orgs" && <Layers className="w-4 h-4 mr-2" />}
                  {ctx.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}