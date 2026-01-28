import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || null;
    if (!email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const owner = await prisma.user.findUnique({ where: { email } });
    if (!owner) return NextResponse.json({ ok: true, batches: [] });

    const batches = await prisma.batch.findMany({
      where: { ownerId: ownerid },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, batches });
  } catch (e: any) {
    console.error("GET /batch error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Error" }, { status: 500 });
  }
}