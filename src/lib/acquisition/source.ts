/**
 * Atribución de adquisición — mapeo del query param libre `?source=...` al
 * enum AcquisitionSource de Prisma, conservando el valor crudo aparte.
 *
 * El canal fino (rel_invite, coach_invite, eco_general, ...) viaja en
 * `UserAcquisition.channel`; el enum solo agrupa para reporting. Así no
 * perdemos la atribución exacta del ad/invite que trajo al usuario.
 *
 * Usado por el registro email (/api/auth/register) y el finalize de OAuth
 * (/api/account/finalize-oauth) — misma fuente de verdad en ambos caminos.
 */

export type AcquisitionEnum =
  | "REFERRAL"
  | "EMAIL"
  | "EVENT"
  | "PARTNER"
  | "OTHER";

/** Mapea `source` libre al enum. Devuelve null si no hay source. */
export function mapSourceToEnum(source?: string | null): AcquisitionEnum | null {
  if (!source) return null;
  switch (source) {
    case "rel_invite":
    case "family_invite":
    case "coach_invite":
    case "team_invite":
      return "REFERRAL"; // invitaciones persona-a-persona
    case "eco_general":
    case "pre_sei":
      return "OTHER"; // gancho de producto sin login
    case "email":
      return "EMAIL";
    case "event":
    case "eqday":
      return "EVENT";
    case "partner":
      return "PARTNER";
    default:
      return "OTHER";
  }
}
