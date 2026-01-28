// apps/rowi/src/app/api/ai/jobs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export async function GET() {
  const jobs = await prisma.backgroundTask.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ ok: true, jobs });
}