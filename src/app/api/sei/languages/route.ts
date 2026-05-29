/**
 * 🌐 GET /api/sei/languages
 * Lista los idiomas en los que el usuario puede tomar el SEI, según los
 * SeiLink activos válidos para su plan (planSlug null = todos los planes).
 * La página /sei muestra esta lista; al elegir un idioma se resuelve la URL
 * concreta con /api/sei/link?language=<code>.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LANGUAGE_NAMES: Record<string, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { plan: { select: { slug: true, seiIncluded: true } } },
    });

    // El plan debe incluir SEI; si no, la UI debe ofrecer upgrade.
    if (!user?.plan?.seiIncluded) {
      return NextResponse.json({ ok: false, upgrade: true, error: "Plan does not include SEI" });
    }

    const planSlug = user.plan.slug ?? null;

    // Links activos válidos para el plan (específicos del plan o globales).
    const links = await prisma.seiLink.findMany({
      where: {
        isActive: true,
        OR: [{ planSlug: null }, ...(planSlug ? [{ planSlug }] : [])],
      },
      orderBy: [{ language: "asc" }, { isDefault: "desc" }],
      select: { id: true, code: true, name: true, url: true, language: true, isDefault: true },
    });

    // Agrupar por idioma; el primero (isDefault primero por el orderBy) gana.
    const byLang = new Map<string, { code: string; name: string; url: string; linkCode: string }>();
    for (const l of links) {
      if (!byLang.has(l.language)) {
        byLang.set(l.language, {
          code: l.language,
          name: LANGUAGE_NAMES[l.language] || l.language.toUpperCase(),
          url: l.url,
          linkCode: l.code,
        });
      }
    }

    const languages = [...byLang.values()];
    return NextResponse.json({ ok: true, languages });
  } catch (error) {
    console.error("❌ GET /api/sei/languages:", error);
    return NextResponse.json({ ok: false, error: "Error listing SEI languages" }, { status: 500 });
  }
}
