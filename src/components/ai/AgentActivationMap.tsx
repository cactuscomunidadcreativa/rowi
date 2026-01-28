"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

/**
 * 🗺️ AgentActivationMap
 * ----------------------------------------------------------
 * Muestra todas las instancias donde un agente (por slug)
 * está presente: Global, SuperHubs, Tenants, Organizaciones.
 * Incluye indicador de estado (activo/inactivo) y enlaces.
 *
 * Props:
 *   - slug: string  → Ej: "eco", "rowi-coach", "eq"
 *   - compact?: boolean  → Modo resumido sin bordes
 * ----------------------------------------------------------
 * Uso:
 *   <AgentActivationMap slug="eco" />
 */

export default function AgentActivationMap({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    loadInstances();
  }, [slug]);

  async function loadInstances() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/agents/map?slug=${slug}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setInstances(data.instances || []);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar mapa de activación");
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div
        className={`text-xs text-muted-foreground flex items-center gap-2 ${
          compact ? "" : "border-t pt-2 mt-2"
        }`}
      >
        <Loader2 className="w-3 h-3 animate-spin" /> Cargando mapa de activación...
      </div>
    );

  if (instances.length === 0)
    return (
      <div
        className={`text-xs text-gray-400 ${
          compact ? "" : "border-t pt-2 mt-2"
        }`}
      >
        No hay otras instancias de este agente.
      </div>
    );

  return (
    <div
      className={`${
        compact ? "" : "border-t pt-2 mt-2"
      } text-[11px] text-gray-600 dark:text-gray-400`}
    >
      {!compact && (
        <p className="font-medium mb-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-blue-500" /> Activo en:
        </p>
      )}
      <ul className="space-y-0.5">
        {instances.map((r) => {
          const ctx =
            r.organization?.name
              ? `🏢 Org: ${r.organization.name}`
              : r.superHub?.name
              ? `🏛 SuperHub: ${r.superHub.name}`
              : r.tenant?.name
              ? `🧱 Tenant: ${r.tenant.name}`
              : "🌍 Global";

          const color = r.isActive ? "text-green-600" : "text-gray-400";
          const href =
            r.organization?.slug
              ? `/org/${r.organization.slug}`
              : r.tenant?.slug
              ? `/tenant/${r.tenant.slug}`
              : r.superHub?.id
              ? `/superhub/${r.superHub.id}`
              : "/";

          return (
            <li key={r.id} className={`flex items-center justify-between`}>
              <div className={`flex items-center gap-1 ${color}`}>
                <span>{ctx}</span>
                <span>{r.isActive ? "✅ activo" : "⛔ inactivo"}</span>
              </div>
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-[10px]"
                >
                  Ver →
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}