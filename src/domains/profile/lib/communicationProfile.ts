/**
 * Lectura/escritura del CommunicationProfile (fuente única de verdad).
 *
 * Nota: el `/api/profile` PATCH legacy escribía `User.brainProfile`, un campo que
 * NO existe en el schema (esa escritura nunca persistió). Por eso no hay nada que
 * backfillar: esta tabla estructurada reemplaza limpiamente ese intento.
 */
import { prisma } from "@/core/prisma";
import type { Prisma } from "@prisma/client";

export interface CommunicationProfileView {
  commSelf: unknown;
  commPref: unknown;
  channels: unknown;
  tone: string | null;
  activates: unknown;
  drains: unknown;
  values: unknown;
  archetype: string | null;
  draftSource: string | null;
  /** true si aún es borrador del mini-SEI (el usuario no lo editó). */
  isDraft: boolean;
}

/**
 * Devuelve el CommunicationProfile del usuario, o null si aún no existe (el
 * usuario no hizo el Rowi Test ni declaró su perfil).
 */
export async function getCommunicationProfile(
  userId: string,
): Promise<CommunicationProfileView | null> {
  const existing = await prisma.communicationProfile.findUnique({ where: { userId } });
  if (!existing) return null;
  return {
    commSelf: existing.commSelf,
    commPref: existing.commPref,
    channels: existing.channels,
    tone: existing.tone,
    activates: existing.activates,
    drains: existing.drains,
    values: existing.values,
    archetype: existing.archetype,
    draftSource: existing.draftSource,
    isDraft: existing.editedAt === null,
  };
}

export interface CommunicationProfilePatch {
  commSelf?: unknown;
  commPref?: unknown;
  channels?: unknown;
  tone?: string | null;
  activates?: unknown;
  drains?: unknown;
  values?: unknown;
}

/**
 * Edita el CommunicationProfile. Marca `editedAt` → el usuario lo hizo suyo, así
 * que el seed del mini-SEI ya no lo sobrescribirá. Crea la fila si no existe.
 */
export async function updateCommunicationProfile(
  userId: string,
  patch: CommunicationProfilePatch,
): Promise<void> {
  const data: {
    editedAt: Date;
    commSelf?: Prisma.InputJsonValue;
    commPref?: Prisma.InputJsonValue;
    channels?: Prisma.InputJsonValue;
    activates?: Prisma.InputJsonValue;
    drains?: Prisma.InputJsonValue;
    values?: Prisma.InputJsonValue;
    tone?: string | null;
  } = { editedAt: new Date() };
  if (patch.commSelf !== undefined) data.commSelf = patch.commSelf as Prisma.InputJsonValue;
  if (patch.commPref !== undefined) data.commPref = patch.commPref as Prisma.InputJsonValue;
  if (patch.channels !== undefined) data.channels = patch.channels as Prisma.InputJsonValue;
  if (patch.activates !== undefined) data.activates = patch.activates as Prisma.InputJsonValue;
  if (patch.drains !== undefined) data.drains = patch.drains as Prisma.InputJsonValue;
  if (patch.values !== undefined) data.values = patch.values as Prisma.InputJsonValue;
  if (patch.tone !== undefined) data.tone = patch.tone;

  await prisma.communicationProfile.upsert({
    where: { userId },
    create: { userId, draftSource: "manual", ...data },
    update: data,
  });
}
