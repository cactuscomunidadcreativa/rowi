/**
 * 🎯 API: Pre-SEI intake interno (usuario logueado).
 * POST /api/pre-sei/intake
 *
 * Versión del Rowi Test para usuarios ya autenticados (paso del onboarding).
 * Salta la PreSeiSession anónima: materializa directo EqSnapshot(pre_sei) +
 * señales y siembra el CommunicationProfile bajo el capó (vía writePreSeiIntake).
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { validateAnswers, type PreSeiAnswers } from "@/lib/pre-sei/scoring";
import { writePreSeiIntake } from "@/lib/pre-sei/claim";
import { trackFunnel } from "@/domains/metrics/lib/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const validationError = validateAnswers(body?.answers);
    if (validationError) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    const demographics = {
      ageRange: typeof body.ageRange === "string" ? body.ageRange : null,
      gender: typeof body.gender === "string" ? body.gender : null,
      sector: typeof body.sector === "string" ? body.sector : null,
      country: typeof body.country === "string" ? body.country : null,
    };

    const { snapshotId, created } = await writePreSeiIntake(
      user.id,
      body.answers as PreSeiAnswers,
      demographics,
    );

    await trackFunnel("mini_sei_completed", {
      userId: user.id,
      details: { source: "onboarding", snapshotId, created },
    });

    return NextResponse.json({ ok: true, snapshotId, created });
  } catch (error) {
    console.error("❌ POST /api/pre-sei/intake:", error);
    return NextResponse.json({ ok: false, error: "Error processing intake" }, { status: 500 });
  }
}
