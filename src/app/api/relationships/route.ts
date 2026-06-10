/**
 * 🔗 API: lista de vínculos (díadas) del usuario — la "lista de relaciones" de
 * la cadena SIA. GET /api/relationships
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { affinityAsGap } from "@/domains/affinity/lib/asGap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const dyads = await prisma.relationshipDyad.findMany({
      where: { ownerUserId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 500, // E4: tope duro para respuesta acotada
      select: {
        id: true,
        otherName: true,
        otherEmail: true,
        relationType: true,
        closeness: true,
        otherJoined: true,
        otherSeiDone: true,
        lastGapSummary: true,
      },
    });

    const relationships = dyads.map((d) => {
      const summary = (d.lastGapSummary ?? null) as { heat135?: number; heat100?: number } | null;
      const gap = summary ? affinityAsGap(summary) : null;
      return {
        id: d.id,
        name: d.otherName,
        relationType: d.relationType,
        closeness: d.closeness,
        otherJoined: d.otherJoined,
        otherSeiDone: d.otherSeiDone,
        attunement: gap ? { level: gap.level, step: gap.step, labelKey: gap.labelKey } : null,
      };
    });

    return NextResponse.json({ ok: true, relationships });
  } catch (e: any) {
    console.error("❌ GET /api/relationships:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

/**
 * PATCH /api/relationships — edita una díada del propio usuario.
 * Body: { id, closeness?, relationType? }. Solo el dueño puede editar.
 */
const RELATION_TYPES = ["partner", "child", "parent", "friend", "colleague", "boss", "other"];
const CLOSENESS = ["Cercano", "Neutral", "Lejano"];

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      closeness?: string;
      relationType?: string;
    };
    if (!body.id) return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });

    // Ownership: solo el dueño de la díada puede editarla.
    const dyad = await prisma.relationshipDyad.findFirst({
      where: { id: body.id, ownerUserId: user.id },
      select: { id: true },
    });
    if (!dyad) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    const data: { closeness?: string; relationType?: string } = {};
    if (body.closeness && CLOSENESS.includes(body.closeness)) data.closeness = body.closeness;
    if (body.relationType && RELATION_TYPES.includes(body.relationType)) data.relationType = body.relationType;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: "nothing_to_update" }, { status: 400 });
    }

    const updated = await prisma.relationshipDyad.update({
      where: { id: body.id },
      data,
      select: { id: true, closeness: true, relationType: true },
    });
    return NextResponse.json({ ok: true, relationship: updated });
  } catch (e: any) {
    console.error("❌ PATCH /api/relationships:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
