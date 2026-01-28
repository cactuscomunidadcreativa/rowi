import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hubId = url.searchParams.get("hubId") || undefined;
  const tenantId = url.searchParams.get("tenantId") || undefined;
  const take = Number(url.searchParams.get("take") || 50);
  const cursor = url.searchParams.get("cursor") || undefined;

  const data = await prisma.emotionalEvent.findMany({
    where: {
      ...(hubId ? { contextType: "hub", contextId: hubId } : {}),
      ...(tenantId ? { contextType: "tenant", contextId: tenantId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true, type: true, message: true, valence: true, intensity: true,
      contextType: true, contextId: true, createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      member: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    items: data,
    nextCursor: data.length === take ? data[data.length - 1].id : null,
  });
}