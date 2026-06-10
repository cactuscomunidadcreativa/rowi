/**
 * Resuelve el set de CAPABILITIES de un usuario combinando los dos ejes:
 *   - scope: el AdminScopeType de requireAdminWithScope (rowiverse/superhub/tenant/hub)
 *   - planFlags: los flags de suscripción del Plan del tenant relevante
 *
 * Regla: una capability se concede si (a) el scope del usuario está en sus
 * scopes permitidos Y (b) su planFlag está activo (o no requiere plan).
 *
 * rowiverse (SuperAdmin = Eduardo) es un caso especial: ve TODO, sin depender
 * de suscripción — un SuperAdmin no debería quedar bloqueado por el plan de un
 * tenant. Las capabilities platform.* solo las tiene rowiverse por catálogo.
 *
 * Función PURA: no toca DB. El caller carga scope + planFlags y llama aquí.
 */
import {
  CAPABILITY_CATALOG,
  ALL_CAPABILITIES,
  type Capability,
  type AdminScopeType,
  type PlanFlag,
} from "./catalog";

export type PlanFlags = Partial<Record<PlanFlag, boolean>>;

export function resolveCapabilities(
  scope: AdminScopeType,
  planFlags: PlanFlags,
): Set<Capability> {
  const granted = new Set<Capability>();

  for (const cap of ALL_CAPABILITIES) {
    const rule = CAPABILITY_CATALOG[cap];

    // Eje 1 — scope/rol: ¿el scope del usuario puede tener esta capability?
    if (!rule.scopes.includes(scope)) continue;

    // rowiverse (SuperAdmin) ignora el gate de plan: ve todo lo de su scope.
    if (scope === "rowiverse") {
      granted.add(cap);
      continue;
    }

    // Eje 2 — suscripción: si la capability requiere un flag de plan, debe estar activo.
    if (rule.planFlag && !planFlags[rule.planFlag]) continue;

    granted.add(cap);
  }

  return granted;
}

/** Helper de conveniencia para checks puntuales. */
export function can(
  caps: Set<Capability>,
  capability: Capability,
): boolean {
  return caps.has(capability);
}
