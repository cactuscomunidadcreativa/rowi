import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * GET /api/weekflow/comments?contributionId=xxx
 * Lista comentarios de una contribución
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
    const contributionId = searchParams.get("contributionId");

    if (!contributionId) {
      return NextResponse.json({ ok: false, error: "contributionId required" }, { status: 400 });
    }

    const comments = await prisma.weekFlowComment.findMany({
      where: { contributionId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ ok: true, comments });
  } catch (error) {
    console.error("[WeekFlow Comments GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/weekflow/comments
 * Crea un nuevo comentario
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
    const { contributionId, content } = body;

    if (!contributionId || !content) {
      return NextResponse.json(
        { ok: false, error: "contributionId and content are required" },
        { status: 400 }
      );
    }

    // Verificar que la contribución existe
    const contribution = await prisma.weekFlowContribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution) {
      return NextResponse.json({ ok: false, error: "Contribution not found" }, { status: 404 });
    }

    const comment = await prisma.weekFlowComment.create({
      data: {
        contributionId,
        userId: auth.id,
        content,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ ok: true, comment });
  } catch (error) {
    console.error("[WeekFlow Comments POST]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * PUT /api/weekflow/comments
 * Actualiza un comentario
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
    const { id, content } = body;

    if (!id || !content) {
      return NextResponse.json({ ok: false, error: "id and content are required" }, { status: 400 });
    }

    // Verificar que el comentario pertenece al usuario
    const existing = await prisma.weekFlowComment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Comment not found" }, { status: 404 });
    }

    if (existing.userId !== auth.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const comment = await prisma.weekFlowComment.update({
      where: { id },
      data: { content },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ ok: true, comment });
  } catch (error) {
    console.error("[WeekFlow Comments PUT]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/weekflow/comments
 * Elimina un comentario
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

    // Verificar que el comentario pertenece al usuario
    const existing = await prisma.weekFlowComment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Comment not found" }, { status: 404 });
    }

    if (existing.userId !== auth.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.weekFlowComment.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[WeekFlow Comments DELETE]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
