export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/**
 * Public marketplace: returns published, accepting-clients coach profiles.
 * Supports basic filtering by specialty, language, country, service role.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const specialty = url.searchParams.get("specialty");
    const language = url.searchParams.get("language");
    const country = url.searchParams.get("country");
    const serviceRole = url.searchParams.get("role");
    const verifiedOnly = url.searchParams.get("verifiedOnly") === "true";

    const where: Record<string, unknown> = {
      published: true,
      acceptingClients: true,
    };
    if (specialty) where.specialties = { has: specialty };
    if (language) where.languages = { has: language };
    if (country) where.countries = { has: country };
    if (serviceRole) where.serviceRoles = { has: serviceRole };
    if (verifiedOnly) where.verifiedBySixSeconds = true;

    const profiles = await prisma.coachProfile.findMany({
      where,
      orderBy: [{ verifiedBySixSeconds: "desc" }, { ratingAvg: "desc" }, { createdAt: "desc" }],
      take: 60,
      select: {
        id: true,
        displayName: true,
        headline: true,
        bio: true,
        specialties: true,
        languages: true,
        countries: true,
        serviceRoles: true,
        certifications: true,
        hourlyRateMin: true,
        hourlyRateMax: true,
        currency: true,
        photoUrl: true,
        verifiedBySixSeconds: true,
        verifiedByRowi: true,
        ratingAvg: true,
        ratingCount: true,
      },
    });

    return NextResponse.json({ ok: true, profiles });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/coaches/marketplace error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
