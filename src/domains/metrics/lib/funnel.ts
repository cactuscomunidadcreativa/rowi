/**
 * Embudo de la cadena SIA — instrumentación. Reusa el ActivityLog existente
 * (vía logAuditAction) en vez de una tabla nueva: cada paso es una fila con
 * action="sia_funnel.<step>" y entity="sia_funnel". Así el embudo se consulta
 * con las herramientas de auditoría/telemetría que ya hay.
 *
 * Métrica reina: usuarios que usan ECO/afinidad para una relación real y vuelven
 * a 7 días. Eslabón más débil hoy: invitación aceptada.
 */
import { logAuditAction } from "@/lib/audit/auditLog";

/** Pasos del embudo, en orden de la cadena. */
export type FunnelStep =
  | "mini_sei_completed"
  | "comm_profile_seeded"
  | "comm_profile_edited"
  | "eco_used"
  | "eco_sent"
  | "eco_feedback"
  | "rel_invite_sent"
  | "rel_invite_opened"
  | "rel_invite_accepted"
  | "rel_invite_linked"
  | "affinity_gap_viewed"
  | "eco_recurrent"
  | "returned_7d"
  | "sei_requested";

export interface FunnelProps {
  userId?: string | null;
  /** Contexto del evento (dyadId, inviteId, ecoLevel, etc.). */
  details?: Record<string, unknown>;
  /** Para capturar IP/UA si el evento ocurre en un request. */
  req?: Request;
}

/**
 * Registra un paso del embudo. No crítico: nunca lanza (logAuditAction ya
 * captura sus errores), así no interrumpe el flujo del producto.
 */
export async function trackFunnel(step: FunnelStep, props: FunnelProps = {}): Promise<void> {
  await logAuditAction({
    userId: props.userId ?? undefined,
    action: `sia_funnel.${step}`,
    entity: "sia_funnel",
    details: { step, ...(props.details ?? {}) },
    // logAuditAction espera un NextRequest-like con headers.get; Request lo cumple.
    req: props.req as never,
  });
}
