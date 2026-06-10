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
import {
  declaredCommStyle,
  type ResolvedPreferences,
} from "@/lib/mini-sei/preferences";

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

/**
 * Siembra el CommunicationProfile desde las PREFERENCIAS declaradas del mini-SEI
 * (la capa de estilo: procesamiento / cambio / horizonte / canal). A diferencia
 * del seeder de Pre-SEI, esto NO deriva commSelf de competencias — las
 * preferencias declaradas SON la señal (el usuario las eligió explícitamente).
 *
 * Idempotente y respeta editedAt (no pisa el trabajo manual del usuario). Es el
 * puente "mini-SEI → Perfil declarado" + lo que ECO/Afinidad consumen.
 */
export async function seedCommProfileFromPreferences(
  userId: string,
  preferences: ResolvedPreferences,
): Promise<{ seeded: boolean; reason?: string }> {
  const existing = await prisma.communicationProfile.findUnique({
    where: { userId },
    select: { id: true, editedAt: true },
  });
  if (existing?.editedAt) {
    return { seeded: false, reason: "user_edited" };
  }

  const style = declaredCommStyle(preferences);
  const commPref: string[] = [];
  if (style.prefersKey) commPref.push(style.prefersKey);
  if (style.dataStyleKey) commPref.push(style.dataStyleKey);

  // Crea o refresca SOLO los campos que las preferencias gobiernan, sin borrar
  // commSelf/activates si un seed de Pre-SEI previo los puso.
  await prisma.communicationProfile.upsert({
    where: { userId },
    create: {
      userId,
      commSelf: [],
      commPref,
      channels: style.channels,
      tone: style.toneKey ?? null,
      activates: [],
      drains: [],
      values: [],
      draftSource: "mini_sei",
    },
    update: {
      commPref,
      channels: style.channels,
      tone: style.toneKey ?? undefined,
      draftSource: "mini_sei",
    },
  });

  return { seeded: true };
}
