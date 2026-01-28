"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, BarChart3, Cpu, Database } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports", { cache: "no-store" });
      const j = await res.json();
      setData(j);
    } catch {
      toast.error("Error cargando reportes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Cargando reportes...
      </div>
    );

  if (!data?.ok)
    return (
      <div className="text-center text-muted-foreground mt-10">
        ❌ Error al obtener datos
      </div>
    );

  const { totals, byTenant } = data;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">📊 Reportes del Sistema</h1>
      <p className="text-sm text-muted-foreground">
        Resumen global de actividad, uso de IA y agentes por Tenant.
      </p>

      {/* Métricas Globales */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col items-center">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <p className="text-lg font-bold">{totals.tenants}</p>
          <p className="text-xs text-muted-foreground">Tenants Totales</p>
        </Card>

        <Card className="p-4 flex flex-col items-center">
          <Cpu className="w-6 h-6 text-green-500" />
          <p className="text-lg font-bold">
            {totals.activeAgents}/{totals.totalAgents}
          </p>
          <p className="text-xs text-muted-foreground">Agentes Activos</p>
        </Card>

        <Card className="p-4 flex flex-col items-center">
          <Database className="w-6 h-6 text-purple-500" />
          <p className="text-lg font-bold">{totals.tokensUsed.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Tokens Usados</p>
        </Card>
      </div>

      {/* Tabla de Tenants */}
      <Card className="p-4">
        <table className="w-full text-sm border-collapse">
          <thead className="text-left border-b text-gray-600">
            <tr>
              <th>Tenant</th>
              <th>Agentes Totales</th>
              <th>Activos</th>
              <th>Inactivos</th>
              <th>Usuarios</th>
              <th>Tokens Usados</th>
            </tr>
          </thead>
          <tbody>
            {byTenant.map((t: any) => (
              <tr key={t.id} className="border-b last:border-0">
                <td>{t.name}</td>
                <td>{t.totalAgents}</td>
                <td className="text-green-600 font-medium">{t.activeAgents}</td>
                <td className="text-red-500 font-medium">{t.inactiveAgents}</td>
                <td>{t.users}</td>
                <td>{t.tokensUsed.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  );
}