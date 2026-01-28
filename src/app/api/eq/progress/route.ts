import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (!user) throw new Error("Usuario no autenticado");

    const body = await req.json();
    const { reflection, insight, actionPlan, metrics, context } = body;

    const entry = await prisma.eqProgress.create({
      data: {
        userId: user.id,
        reflection,
        insight,
        actionPlan,
        metrics,
        context,
      },
    });

    return NextResponse.json({ ok: true, progress: entry });
  } catch (e: any) {
    console.error("❌ /api/eq/progress error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}