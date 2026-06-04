/**
 * Siembra (bajo el capó) el borrador del CommunicationProfile desde el mini-SEI.
 * Idempotente: si el usuario YA editó su perfil (editedAt != null), no toca nada.
 * Si existe un borrador puro (editedAt == null), lo refresca; si no existe, crea.
 *
 * Es el puente "mini-SEI Rowi Test → Perfil declarado" de la cadena SIA.
 */
import { prisma } from "@/core/prisma";
import { scorePreSei, type PreSeiAnswers } from "@/lib/pre-sei/scoring";
import { commProfileFromPreSei } from "./commProfileFromPreSei";

export async function seedCommunicationProfile(
  userId: string,
  answers: PreSeiAnswers,
  seiSnapshotId?: string,
): Promise<{ seeded: boolean; reason?: string }> {
  const existing = await prisma.communicationProfile.findUnique({
    where: { userId },
    select: { id: true, editedAt: true },
  });

  // El usuario ya hizo suyo el perfil → no sobrescribir su trabajo.
  if (existing?.editedAt) {
    return { seeded: false, reason: "user_edited" };
  }

  const draft = commProfileFromPreSei(scorePreSei(answers));

  const data = {
    commSelf: draft.commSelf,
    commPref: draft.commPref,
    channels: [],
    tone: draft.tone,
    activates: draft.activates,
    drains: draft.drains,
    values: [],
    archetype: draft.archetype,
    draftSource: "pre_sei",
    seiSnapshotId: seiSnapshotId ?? null,
  };

  await prisma.communicationProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data, // solo llega aquí si editedAt == null (borrador puro)
  });

  return { seeded: true };
}
