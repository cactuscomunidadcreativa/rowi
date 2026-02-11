import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * Resuelve un hubId que puede ser un Hub ID o un RowiCommunity ID
 * Devuelve el Hub ID real (FK a Hub table).
 */
async function resolveHubId(rawId: string): Promise<string | null> {
  // 1. Intentar como Hub directamente
  const hub = await prisma.hub.findUnique({
    where: { id: rawId },
    select: { id: true },
  });
  if (hub) return hub.id;

  // 2. Intentar como RowiCommunity — usar su hubId real
  const community = await prisma.rowiCommunity.findUnique({
    where: { id: rawId },
    select: { hubId: true, tenantId: true },
  });
  if (community?.hubId) return community.hubId;

  // 3. Buscar hub del tenant de la comunidad
  if (community?.tenantId) {
    const tenantHub = await prisma.hub.findFirst({
      where: { tenantId: community.tenantId },
      select: { id: true },
    });
    if (tenantHub) return tenantHub.id;
  }

  return null;
}

/**
 * GET /api/weekflow/tasks
 * Lista las tareas del usuario
 * Query params:
 *   - status: TODO, IN_PROGRESS, DONE, CANCELLED, POSTPONED, BLOCKED
 *   - hubId: filtrar por hub (puede ser Hub ID o RowiCommunity ID)
 *   - includeCompleted: true/false
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Plan check bypassed — WeekFlow open for all users
    const { searchParams } = new URL(req.url);
    const rawHubId = searchParams.get("hubId");

    const status = searchParams.get("status");
    const includeCompleted = searchParams.get("includeCompleted") === "true";

    const where: Record<string, unknown> = {
      userId: auth.id,
    };

    if (status) {
      where.status = status;
    } else if (!includeCompleted) {
      where.status = { notIn: ["DONE", "CANCELLED"] };
    }

    if (rawHubId) {
      const hubId = await resolveHubId(rawHubId);
      if (hubId) {
        where.hubId = hubId;
      }
    }

    const tasks = await prisma.rowiTask.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        reflections: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        collaborators: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            member: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Identificar tareas que necesitan reflexión (incompletas por mucho tiempo)
    const tasksWithReflectionFlag = tasks.map((task) => {
      const daysSinceCreation = Math.floor(
        (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const needsReflection =
        task.status === "TODO" &&
        daysSinceCreation >= 7 && // Default: 7 días
        !task.reflections.some((r) => r.type === "POSTPONE" || r.type === "BLOCK");

      return {
        ...task,
        needsReflection,
        daysSinceCreation,
      };
    });

    return NextResponse.json({ ok: true, tasks: tasksWithReflectionFlag });
  } catch (error) {
    console.error("[WeekFlow Tasks GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/weekflow/tasks
 * Crea una nueva tarea
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Plan check bypassed — WeekFlow open for all users
    const {
      title,
      description,
      hubId: rawHubId,
      tenantId,
      dueDate,
      priority,
      tags,
      category,
      visibility,
      emotionAtCreation,
      weekFlowSessionId,
      sourceType,
      sourceId,
      assigneeId,
      collaborators, // Array de { userId?, memberId?, role? }
    } = body;

    if (!title) {
      return NextResponse.json({ ok: false, error: "title is required" }, { status: 400 });
    }

    // Validar emoción si se proporciona (acepta Plutchik + Rueda de Sentimientos)
    if (emotionAtCreation && (typeof emotionAtCreation !== "string" || emotionAtCreation.trim().length === 0)) {
      return NextResponse.json({ ok: false, error: "Invalid emotion format" }, { status: 400 });
    }

    // Resolver Hub ID real si se proporciona (puede venir como community ID)
    let resolvedHubId: string | null = null;
    if (rawHubId) {
      resolvedHubId = await resolveHubId(rawHubId);
    }

    const task = await prisma.rowiTask.create({
      data: {
        userId: auth.id,
        tenantId: tenantId || null,
        hubId: resolvedHubId,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        tags: tags || [],
        category: category || null,
        visibility: visibility || "PRIVATE",
        emotionAtCreation: emotionAtCreation || null,
        weekFlowSessionId: weekFlowSessionId || null,
        sourceType: sourceType || "manual",
        sourceId: sourceId || null,
        assigneeId: assigneeId || null,
        // Crear colaboradores si se proporcionan
        collaborators: collaborators?.length > 0 ? {
          create: collaborators.map((c: { userId?: string; memberId?: string; role?: string }) => ({
            userId: c.userId || null,
            memberId: c.memberId || null,
            role: c.role || "VIEWER",
          })),
        } : undefined,
      },
      include: {
        collaborators: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            member: { select: { id: true, name: true, email: true } },
          },
        },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Si se proporcionó emoción, crear reflexión de creación
    if (emotionAtCreation) {
      await prisma.taskReflection.create({
        data: {
          taskId: task.id,
          userId: auth.id,
          type: "CREATION",
          emotion: emotionAtCreation,
        },
      });
    }

    return NextResponse.json({ ok: true, task });
  } catch (error) {
    console.error("[WeekFlow Tasks POST]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * PUT /api/weekflow/tasks
 * Actualiza una tarea
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      title,
      description,
      status,
      dueDate,
      priority,
      tags,
      category,
      visibility,
      emotionAtCompletion,
      incompletionReason,
      incompletionNote,
    } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }

    // Verificar que la tarea pertenece al usuario
    const existing = await prisma.rowiTask.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });
    }

    // Plan check bypassed — WeekFlow open for all users

    if (existing.userId !== auth.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    if (visibility !== undefined) updateData.visibility = visibility;

    // Manejo de cambio de estado
    if (status !== undefined && status !== existing.status) {
      updateData.status = status;

      // Si se completa
      if (status === "DONE") {
        updateData.completedAt = new Date();
        if (emotionAtCompletion) {
          updateData.emotionAtCompletion = emotionAtCompletion;
          // Crear reflexión de completar
          await prisma.taskReflection.create({
            data: {
              taskId: id,
              userId: auth.id,
              type: "COMPLETION",
              emotion: emotionAtCompletion,
            },
          });
        }
      }

      // Si se pospone o bloquea
      if (status === "POSTPONED" || status === "BLOCKED") {
        if (incompletionReason) {
          updateData.incompletionReason = incompletionReason;
        }
        if (incompletionNote) {
          updateData.incompletionNote = incompletionNote;
        }

        // Crear reflexión
        await prisma.taskReflection.create({
          data: {
            taskId: id,
            userId: auth.id,
            type: status === "POSTPONED" ? "POSTPONE" : "BLOCK",
            emotion: emotionAtCompletion || null,
            note: incompletionNote || null,
            blockerType:
              incompletionReason &&
              ["OVERWHELMED", "ANXIOUS", "UNMOTIVATED", "PERFECTIONISM", "FEAR_OF_FAILURE"].includes(
                incompletionReason
              )
                ? "emotional"
                : incompletionReason &&
                  ["TIME_CONSTRAINT", "DEPENDENCY_BLOCKED", "PRIORITY_SHIFT"].includes(incompletionReason)
                ? "external"
                : "unclear",
          },
        });
      }
    }

    const task = await prisma.rowiTask.update({
      where: { id },
      data: updateData,
      include: {
        reflections: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json({ ok: true, task });
  } catch (error) {
    console.error("[WeekFlow Tasks PUT]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/weekflow/tasks
 * Elimina una tarea
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }

    // Verificar que la tarea pertenece al usuario
    const existing = await prisma.rowiTask.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });
    }

    if (existing.userId !== auth.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Plan check bypassed — WeekFlow open for all users

    // Soft delete (cambiar status a CANCELLED)
    await prisma.rowiTask.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[WeekFlow Tasks DELETE]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
