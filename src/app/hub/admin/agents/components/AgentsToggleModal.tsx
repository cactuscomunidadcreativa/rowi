"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   🔌 Activar / Desactivar agente IA por contexto
   ---------------------------------------------------------
   - Permite prender/apagar agente en Hub, Tenant, SuperHub, Org o Global
   - No edita prompt
========================================================= */
export default function AgentsToggleModal({
  agent,
  tenants,
  superHubs,
  hubs,
  orgs,
  onClose,
}: any) {
  const { t } = useI18n();
  const [scope, setScope] = useState<"global" | "superhub" | "tenant" | "hub" | "org">(
    agent.scope || "global"
  );
  const [selected, setSelected] = useState(
    agent.hubId || agent.tenantId || agent.superHubId || agent.organizationId || ""
  );
  const [active, setActive] = useState(agent.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const options =
    scope === "superhub"
      ? superHubs
      : scope === "tenant"
      ? tenants
      : scope === "hub"
      ? hubs
      : scope === "org"
      ? orgs
      : [];

  /* =========================================================
     💾 Guardar cambio de estado
  ========================================================== */
  async function saveStatus() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/agents/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: agent.slug,
          active,
          scope,
          hubId: scope === "hub" ? selected : null,
          tenantId: scope === "tenant" ? selected : null,
          superHubId: scope === "superhub" ? selected : null,
          organizationId: scope === "org" ? selected : null,
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error || t("agentsToggle.updateError", "Error actualizando estado"));
      toast.success(
        active
          ? t("agentsToggle.activated", "Agente activado correctamente")
          : t("agentsToggle.deactivated", "Agente desactivado correctamente")
      );
      onClose();
    } catch (e: any) {
      toast.error(e.message || t("agentsToggle.saveError", "Error al guardar cambios"));
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     🎨 UI
  ========================================================== */
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">
        ⚙️ {t("agentsToggle.heading", "Control de agente:")}{" "}
        <span className="text-rowi-blueDay">{agent.name}</span>
      </h2>

      {/* Nivel jerárquico */}
      <div className="grid sm:grid-cols-2 gap-3 items-center">
        <div>
          <label className="text-xs text-muted-foreground">{t("admin.agents.toggleModal.level")}</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={scope}
            onChange={(e) => {
              setScope(e.target.value as any);
              setSelected("");
            }}
          >
            <option value="global">🌍 {t("agentsToggle.scopeGlobal", "Global")}</option>
            <option value="superhub">🏛 {t("agentsToggle.scopeSuperhub", "SuperHub")}</option>
            <option value="tenant">🧱 {t("agentsToggle.scopeTenant", "Tenant")}</option>
            <option value="hub">🔹 {t("agentsToggle.scopeHub", "Hub")}</option>
            <option value="org">🏢 {t("agentsToggle.scopeOrg", "Organización")}</option>
          </select>
        </div>

        {scope !== "global" && (
          <div>
            <label className="text-xs text-muted-foreground">{t("admin.agents.toggleModal.entity")}</label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">{t("agentsToggle.selectPlaceholder", "(Seleccionar)")}</option>
              {options.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Activar / desactivar */}
      <div className="flex items-center gap-2 mt-4">
        <Switch checked={active} onCheckedChange={setActive} />
        <span className="text-sm">
          {active
            ? `${t("agentsToggle.agentActive", "Agente activo")} ✅`
            : `${t("agentsToggle.agentInactive", "Agente inactivo")} ⛔`}
        </span>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={onClose} variant="outline">
          {t("agentsToggle.cancel", "Cancelar")}
        </Button>
        <Button onClick={saveStatus} disabled={saving} className="gap-1">
          <Save className="w-4 h-4" /> {t("agentsToggle.save", "Guardar cambios")}
        </Button>
      </div>
    </div>
  );
}