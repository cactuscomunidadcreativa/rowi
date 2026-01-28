"use client";

/**
 * =========================================================
 * 📊 /hub/admin/communities/summary
 * ---------------------------------------------------------
 * Dashboard global de comunidades con métricas y tabla:
 *  - Total de comunidades y miembros
 *  - Activos en RowiVerse
 *  - Sincronización rápida con spinner
 * =========================================================
 */

import { useEffect, useState } from "react";
import { RefreshCcw, Users, Brain, Globe } from "lucide-react";

interface Community {
  id: string;
  name: string;
}

export default function CommunitiesSummaryPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [totalCommunities, setTotalCommunities] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeRowiUsers, setActiveRowiUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  /* =========================================================
     🔹 Cargar comunidades y miembros
  ========================================================== */
  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        const res = await fetch("/api/hub/communities");
        const data = await res.json();
        if (!Array.isArray(data)) return;

        setCommunities(data);
        setTotalCommunities(data.length);

        // ⚙️ Carga paralela de miembros
        const results = await Promise.all(
          data.map(async (c: Community) => {
            const resM = await fetch(`/api/hub/communities/${c.id}/members`);
            const members = await resM.json();
            return {
              id: c.id,
              name: c.name,
              members: members.length,
              rowi: members.filter((m: any) => m.user?.allowAI || m.user?.active)
                .length,
            };
          })
        );

        const totalM = results.reduce((acc, c) => acc + c.members, 0);
        const totalRowi = results.reduce((acc, c) => acc + c.rowi, 0);

        setTotalMembers(totalM);
        setActiveRowiUsers(totalRowi);
        setCommunities(results);
      } catch (err) {
        console.error("❌ Error cargando resumen:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  /* =========================================================
     🔄 Sincronizar usuarios Rowi
  ========================================================== */
  async function handleSync() {
    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/hub/maintenance/sync-users", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage("⚠️ Error al sincronizar usuarios.");
      }
    } catch {
      setMessage("❌ Error de conexión con el servidor.");
    } finally {
      setSyncing(false);
    }
  }

  /* =========================================================
     🧭 Render principal
  ========================================================== */
  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-6xl mx-auto">
      {/* ENCABEZADO */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-rowi-blueDay">
          Resumen de Comunidades
        </h1>

        <button
          onClick={handleSync}
          disabled={syncing}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white ${
            syncing
              ? "bg-gray-400"
              : "bg-rowi-blueDay hover:bg-rowi-pinkDay transition-colors"
          }`}
        >
          <RefreshCcw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar Usuarios Rowi"}
        </button>
      </div>

      {message && (
        <div className="text-sm mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md border text-gray-700 dark:text-gray-300">
          {message}
        </div>
      )}

      {/* ESTADÍSTICAS PRINCIPALES */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando información...</p>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-5">
            <StatCard
              icon={<Globe className="w-6 h-6 text-blue-500" />}
              label="Comunidades Totales"
              value={totalCommunities}
            />
            <StatCard
              icon={<Users className="w-6 h-6 text-pink-500" />}
              label="Miembros Totales"
              value={totalMembers}
            />
            <StatCard
              icon={<Brain className="w-6 h-6 text-green-500" />}
              label="Usuarios Rowi Activos"
              value={activeRowiUsers}
            />
          </div>

          {/* TABLA */}
          <div className="mt-10 overflow-x-auto rounded-lg border border-gray-200 shadow-md bg-white dark:bg-gray-900/40">
            <table className="min-w-full text-sm text-gray-700 dark:text-gray-200">
              <thead className="bg-rowi-blueDay/10 text-rowi-blueDay uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Comunidad</th>
                  <th className="px-4 py-3 text-left">Miembros</th>
                  <th className="px-4 py-3 text-left">Usuarios Rowi</th>
                </tr>
              </thead>
              <tbody>
                {communities.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t hover:bg-rowi-blueDay/5 transition-colors"
                  >
                    <td className="px-4 py-2 font-medium">{c.name}</td>
                    <td className="px-4 py-2">{(c as any).members ?? 0}</td>
                    <td className="px-4 py-2 text-green-600 font-semibold">
                      {(c as any).rowi ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   🔹 Tarjeta de estadística
========================================================= */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="p-5 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
      <div className="p-3 bg-rowi-blueDay/10 rounded-full">{icon}</div>
      <div>
        <h2 className="text-sm font-medium text-gray-500">{label}</h2>
        <p className="text-3xl font-bold text-rowi-blueDay mt-1">{value}</p>
      </div>
    </div>
  );
}