"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Loader2,
  Save,
  X,
  ShieldCheck,
  Layers,
  Users,
  Cpu,
  Building2,
  Brain,
  ActivitySquare,
  Sparkles,
  Clock4,
} from "lucide-react";
import { toast } from "sonner";

/* =========================================================
   🧠 UserInspector — Panel completo con Insights y Actividad
========================================================= */
export default function UserInspector({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [user, setUser] = useState<any | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>({ usage: [], analytics: {} });
  const [activity, setActivity] = useState<any[]>([]);
  const [affinity, setAffinity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* =========================================================
     🔁 Cargar información del usuario y sus relaciones
  ========================================================== */
  async function loadUser() {
    try {
      const [
        userRes,
        tenantsRes,
        hubsRes,
        orgsRes,
        usageRes,
        logsRes,
        affinityRes,
      ] = await Promise.all([
        fetch(`/api/admin/users/${userId}/full`),
        fetch("/api/hub/tenants"),
        fetch("/api/hub/hubs"),
        fetch("/api/hub/organizations"),
        fetch(`/api/admin/users/${userId}/usage`),
        fetch(`/api/admin/users/${userId}/activity`),
        fetch(`/api/admin/users/${userId}/affinity`),
      ]);

      const [
        userData,
        tenantsData,
        hubsData,
        orgsData,
        usageData,
        logsData,
        affinityData,
      ] = await Promise.all([
        userRes.json(),
        tenantsRes.json(),
        hubsRes.json(),
        orgsRes.json(),
        usageRes.json(),
        logsRes.json(),
        affinityRes.json(),
      ]);

      setUser(userData.user);
      setTenants(tenantsData.tenants || []);
      setHubs(hubsData.hubs || []);
      setOrgs(orgsData.organizations || []);
      setUsage(usageData || { usage: [], analytics: {} });
      setActivity(logsData.logs || []);
      setAffinity(affinityData.snapshots || []);
    } catch (e: any) {
      console.error(e);
      toast.error("Error cargando datos del usuario");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, [userId]);

  /* =========================================================
     💾 Guardar cambios básicos del usuario
  ========================================================== */
  async function saveUser() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success("✅ Usuario actualizado correctamente");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     🌀 Loading + Error
  ========================================================== */
  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <Card className="p-6 bg-white dark:bg-zinc-900 flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>Cargando usuario...</p>
        </Card>
      </div>
    );

  if (!user) return null;

  /* =========================================================
     🎨 Render principal
  ========================================================== */
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <Card className="bg-white dark:bg-zinc-900 p-6 w-[950px] h-[90vh] overflow-y-auto shadow-2xl rounded-lg space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />{" "}
            {user.name || "Usuario"}
          </h1>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" /> Cerrar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid grid-cols-4 mb-3">
            <TabsTrigger value="info">👤 Info</TabsTrigger>
            <TabsTrigger value="structure">🧱 Estructura</TabsTrigger>
            <TabsTrigger value="roles">💼 Roles & Planes</TabsTrigger>
            <TabsTrigger value="activity">📊 Actividad & Insights</TabsTrigger>
          </TabsList>

          {/* TAB 1 - Info */}
          <TabsContent value="info" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <input
                  value={user.email || ""}
                  className="w-full border rounded-md px-2 h-8"
                  onChange={(e) =>
                    setUser({ ...user, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Rol global</label>
                <select
                  value={user.organizationRole || ""}
                  onChange={(e) =>
                    setUser({
                      ...user,
                      organizationRole: e.target.value,
                    })
                  }
                  className="w-full border rounded-md h-8"
                >
                  {["SUPERADMIN", "ADMIN", "MANAGER", "EDITOR", "VIEWER"].map(
                    (r) => (
                      <option key={r}>{r}</option>
                    )
                  )}
                </select>
              </div>
            </div>
            <div className="flex justify-between text-sm pt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!user.allowAI}
                  onChange={(e) =>
                    setUser({ ...user, allowAI: e.target.checked })
                  }
                />
                IA habilitada
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!user.active}
                  onChange={(e) =>
                    setUser({ ...user, active: e.target.checked })
                  }
                />
                Activo
              </label>
            </div>
          </TabsContent>

          {/* TAB 2 - Estructura */}
          <TabsContent value="structure" className="space-y-5">
            <StructureSection
              title="Tenants"
              icon={Building2}
              items={user.memberships || []}
              all={tenants}
            />
            <StructureSection
              title="Hubs"
              icon={Layers}
              items={user.hubMemberships || []}
              all={hubs}
            />
            <StructureSection
              title="Organizaciones"
              icon={Users}
              items={user.orgMemberships || []}
              all={orgs}
            />
          </TabsContent>

          {/* TAB 3 - Roles & Planes */}
          <TabsContent value="roles" className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
                <Cpu className="w-4 h-4 text-blue-500" /> Plan actual
              </h3>
              <p className="text-xs">
                {user.plan?.name || "—"} —{" "}
                {user.plan?.priceUsd
                  ? `$${user.plan.priceUsd}`
                  : "sin costo asignado"}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
                <Brain className="w-4 h-4 text-blue-500" /> Consumo IA
              </h3>
              {usage.usage?.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Sin registros de uso IA
                </p>
              ) : (
                <ul className="text-xs space-y-1">
                  {usage.usage.map((u: any) => (
                    <li key={u.id}>
                      {u.feature || "General"} —{" "}
                      {u.tokensInput + u.tokensOutput} tokens
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          {/* TAB 4 - Actividad & Insights */}
          <TabsContent value="activity" className="space-y-4">
            {/* === Mini Dashboard de IA === */}
            {usage.analytics && (
              <div className="grid sm:grid-cols-4 gap-3 mb-4">
                <Card className="p-3 text-center border bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-xs text-gray-500">Tokens totales</p>
                  <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {usage.analytics.totalTokens?.toLocaleString() || 0}
                  </p>
                </Card>
                <Card className="p-3 text-center border bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-xs text-gray-500">Sesiones IA</p>
                  <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                    {usage.analytics.totalSessions || 0}
                  </p>
                </Card>
                <Card className="p-3 text-center border bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-xs text-gray-500">Agente más usado</p>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {usage.analytics.mostUsedFeature || "—"}
                  </p>
                </Card>
                <Card className="p-3 text-center border bg-orange-50 dark:bg-orange-900/20">
                  <p className="text-xs text-gray-500">Último uso</p>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                    {usage.analytics.lastUsage
                      ? new Date(
                          usage.analytics.lastUsage
                        ).toLocaleDateString()
                      : "—"}
                  </p>
                </Card>
              </div>
            )}

            <ActivitySection
              icon={ActivitySquare}
              title="Acciones recientes"
              data={activity}
            />
            <ActivitySection
              icon={Sparkles}
              title="Afinidad emocional"
              data={affinity}
            />
            <ActivitySection
              icon={Clock4}
              title="Consumo IA (histórico)"
              data={usage.usage || []}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="pt-4 border-t flex justify-end">
          <Button onClick={saveUser} disabled={saving} className="gap-1">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{" "}
            Guardar cambios
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* === SUBCOMPONENTES === */

function StructureSection({ title, icon: Icon, items, all }: any) {
  return (
    <section>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm flex items-center gap-1">
          <Icon className="w-4 h-4 text-blue-500" /> {title} vinculados
        </h3>
      </div>
      <ul className="text-xs mt-2 space-y-1">
        {items.length === 0 ? (
          <li className="text-gray-400">Sin {title.toLowerCase()} asignados</li>
        ) : (
          items.map((m: any) => (
            <li key={m.id} className="flex justify-between border-b py-1">
              {m.name || m.tenant?.name || m.hub?.name || m.organization?.name}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function ActivitySection({ icon: Icon, title, data }: any) {
  return (
    <section>
      <h3 className="font-semibold text-sm flex items-center gap-1 mb-1">
        <Icon className="w-4 h-4 text-blue-500" /> {title}
      </h3>
      {data.length === 0 ? (
        <p className="text-xs text-gray-400">No hay registros.</p>
      ) : (
        <ul className="text-xs space-y-1 max-h-48 overflow-y-auto border p-2 rounded-md bg-gray-50 dark:bg-zinc-800">
          {data.map((d: any, i: number) => (
            <li key={i}>
              {d.message || d.feature || d.action || "Evento registrado"} —{" "}
              <span className="text-gray-500">
                {new Date(d.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}