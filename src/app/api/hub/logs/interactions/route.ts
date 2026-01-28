import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return NextResponse.json(rows);
}
