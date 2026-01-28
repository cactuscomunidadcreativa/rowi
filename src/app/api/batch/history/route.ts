// src/app/api/batch/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "affinity";
    const context = url.searchParams.get("context") || "relationship";

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({ where: { email } });
    if (!me) return NextResponse.json({ ok: false, error: "User not found" });

    // ✅ Buscar los últimos 2 Batch de tipo "affinity"
    const batches = await prisma.batch.findMany({
      where: {
        ownerId: me.id,
        type,
        context: { contains: context, mode: "insensitive" as const },
      },
      orderBy: { startedAt: "desc" }, // ✅ campo correcto según tu modelo
      take: 2,
    });

    if (!batches.length) {
      return NextResponse.json({
        ok: true,
        message: "No se encontró histórico para este contexto",
        previousAvg: null,
        history: [],
      });
    }

    // Extraer el batch actual y el previo
    const currentBatch = batches[0];
    const prevBatch = batches[1] || null;

    const [currSnaps, prevSnaps] = await Promise.all([
      prisma.affinitySnapshot.findMany({
        where: {
          userId: me.id,
          context,
          createdAt: {
            gte: new Date(currentBatch.startedAt.getTime() - 24 * 60 * 60 * 1000),
            lte: new Date(currentBatch.startedAt.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),
      prevBatch
        ? prisma.affinitySnapshot.findMany({
            where: {
              userId: me.id,
              context,
              createdAt: {
                gte: new Date(prevBatch.startedAt.getTime() - 24 * 60 * 60 * 1000),
                lte: new Date(prevBatch.startedAt.getTime() + 24 * 60 * 60 * 1000),
              },
            },
          })
        : [],
    ]);

    const avgNow =
      currSnaps.length > 0
        ? Math.round(
            currSnaps.reduce((acc, s) => acc + (s.lastHeat135 ?? 0), 0) /
              currSnaps.length
          )
        : null;

    const avgPrev =
      prevSnaps.length > 0
        ? Math.round(
            prevSnaps.reduce((acc, s) => acc + (s.lastHeat135 ?? 0), 0) /
              prevSnaps.length
          )
        : null;

    return NextResponse.json({
      ok: true,
      context,
      currentBatch: {
        id: currentBatch.id,
        context: currentBatch.context,
        createdAt: currentBatch.startedAt,
        avgNow,
      },
      previousBatch: prevBatch
        ? {
            id: prevBatch.id,
            context: prevBatch.context,
            createdAt: prevBatch.startedAt,
            avgPrev,
          }
        : null,
      previousAvg: avgPrev,
      diff:
        avgNow && avgPrev
          ? Math.round(((avgNow - avgPrev) / avgPrev) * 100)
          : 0,
      history: [
        { batchId: currentBatch.id, avg: avgNow },
        prevBatch ? { batchId: prevBatch.id, avg: avgPrev } : null,
      ].filter(Boolean),
    });
  } catch (e: any) {
    console.error("[/api/batch/history] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}