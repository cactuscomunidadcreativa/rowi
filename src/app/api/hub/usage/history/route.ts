import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export async function GET() {
  try {
    const auth = await getServerAuthUser();
    if (!auth) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { primaryTenantId: true },
    });

    if (!user?.primaryTenantId)
      return NextResponse.json({ ok: false, error: "Usuario sin tenant" }, { status: 400 });

    const usage = await prisma.usageDaily.findMany({
      where: { tenantId: user.primaryTenantId },
      orderBy: { day: "desc" },
      take: 30,
    });

    return NextResponse.json({ ok: true, history: usage });
  } catch (err: any) {
    console.error("❌ /usage/history error:", err);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}