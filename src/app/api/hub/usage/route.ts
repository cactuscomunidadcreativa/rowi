import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode");
  if (mode === "report") {
    const byTenant = await prisma.usageDaily.groupBy({
      by: ["tenantId"],
      _sum: { tokensInput: true, tokensOutput: true, calls: true, costUsd: true }
    });
    return NextResponse.json({ byTenant });
  }
  const rows = await prisma.usageDaily.findMany({ orderBy: { day: "desc" }, take: 60 });
  const sum = await prisma.usageDaily.aggregate({
    _sum: { tokensInput: true, tokensOutput: true, calls: true, costUsd: true }
  });
  return NextResponse.json({ sum, rows });
}
