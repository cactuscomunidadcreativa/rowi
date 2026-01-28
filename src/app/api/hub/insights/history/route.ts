import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const records = await prisma.insightRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(records);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}