/**
 * GET/PATCH /api/account/onboarding-data
 * Lee y actualiza las selecciones transient del wizard de onboarding
 * (selectedRoles, billingPeriod, couponCode, wantsSei, etc.) que viven
 * en User.onboardingData (Json).
 *
 * El frontend llama a PATCH cada vez que el usuario cambia una selección
 * relevante para que la elección sobreviva al cierre del tab.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

const KNOWN_KEYS = new Set([
  "selectedRoles",
  "billingPeriod",
  "couponCode",
  "wantsSei",
  "utmSource",
  "utmMedium",
  "utmCampaign",
]);

export async function GET() {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { onboardingData: true, onboardingStatus: true, onboardingStep: true },
  });
  return NextResponse.json({
    ok: true,
    data: user?.onboardingData ?? null,
    status: user?.onboardingStatus,
    step: user?.onboardingStep,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const current = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { onboardingData: true },
  });
  const merged: Record<string, unknown> = {
    ...((current?.onboardingData as Record<string, unknown> | null) ?? {}),
  };

  for (const [key, value] of Object.entries(body)) {
    if (!KNOWN_KEYS.has(key)) continue;
    if (value === null || value === undefined) {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }

  await prisma.user.update({
    where: { id: auth.id },
    data: { onboardingData: merged as any },
  });

  return NextResponse.json({ ok: true, data: merged });
}
