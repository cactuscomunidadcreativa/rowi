import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const sections = await prisma.landingSection.findMany({
      where: {
        isVisible: true,
        config: {
          path: ["pageSlug"],
          equals: slug,
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ ok: true, sections, pageSlug: slug });
  } catch (e: any) {
    console.error("GET /api/public/pages/[slug]:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
