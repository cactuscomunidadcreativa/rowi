"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  X,
  Save,
  Shield,
  Cpu,
  Building2,
  Brain,
  UserCog,
  Activity,
  LineChart,
} from "lucide-react";
import { toast } from "sonner";

export function UserDrawer({
  userId,
  onClose,
  tenants,
  plans,
}: {
  userId: string;
  onClose: () => void;
  tenants: any[];
  plans: any[];
}) {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"profile" | "activity" | "usage">("profile");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // =========================================================
  // 🔁 Cargar datos del usuario
  // =========================================================
  useEffect(() => {
    if (!userId) return;
    async function loadUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        const j = await res.json();
        if (j.ok) setUser(j.user);
        else toast.error(j.error || "Error al cargar usuario");
      } catch (e) {
        console.error("❌ Error cargando usuario:", e);
        toast.error("Error al cargar usuario");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [userId]);

  // =========================================================
  // 💾 Guardar cambios
  // =========================================================
  async function saveChanges() {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          changes: {
            name: user.name,
            email: user.email,
            organizationRole: user.organizationRole,
            planId: user.planId,
            primaryTenantId: user.primaryTenantId,
            allowAI: user.allowAI,
            active: user.active,
          },
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Error al guardar");
      toast.success("✅ Cambios guardados correctamente");
    } catch (e) {
      console.error("❌ Error guardando cambios:", e);
      toast.error("Error guardando cambios");
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // 🧠 Render principal
  // =========================================================
  return (
    <div className="fixed inset-0 bg-black/30 flex justify-end z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full sm:w-[500px] h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800 rounded-l-2xl">
        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-lg text-rowi-gradient-text">
            ✨ Editar Usuario
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              Cargando información...
            </div>
          ) : !user ? (
            <p className="text-gray-400 text-sm">Usuario no encontrado.</p>
          ) : (
            <>
              {/* Campos editables */}
              <div className="space-y-4 mt-2 text-sm">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Nombre
                  </label>
                  <input
                    className="w-full border rounded-md p-2 bg-white/80 dark:bg-gray-800/60"
                    value={user.name || ""}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Email
                  </label>
                  <input
                    className="w-full border rounded-md p-2 bg-white/80 dark:bg-gray-800/60"
                    value={user.email || ""}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Rol
                  </label>
                  <select
                    className="w-full border rounded-md p-2 bg-white/80 dark:bg-gray-800/60"
                    value={user.organizationRole || "VIEWER"}
                    onChange={(e) =>
                      setUser({ ...user, organizationRole: e.target.value })
                    }
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPERADMIN">SuperAdmin</option>
                  </select>
                </div>

                {/* Tenant y Plan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Tenant
                    </label>
                    <select
                      className="w-full border rounded-md p-2 bg-white/80 dark:bg-gray-800/60"
                      value={user.primaryTenantId || ""}
                      onChange={(e) =>
                        setUser({
                          ...user,
                          primaryTenantId: e.target.value,
                        })
                      }
                    >
                      <option value="">— Seleccionar Tenant —</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> Plan
                    </label>
                    <select
                      className="w-full border rounded-md p-2 bg-white/80 dark:bg-gray-800/60"
                      value={user.planId || ""}
                      onChange={(e) =>
                        setUser({ ...user, planId: e.target.value })
                      }
                    >
                      <option value="">— Seleccionar Plan —</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={!!user.allowAI}
                      onChange={(e) =>
                        setUser({ ...user, allowAI: e.target.checked })
                      }
                    />
                    <Brain className="w-3 h-3" /> IA
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={!!user.active}
                      onChange={(e) =>
                        setUser({ ...user, active: e.target.checked })
                      }
                    />
                    <UserCog className="w-3 h-3" /> Activo
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-end">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-rowi-blueDay to-rowi-pinkDay text-white text-sm shadow hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}