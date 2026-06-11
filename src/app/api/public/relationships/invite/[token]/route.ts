/**
 * 🔗 API pública: leer/aceptar una invitación relacional por deep link.
 * GET  /api/public/relationships/invite/[token] — carga el encuadre (marca opened)
 * POST /api/public/relationships/invite/[token] — acepta (responde el mini-test)
 *
 * El INVITADO entra por valor propio, NO a "llenar el perfil de otro". Vive bajo
 * /api/public/* → ya es pública en el middleware (sin sesión NextAuth), igual que
 * el Pre-SEI. La creación de la invitación (autenticada) está en
 * /api/relationships/invite.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { validateAnswers, scorePreSei, type PreSeiAnswers } from "@/lib/pre-sei/scoring";
import { trackFunnel } from "@/domains/metrics/lib/funnel";
import {
  compAffinity135,
  type CompKey,
  type Project,
} from "@/domains/affinity/lib/affinityEngine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PROJECTS: Project[] = [
  "innovation", "execution", "leadership", "conversation", "relationship", "decision",
];
const COMP_KEYS: CompKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

/** El contexto de la díada mapea a un Project del motor; default "relationship". */
function toProject(context: string | null | undefined): Project {
  return PROJECTS.includes(context as Project) ? (context as Project) : "relationship";
}

/** Perfil de competencias (0-135) del owner: SEI formal → mini-SEI → null. */
async function ownerCompetencyProfile(
  ownerUserId: string,
): Promise<Record<CompKey, number | null> | null> {
  const snap = await prisma.eqSnapshot.findFirst({
    where: { userId: ownerUserId },
    orderBy: { at: "desc" },
    select: { EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true },
  });
  if (snap && COMP_KEYS.some((k) => typeof snap[k] === "number")) {
    return snap as Record<CompKey, number | null>;
  }
  const mini = await prisma.miniSeiSnapshot.findFirst({
    where: { userId: ownerUserId },
    orderBy: { takenAt: "desc" },
    select: { competencyProfile: true },
  });
  if (mini?.competencyProfile && typeof mini.competencyProfile === "object") {
    return mini.competencyProfile as Record<CompKey, number | null>;
  }
  return null;
}

/**
 * Cierra la cadena SIA: al aceptar la invitación, calcula la afinidad (heat135)
 * entre el owner y el invitado y la persiste en la díada. Hasta hoy las
 * respuestas del invitado se guardaban crudas y heat135 nunca se computaba — el
 * efecto red (el corazón del "Social Interaction Algorithm") no se disparaba y
 * ECO con dyadId caía siempre en modo neutro.
 *
 * Honesto sobre lo que es: el invitado responde un mini-test auto-percibido
 * (no SEI normado) → scorePreSei lo lleva a las 8 competencias (70-130), el
 * mismo formato que consume el motor. Es una lectura indicativa de la BRECHA,
 * no un veredicto de compatibilidad. Se norma luego con SEI real.
 *
 * Resiliente: cualquier fallo aquí no rompe la aceptación de la invitación.
 */
async function computeInviteHeat(
  ownerUserId: string,
  dyadContext: string | null | undefined,
  inviteeAnswers: PreSeiAnswers,
): Promise<number | null> {
  try {
    const ownerComp = await ownerCompetencyProfile(ownerUserId);
    if (!ownerComp) return null; // el owner aún no tiene perfil: no se puede calcular

    const inviteeComp = scorePreSei(inviteeAnswers).competencies;
    const project = toProject(dyadContext);
    const { score } = compAffinity135(ownerComp, inviteeComp, project);
    return Math.round(score);
  } catch (e) {
    console.warn("[invite] no se pudo calcular heat135:", e);
    return null;
  }
}

async function loadInvite(token: string) {
  return prisma.relationshipInvite.findUnique({
    where: { token },
    include: {
      inviter: { select: { name: true } },
      dyad: { select: { id: true, ownerUserId: true } },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const invite = await loadInvite(token);
    if (!invite) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ ok: false, error: "expired" }, { status: 410 });
    }

    // Marca opened la primera vez (telemetría del embudo: invite_opened).
    if (invite.status === "pending") {
      await prisma.relationshipInvite.update({
        where: { id: invite.id },
        data: { status: "opened", openedAt: new Date() },
      });
      await trackFunnel("rel_invite_opened", {
        details: { dyadId: invite.dyadId, relationType: invite.relationType },
      });
    }

    // Honestidad ANTES de que el invitado invierta su minuto: si el owner aún
    // no tiene perfil, la sintonía entre ambos no se podrá calcular todavía.
    let ownerHasProfile = false;
    if (invite.dyad?.ownerUserId) {
      ownerHasProfile = !!(await ownerCompetencyProfile(invite.dyad.ownerUserId));
    }

    return NextResponse.json({
      ok: true,
      inviterName: invite.inviter?.name ?? null,
      relationType: invite.relationType,
      message: invite.message,
      locale: invite.locale,
      inviteeName: invite.inviteeName,
      ownerHasProfile,
      status: invite.status === "pending" ? "opened" : invite.status,
    });
  } catch (e: any) {
    console.error("❌ GET /api/relationships/invite/[token]:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

/**
 * Acepta la invitación con el mini-test del invitado (subset del Rowi Test).
 * Si el invitado responde sin cuenta, guardamos su percepción en la díada y
 * marcamos accepted; el registro/captura de cuenta es un paso posterior suave.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const invite = await loadInvite(token);
    if (!invite) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ ok: false, error: "expired" }, { status: 410 });
    }
    if (invite.status === "accepted") {
      return NextResponse.json({ ok: true, already: true });
    }

    const body = await req.json().catch(() => ({}));

    // El mini-test del invitado es opcional (puede aceptar solo por curiosidad),
    // pero si manda respuestas, deben ser válidas (8 claves SEI 1-5).
    let perceptionStored = false;
    let heat135: number | null = null;
    if (body.answers) {
      const err = validateAnswers(body.answers);
      if (err) {
        return NextResponse.json({ ok: false, error: err }, { status: 400 });
      }
      const answers = body.answers as PreSeiAnswers;

      // Cierre de la cadena SIA: calcular la afinidad owner↔invitado.
      const dyad = await prisma.relationshipDyad.findUnique({
        where: { id: invite.dyadId },
        select: { ownerUserId: true, context: true },
      });
      if (dyad) {
        heat135 = await computeInviteHeat(dyad.ownerUserId, dyad.context, answers);
      }

      // Guardar la percepción del invitado + la lectura de afinidad en la díada.
      // heat135/heat100 con la forma que lee ecoBridge (saca a ECO de modo neutro).
      await prisma.relationshipDyad.update({
        where: { id: invite.dyadId },
        data: {
          lastGapSummary: {
            inviteeAnswers: answers,
            source: "invitee_mini_test",
            ...(heat135 != null
              ? {
                  heat135,
                  heat100: Math.round((heat135 / 135) * 100),
                  context: dyad?.context ?? "relationship",
                }
              : {}),
          },
          ...(heat135 != null ? { lastGapAt: new Date(), otherJoined: true } : {}),
        },
      });
      perceptionStored = true;
    }

    await prisma.relationshipInvite.update({
      where: { id: invite.id },
      data: { status: "accepted", acceptedAt: new Date() },
    });
    await trackFunnel("rel_invite_accepted", {
      details: {
        dyadId: invite.dyadId,
        relationType: invite.relationType,
        perceptionStored,
        heatComputed: heat135 != null,
      },
    });

    return NextResponse.json({
      ok: true,
      perceptionStored,
      dyadId: invite.dyadId,
      // Afinidad owner↔invitado (escala de sintonía, no veredicto). null si el
      // owner aún no tiene perfil. El frontend lo usa para el momento WOW.
      heat135,
      heat100: heat135 != null ? Math.round((heat135 / 135) * 100) : null,
      // El frontend ofrece crear cuenta DESPUÉS de mostrar valor (captura suave).
      nextStep: "soft_register",
    });
  } catch (e: any) {
    console.error("❌ POST /api/relationships/invite/[token]:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
