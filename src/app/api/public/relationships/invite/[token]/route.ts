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
import { validateAnswers, type PreSeiAnswers } from "@/lib/pre-sei/scoring";
import { trackFunnel } from "@/domains/metrics/lib/funnel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadInvite(token: string) {
  return prisma.relationshipInvite.findUnique({
    where: { token },
    include: { inviter: { select: { name: true } }, dyad: { select: { id: true } } },
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

    return NextResponse.json({
      ok: true,
      inviterName: invite.inviter?.name ?? null,
      relationType: invite.relationType,
      message: invite.message,
      locale: invite.locale,
      inviteeName: invite.inviteeName,
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
    if (body.answers) {
      const err = validateAnswers(body.answers);
      if (err) {
        return NextResponse.json({ ok: false, error: err }, { status: 400 });
      }
      const answers = body.answers as PreSeiAnswers;
      // Guardar la percepción del invitado en la díada (no es SEI normado).
      await prisma.relationshipDyad.update({
        where: { id: invite.dyadId },
        data: { lastGapSummary: { inviteeAnswers: answers, source: "invitee_mini_test" } },
      });
      perceptionStored = true;
    }

    await prisma.relationshipInvite.update({
      where: { id: invite.id },
      data: { status: "accepted", acceptedAt: new Date() },
    });
    await trackFunnel("rel_invite_accepted", {
      details: { dyadId: invite.dyadId, relationType: invite.relationType, perceptionStored },
    });

    return NextResponse.json({
      ok: true,
      perceptionStored,
      dyadId: invite.dyadId,
      // El frontend ofrece crear cuenta DESPUÉS de mostrar valor (captura suave).
      nextStep: "soft_register",
    });
  } catch (e: any) {
    console.error("❌ POST /api/relationships/invite/[token]:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
