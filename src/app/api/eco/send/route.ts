// src/app/api/eco/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { recordEcoSent, recordEcoFeedback } from "@/domains/eco/lib/ecoBridge";
import { trackFunnel } from "@/domains/metrics/lib/funnel";

export const dynamic = "force-dynamic";

/**
 * POST /api/eco/send — cierra el loop ECO → outcome.
 *
 * Dos acciones sobre una díada con hilo ECO existente:
 *  - { action: "sent", dyadId, channel, text }  → registra que el mensaje se envió.
 *  - { action: "feedback", dyadId, worked, note? } → registra si funcionó (foso).
 *
 * Hasta hoy ECO solo componía; el envío era handoff a mailto/wa.me y nadie
 * registraba si el mensaje funcionó. Esto empieza a capturar el outcome real
 * que calibra la brecha.
 */
type Body = {
  action?: "sent" | "feedback";
  dyadId?: string;
  channel?: string;
  text?: string;
  worked?: boolean;
  note?: string;
};

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.dyadId) {
      return NextResponse.json({ ok: false, error: "dyadId_required" }, { status: 400 });
    }

    // Ownership: solo el dueño de la díada puede registrar envío/feedback.
    const dyad = await prisma.relationshipDyad.findFirst({
      where: { id: body.dyadId, ownerUserId: user.id },
      select: { id: true },
    });
    if (!dyad) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    if (body.action === "feedback") {
      await recordEcoFeedback({
        dyadId: body.dyadId,
        ownerUserId: user.id,
        worked: body.worked === true,
        note: body.note ?? null,
      });
      await trackFunnel("eco_feedback", {
        details: { dyadId: body.dyadId, worked: body.worked === true },
      });
      return NextResponse.json({ ok: true });
    }

    // default: registrar envío
    await recordEcoSent({
      dyadId: body.dyadId,
      ownerUserId: user.id,
      channel: (body.channel || "unknown").slice(0, 32),
      text: body.text || "",
    });
    await trackFunnel("eco_sent", {
      details: { dyadId: body.dyadId, channel: body.channel },
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("/api/eco/send error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
