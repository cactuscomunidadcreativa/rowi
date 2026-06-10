export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope");
    const dataset = url.searchParams.get("dataset");

    const where: Record<string, unknown> = {};
    if (scope) where.scope = scope;
    if (dataset) where.dataset = dataset;

    const assessments = await prisma.vitalSignsAssessment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        scores: {
          orderBy: [{ level: "asc" }, { dimension: "asc" }],
        },
        _count: { select: { responses: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      assessments: assessments.map((a) => ({
        id: a.id,
        scope: a.scope,
        subjectType: a.subjectType,
        subjectId: a.subjectId,
        source: a.source,
        dataset: a.dataset,
        status: a.status,
        sampleSize: a.sampleSize,
        responseCount: a._count.responses,
        createdAt: a.createdAt,
        scores: a.scores,
      })),
    });
  } catch (e: unknown) {
    console.error("/api/vital-signs/assessments error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
