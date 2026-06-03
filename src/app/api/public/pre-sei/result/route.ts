/**
 * 🎯 API pública: Pre-SEI result
 * GET /api/public/pre-sei/result?token=...
 *
 * Re-lee el insight cacheado de una PreSeiSession por token (query param o
 * cookie rowi_pre_sei). Sirve para recargar la página de resultado o abrir un
 * link compartible sin recalcular. Pública.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRE_SEI_COOKIE = "rowi_pre_sei";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.nextUrl.searchParams.get("token") ?? req.cookies.get(PRE_SEI_COOKIE)?.value ?? null;
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
    }

    const session = await prisma.preSeiSession.findUnique({
      where: { token },
      select: { result: true, locale: true, claimedByUserId: true, createdAt: true },
    });
    if (!session || !session.result) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      insight: session.result,
      locale: session.locale,
      claimed: Boolean(session.claimedByUserId),
    });
  } catch (error) {
    console.error("❌ Error GET /api/public/pre-sei/result:", error);
    return NextResponse.json({ ok: false, error: "Error loading result" }, { status: 500 });
  }
}
