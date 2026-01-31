/**
 * 📊 API: Benchmarks CRUD
 * GET /api/admin/benchmarks - Lista de benchmarks
 * POST /api/admin/benchmarks - Crear nuevo benchmark
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

// =========================================================
// GET - Lista de benchmarks
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const scope = searchParams.get("scope");
    const tenantId = searchParams.get("tenantId");
    const isActive = searchParams.get("isActive");

    // Construir filtros
    const where: any = {};
    if (type) where.type = type;
    if (scope) where.scope = scope;
    if (tenantId) where.tenantId = tenantId;
    if (isActive !== null) where.isActive = isActive === "true";

    const benchmarks = await prisma.benchmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { id: true, name: true } },
        hub: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
        _count: {
          select: {
            dataPoints: true,
            statistics: true,
            topPerformers: true,
            correlations: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      benchmarks,
      total: benchmarks.length,
    });
  } catch (error) {
    console.error("❌ Error fetching benchmarks:", error);
    return NextResponse.json(
      { error: "Error al obtener benchmarks" },
      { status: 500 }
    );
  }
}

// =========================================================
// POST - Crear nuevo benchmark (metadatos solamente)
// =========================================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      type,
      scope,
      tenantId,
      hubId,
      organizationId,
      communityId,
      teamId,
      isLearning = true,
    } = body;

    // Validaciones
    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }
    if (!type || !["ROWIVERSE", "EXTERNAL", "INTERNAL"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de benchmark inválido" },
        { status: 400 }
      );
    }
    if (
      !scope ||
      ![
        "GLOBAL",
        "REGION",
        "COUNTRY",
        "SECTOR",
        "TENANT",
        "HUB",
        "TEAM",
        "COMMUNITY",
        "COHORT",
      ].includes(scope)
    ) {
      return NextResponse.json(
        { error: "Ámbito de benchmark inválido" },
        { status: 400 }
      );
    }

    const benchmark = await prisma.benchmark.create({
      data: {
        name,
        description,
        type,
        scope,
        tenantId,
        hubId,
        organizationId,
        communityId,
        teamId,
        isLearning,
        uploadedBy: session.user.email,
        status: "PROCESSING",
      },
    });

    return NextResponse.json({
      ok: true,
      benchmark,
    });
  } catch (error) {
    console.error("❌ Error creating benchmark:", error);
    return NextResponse.json(
      { error: "Error al crear benchmark" },
      { status: 500 }
    );
  }
}
