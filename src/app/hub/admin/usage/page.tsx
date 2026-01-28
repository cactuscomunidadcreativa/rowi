"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function UsageSummaryPage() {
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/hub/usage/summary");
    const j = await res.json();
    if (j.ok) {
      setData(j.data);
      setTotals(j.totals);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // 🔁 cada 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">📊 Uso de Agentes IA (hoy)</h1>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando datos...
        </div>
      ) : (
        <>
          {totals && (
            <Card className="p-4 bg-gradient-to-r from-rowi-blueDay/10 to-rowi-pinkDay/10">
              <div className="text-sm">
                <strong>Total Tokens In:</strong> {totals.tokensIn.toLocaleString()} &nbsp;|&nbsp;
                <strong>Out:</strong> {totals.tokensOut.toLocaleString()} &nbsp;|&nbsp;
                <strong>Llamadas:</strong> {totals.calls.toLocaleString()} &nbsp;|&nbsp;
                <strong>Costo:</strong> ${Number(totals.cost || 0).toFixed(4)}
              </div>
            </Card>
          )}

          <div className="overflow-x-auto border rounded-xl bg-white/70 dark:bg-gray-900/60">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                  <th className="px-4 py-2 text-left">Agente</th>
                  <th className="px-4 py-2 text-left">Tenant</th>
                  <th className="px-4 py-2 text-right">Tokens In</th>
                  <th className="px-4 py-2 text-right">Tokens Out</th>
                  <th className="px-4 py-2 text-right">Llamadas</th>
                  <th className="px-4 py-2 text-right">Costo</th>
                  <th className="px-4 py-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-4 py-2">{d.feature}</td>
                    <td className="px-4 py-2">{d.tenant}</td>
                    <td className="px-4 py-2 text-right">{d.tokensIn}</td>
                    <td className="px-4 py-2 text-right">{d.tokensOut}</td>
                    <td className="px-4 py-2 text-right">{d.calls}</td>
                    <td className="px-4 py-2 text-right">
                      ${Number(d.cost || 0).toFixed(4)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          d.active
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {d.active ? "Activo" : "Apagado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}