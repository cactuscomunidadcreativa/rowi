// src/app/api/admin/ai/knowledge/route.ts
// ============================================================
// API de Knowledge Deployments para agentes IA
// GET: Listar deployments de un agente
// POST: Crear nuevo deployment
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

// Helper para verificar si es admin
async function isAdmin(email: string) {
  const permission = await prisma.userPermission.findFirst({
    where: {
      user: { email },
      role: { in: ["SUPERADMIN", "ADMIN", "superadmin", "admin"] },
    },
  });
  return !!permission;
}

// GET: Listar deployments de un agente
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(email))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json({ ok: false, error: "agentId required" }, { status: 400 });
    }

    const deployments = await prisma.agentKnowledgeDeployment.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });

    // Estadísticas
    const stats = {
      total: deployments.length,
      deployed: deployments.filter((d) => d.status === "DEPLOYED").length,
      pending: deployments.filter((d) => d.status === "PENDING").length,
      byType: deployments.reduce((acc, d) => {
        acc[d.contentType] = (acc[d.contentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      ok: true,
      data: {
        deployments,
        stats,
      },
    });
  } catch (e: any) {
    console.error("Error in admin/ai/knowledge GET:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

// POST: Crear nuevo deployment
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(email))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { agentId, source, contentType, contentKey, title, content, summary, tags } = body;

    if (!agentId || !contentType || !contentKey) {
      return NextResponse.json({
        ok: false,
        error: "Required fields: agentId, contentType, contentKey",
      }, { status: 400 });
    }

    // Verificar que el agente existe
    const agent = await prisma.agentConfig.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ ok: false, error: "Agent not found" }, { status: 404 });
    }

    // Crear o actualizar deployment
    const deployment = await prisma.agentKnowledgeDeployment.upsert({
      where: {
        agentId_contentType_contentKey: {
          agentId,
          contentType,
          contentKey,
        },
      },
      update: {
        title,
        content,
        summary,
        tags: tags || [],
        status: "PENDING",
        updatedAt: new Date(),
      },
      create: {
        agentId,
        source: source || "MANUAL",
        contentType,
        contentKey,
        title,
        content,
        summary,
        tags: tags || [],
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, data: deployment });
  } catch (e: any) {
    console.error("Error in admin/ai/knowledge POST:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
