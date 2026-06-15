/**
 * POST /api/mini-sei/submit
 *
 * Records a recurring mini-SEI snapshot (the monthly "trait" marker) for the
 * signed-in user. Body: { answers: { itemId: 1..5 }, source?: string }.
 * Scores via the hybrid item set (12 short-form items when provisioned, else
 * the 8-competency fallback) and persists a MiniSeiSnapshot.
 *
 * The competency profile is indicative (not normed); the response says so.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { scoreMiniSei } from "@/lib/mini-sei/score";
import { answersByPosition } from "@/lib/mini-sei/items";
import { resolvePreferences, type PrefAnswers } from "@/lib/mini-sei/preferences";
import { seedCommProfileFromPreferences } from "@/domains/profile/lib/seedCommunicationProfile";
import { telemetry } from "@/lib/telemetry";

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

    // The client answers by OPAQUE POSITION (the order from /questions), never
    // by item id. The server maps positions → real items; the item↔competency
    // mapping never leaves the back end.
    const body = (await req.json().catch(() => ({}))) as {
      answers?: Record<string, number>; // { "0": 4, "1": 3, ... } positional
      preferences?: Record<string, number>; // capa de estilo, posicional 1-5
      source?: string;
    };
    const positional = body.answers;
    if (!positional || typeof positional !== "object" || Object.keys(positional).length === 0) {
      return NextResponse.json({ ok: false, error: "Missing answers" }, { status: 400 });
    }
    for (const v of Object.values(positional)) {
      if (typeof v !== "number" || v < 1 || v > 5) {
        return NextResponse.json({ ok: false, error: "Answers must be 1-5" }, { status: 400 });
      }
    }

    // Map opaque positions → real item ids server-side, then score.
    const answers = answersByPosition(positional);
    if (Object.keys(answers).length === 0) {
      return NextResponse.json({ ok: false, error: "No valid positions" }, { status: 400 });
    }
    const result = scoreMiniSei(answers);

    const snapshot = await prisma.miniSeiSnapshot.create({
      data: {
        userId: user.id,
        totalEq: result.totalEq,
        totalEqBand: result.totalEqBand,
        competencyProfile: result.competencyProfile,
        answers,
        itemsVersion: result.itemsVersion,
        scaleVersion: result.scaleVersion,
        source: body.source === "onboarding" || body.source === "adhoc" ? body.source : "monthly",
      },
      select: { id: true, takenAt: true },
    });

    // Capa de preferencias declaradas → siembra el CommunicationProfile (lo que
    // ECO/Afinidad consumen). Best-effort: no rompe el submit si falla.
    if (body.preferences && typeof body.preferences === "object") {
      try {
        const prefs = resolvePreferences(body.preferences as PrefAnswers);
        await seedCommProfileFromPreferences(user.id, prefs);
      } catch (e) {
        telemetry.captureException(e, { route: "/api/mini-sei/submit", op: "seed_comm_profile", fatal: false });
      }
    }

    return NextResponse.json({
      ok: true,
      snapshotId: snapshot.id,
      takenAt: snapshot.takenAt,
      totalEq: result.totalEq,
      totalEqBand: result.totalEqBand,
      competencyProfile: result.competencyProfile,
      indicative: result.indicative,
    });
  } catch (e: unknown) {
    telemetry.captureException(e, { route: "/api/mini-sei/submit" });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
