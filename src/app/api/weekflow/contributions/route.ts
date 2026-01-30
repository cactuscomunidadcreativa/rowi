import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * GET /api/weekflow/contributions?sessionId=xxx
 * Lista contribuciones de una sesión
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!auth.plan?.weekflowAccess) {
      return NextResponse.json(
        { ok: false, error: "weekflow.errors.planRequired" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const type = searchParams.get("type"); // SHOW_TELL, TO_DISCUSS, FOCUS
    const userId = searchParams.get("userId"); // Filtrar por usuario

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "sessionId required" }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      sessionId,
      status: "ACTIVE",
    };

    if (type) {
      where.type = type;
    }

    if (userId) {
      where.userId = userId;
    }

    const contributions = await prisma.weekFlowContribution.findMany({
      where,
      orderBy: [{ type: "asc" }, { order: "asc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ ok: true, contributions });
  } catch (error) {
    console.error("[WeekFlow Contributions GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/weekflow/contributions
 * Crea una nueva contribución
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!auth.plan?.weekflowAccess) {
      return NextResponse.json(
        { ok: false, error: "weekflow.errors.planRequired" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sessionId, type, content, isTask, dueDate, priority } = body;

    if (!sessionId || !type || !content) {
      return NextResponse.json(
        { ok: false, error: "sessionId, type, and content are required" },
        { status: 400 }
      );
    }

    // Validar tipo
    if (!["SHOW_TELL", "TO_DISCUSS", "FOCUS"].includes(type)) {
      return NextResponse.json({ ok: false, error: "Invalid type" }, { status: 400 });
    }

    // Verificar que la sesión existe
    const session = await prisma.weekFlowSession.findUnique({
      where: { id: sessionId },
      include: { config: true },
    });

    if (!session) {
      return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
    }

    // Verificar límite de items por sección
    const existingCount = await prisma.weekFlowContribution.count({
      where: {
        sessionId,
        userId: auth.id,
        type,
        status: "ACTIVE",
      },
    });

    if (existingCount >= session.config.maxItemsPerSection) {
      return NextResponse.json(
        { ok: false, error: "weekflow.errors.maxItemsReached" },
        { status: 400 }
      );
    }

    // Obtener el orden máximo actual
    const maxOrder = await prisma.weekFlowContribution.aggregate({
      where: { sessionId, userId: auth.id, type },
      _max: { order: true },
    });

    const contribution = await prisma.weekFlowContribution.create({
      data: {
        sessionId,
        userId: auth.id,
        type,
        content,
        order: (maxOrder._max.order ?? -1) + 1,
        isTask: isTask || false,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ ok: true, contribution });
  } catch (error) {
    console.error("[WeekFlow Contributions POST]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * PUT /api/weekflow/contributions
 * Actualiza una contribución
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!auth.plan?.weekflowAccess) {
      return NextResponse.json(
        { ok: false, error: "weekflow.errors.planRequired" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, content, isTask, isCompleted, dueDate, priority, order, reactions } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    }

    // Verificar que la contribución pertenece al usuario
    const existing = await prisma.weekFlowContribution.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Contribution not found" }, { status: 404 });
    }

    if (existing.userId !== auth.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (content !== undefined) updateData.content = content;
    if (isTask !== undefined) updateData.isTask = isTask;
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      updateData.completedAt = isCompleted ? new Date() : null;
    }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (order !== undefined) updateData.order = order;
    if (reactions !== undefined) updateData.reactions = reactions;

    const contribution = await prisma.weekFlowContribution.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ ok: true, contribution });
  } catch (error) {
    console.error("[WeekFlow Contributions PUT]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/weekflow/contributions
 * Elimina (archiva) una contribución
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!auth.plan?.weekflowAccess) {
      return NextResponse.json(
        { ok: false, error: "weekflow.errors.planRequired" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    }

    // Verificar que la contribución pertenece al usuario
    const existing = await prisma.weekFlowContribution.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Contribution not found" }, { status: 404 });
    }

    if (existing.userId !== auth.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Soft delete (archivamos en lugar de eliminar)
    await prisma.weekFlowContribution.update({
      where: { id },
      data: { status: "DELETED" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[WeekFlow Contributions DELETE]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
