import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * POST /api/weekflow/tasks/[id]/reflect
 * Agrega una reflexión a una tarea
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Plan check bypassed — WeekFlow open for all users

    const { id: taskId } = await params;
    const body = await req.json();
    const { type, emotion, intensity, note, blockerType, suggestedAction } = body;

    if (!taskId || !type) {
      return NextResponse.json(
        { ok: false, error: "taskId and type are required" },
        { status: 400 }
      );
    }

    // Validar tipo
    const validTypes = ["CREATION", "POSTPONE", "BLOCK", "COMPLETION", "WEEKLY_REVIEW"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ ok: false, error: "Invalid reflection type" }, { status: 400 });
    }

    // Verificar que la tarea existe y pertenece al usuario
    const task = await prisma.rowiTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });
    }

    if (task.userId !== auth.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Validar emoción si se proporciona (acepta todas las emociones del sistema Plutchik expandido)
    if (emotion && typeof emotion !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid emotion format" }, { status: 400 });
    }

    const reflection = await prisma.taskReflection.create({
      data: {
        taskId,
        userId: auth.id,
        type,
        emotion: emotion || null,
        intensity: intensity || 2,
        note: note || null,
        blockerType: blockerType || null,
        suggestedAction: suggestedAction || null,
      },
    });

    return NextResponse.json({ ok: true, reflection });
  } catch (error) {
    console.error("[WeekFlow Task Reflect POST]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * GET /api/weekflow/tasks/[id]/reflect
 * Obtiene las reflexiones de una tarea
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Plan check bypassed — WeekFlow open for all users

    const { id: taskId } = await params;

    // Verificar que la tarea existe y pertenece al usuario
    const task = await prisma.rowiTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });
    }

    if (task.userId !== auth.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const reflections = await prisma.taskReflection.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, reflections });
  } catch (error) {
    console.error("[WeekFlow Task Reflect GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
