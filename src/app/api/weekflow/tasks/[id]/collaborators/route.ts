import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * GET /api/weekflow/tasks/[id]/collaborators
 * Lista los colaboradores de una tarea
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que la tarea existe y el usuario tiene acceso
    const task = await prisma.rowiTask.findUnique({
      where: { id },
      include: {
        collaborators: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            member: { select: { id: true, name: true, email: true, brainStyle: true } },
          },
        },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });
    }

    // Solo el dueño o colaboradores pueden ver
    const isOwner = task.userId === auth.id;
    const isCollaborator = task.collaborators.some(c => c.userId === auth.id);
    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      collaborators: task.collaborators,
      assignee: task.assignee,
    });
  } catch (error) {
    console.error("[Task Collaborators GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/weekflow/tasks/[id]/collaborators
 * Añade un colaborador a una tarea
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { userId, memberId, role = "VIEWER" } = body;

    if (!userId && !memberId) {
      return NextResponse.json(
        { ok: false, error: "userId or memberId is required" },
        { status: 400 }
      );
    }

    // Verificar que la tarea existe y el usuario es el dueño
    const task = await prisma.rowiTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });
    }

    if (task.userId !== auth.id) {
      return NextResponse.json({ ok: false, error: "Only the task owner can add collaborators" }, { status: 403 });
    }

    // Verificar que el colaborador existe
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
      }
    }

    if (memberId) {
      const member = await prisma.communityMember.findUnique({ where: { id: memberId } });
      if (!member) {
        return NextResponse.json({ ok: false, error: "Member not found" }, { status: 404 });
      }
    }

    // Crear colaborador
    const collaborator = await prisma.taskCollaborator.create({
      data: {
        taskId: id,
        userId: userId || null,
        memberId: memberId || null,
        role,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        member: { select: { id: true, name: true, email: true, brainStyle: true } },
      },
    });

    return NextResponse.json({ ok: true, collaborator });
  } catch (error: any) {
    // Handle unique constraint violation (already a collaborator)
    if (error.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "This person is already a collaborator" },
        { status: 409 }
      );
    }
    console.error("[Task Collaborators POST]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/weekflow/tasks/[id]/collaborators
 * Elimina un colaborador de una tarea
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const collaboratorId = searchParams.get("collaboratorId");

    if (!collaboratorId) {
      return NextResponse.json(
        { ok: false, error: "collaboratorId is required" },
        { status: 400 }
      );
    }

    // Verificar que la tarea existe y el usuario es el dueño
    const task = await prisma.rowiTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });
    }

    if (task.userId !== auth.id) {
      return NextResponse.json({ ok: false, error: "Only the task owner can remove collaborators" }, { status: 403 });
    }

    // Eliminar colaborador
    await prisma.taskCollaborator.delete({
      where: { id: collaboratorId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Task Collaborators DELETE]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
