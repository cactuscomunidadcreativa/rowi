import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const plans = await prisma.plan.findMany({
    orderBy: { priceUsd: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json(plans);
}