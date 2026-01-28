// src/app/api/community/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/* =========================================================
   GET → Listar miembros (ownerId o userId)
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase();
    if (!email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const owner = await prisma.user.findUnique({
      where: { email },
      select: { id: true, primaryTenantId: true },
    });
    if (!owner) return NextResponse.json({ ok: true, members: [] });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;

    const where = {
      AND: [
        {
          OR: [
            { ownerId: owner.id }, // 👈 asegura que veas los tuyos
            { userId: owner.id },  // 👈 por compatibilidad con versiones previas
          ],
        },
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { email: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {},
      ],
    };

    const membersDB = await prisma.communityMember.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 500,
      include: {
        affinitySnapshots: {
          where: { userId: owner.id },
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            lastHeat135: true,
            aiSummary: true,
            context: true,
            updatedAt: true,
          },
        },
      },
    });

    const members = membersDB.map((m) => {
      const affinity = m.affinitySnapshots?.[0];
      const heat = affinity?.lastHeat135 ?? null;
      let level = null;
      if (typeof heat === "number") {
        if (heat >= 118) level = "Experto";
        else if (heat >= 108) level = "Diestro";
        else if (heat >= 92) level = "Funcional";
        else if (heat >= 82) level = "Emergente";
        else level = "Desafío";
      }

      return {
        id: m.id,
        name: m.name,
        email: m.email || undefined,
        country: m.country || undefined,
        brainStyle: m.brainStyle || undefined,
        group: m.group || "Trabajo",
        closeness: m.closeness || "Neutral",
        connectionType: m.connectionType || undefined,
        tenantId: m.tenantId,
        ownerId: m.ownerId,
        affinityHeat135: affinity?.lastHeat135 ?? null,
        affinityPercent:
          typeof affinity?.lastHeat135 === "number"
            ? Math.round((affinity.lastHeat135 / 135) * 100)
            : null,
        affinityLevel: level,
        aiSummary: affinity?.aiSummary ?? null,
        updatedAt: m.updatedAt,
      };
    });

    return NextResponse.json({
      ok: true,
      total: members.length,
      members,
    });
  } catch (e: any) {
    console.error("❌ GET /community/members error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al listar miembros" },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST → Crear nuevo miembro manual
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const owner = await prisma.user.findUnique({
      where: { email },
      select: { id: true, primaryTenantId: true },
    });
    if (!owner)
      return NextResponse.json({ ok: false, error: "Owner not found" }, { status: 404 });

    const data = await req.json();
    if (!data.name?.trim())
      return NextResponse.json({ ok: false, error: "Nombre requerido" }, { status: 400 });

    const newMember = await prisma.communityMember.create({
      data: {
        ownerId: owner.id,
        tenantId: owner.primaryTenantId, // ✅ siempre vinculado al tenant
        name: data.name.trim(),
        email: data.email || null,
        country: data.country || null,
        brainStyle: data.brainStyle || null,
        group: data.group || "Trabajo",
        closeness: data.closeness || "Neutral",
        connectionType: data.connectionType || null,
        source: "manual",
        status: "ACTIVE",
      },
    });

    // 🔁 Lanza cálculo de afinidad (sin bloquear)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      fetch(`${baseUrl}/api/affinity?memberId=${newMember.id}`, {
        method: "GET",
        headers: { "x-trigger": "auto" },
      });
    } catch (err: any) {
      console.warn("⚠️ Auto affinity trigger failed:", err);
    }

    return NextResponse.json({ ok: true, member: newMember });
  } catch (e: any) {
    console.error("❌ POST /community/members error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error creando miembro" },
      { status: 500 }
    );
  }
}