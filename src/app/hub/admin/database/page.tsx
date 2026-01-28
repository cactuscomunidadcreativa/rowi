"use client";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Loader2, Database } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DatabasePage() {
  const { data, error } = useSWR("/api/hub/database", fetcher);

  if (error)
    return <div className="p-6 text-red-500">Error cargando datos</div>;

  if (!data)
    return (
      <div className="flex items-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando tablas...
      </div>
    );

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Database className="h-6 w-6 text-rowi-blueDay" /> Base de Datos Global
      </h1>
      <p className="text-sm text-muted-foreground">
        Vista consolidada del ecosistema Rowi (Tenants, Usuarios, Agentes, EQ, etc).
      </p>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(data).map(([table, count]) => (
          <Card
            key={table}
            className="p-4 bg-white dark:bg-gray-800 border border-rowi-blueDay/20 shadow-rowi hover:shadow-lg transition"
          >
            <h3 className="font-semibold text-rowi-blueDay">{table}</h3>
            <p className="text-3xl font-bold">{count}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}