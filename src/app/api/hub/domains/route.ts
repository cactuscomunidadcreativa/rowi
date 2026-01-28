import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const { tenantId, domain } = await req.json();
  if (!tenantId || !domain)
    return NextResponse.json({ error: "tenantId/domain required" }, { status: 400 });
  const d = await prisma.tenantDomain.create({ data: { tenantId, domain } });
  return NextResponse.json(d, { status: 201 });
}
