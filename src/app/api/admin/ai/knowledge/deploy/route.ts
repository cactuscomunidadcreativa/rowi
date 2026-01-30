// src/app/api/admin/ai/knowledge/deploy/route.ts
// ============================================================
// API para desplegar conocimiento Six Seconds a agentes IA
// POST: Desplegar contenido de Six Seconds al agente
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

// Contenido Six Seconds predefinido
const sixSecondsContent: Record<string, any[]> = {
  COMPETENCY: [
    { key: "EEL", name: "Emotional Literacy", name_es: "Alfabetización Emocional" },
    { key: "RP", name: "Recognize Patterns", name_es: "Reconocer Patrones" },
    { key: "ACT", name: "Apply Consequential Thinking", name_es: "Pensamiento Consecuente" },
    { key: "NE", name: "Navigate Emotions", name_es: "Navegar Emociones" },
    { key: "EIM", name: "Engage Intrinsic Motivation", name_es: "Motivación Intrínseca" },
    { key: "EO", name: "Exercise Optimism", name_es: "Ejercitar Optimismo" },
    { key: "IE", name: "Increase Empathy", name_es: "Incrementar Empatía" },
    { key: "PNG", name: "Pursue Noble Goals", name_es: "Perseguir Nobles Metas" },
  ],
  OUTCOME: [
    { key: "INFLUENCE", name: "Influence", name_es: "Influencia" },
    { key: "DECISION_MAKING", name: "Decision Making", name_es: "Toma de Decisiones" },
    { key: "COMMUNITY", name: "Community", name_es: "Comunidad" },
    { key: "NETWORK", name: "Network", name_es: "Red de Contactos" },
    { key: "ACHIEVEMENT", name: "Achievement", name_es: "Logro" },
    { key: "SATISFACTION", name: "Satisfaction", name_es: "Satisfacción" },
    { key: "BALANCE", name: "Balance", name_es: "Equilibrio" },
    { key: "HEALTH", name: "Health", name_es: "Salud" },
  ],
  BRAIN_TALENT: [
    { key: "BBE", name: "Balanced Brain Evaluator", name_es: "Evaluador Equilibrado" },
    { key: "BBI", name: "Balanced Brain Innovator", name_es: "Innovador Equilibrado" },
    { key: "BBD", name: "Balanced Brain Driver", name_es: "Conductor Equilibrado" },
    { key: "BBF", name: "Balanced Brain Facilitator", name_es: "Facilitador Equilibrado" },
    { key: "IDE", name: "Idealist Evaluator", name_es: "Evaluador Idealista" },
    { key: "IDI", name: "Idealist Innovator", name_es: "Innovador Idealista" },
    { key: "IDD", name: "Idealist Driver", name_es: "Conductor Idealista" },
    { key: "IDF", name: "Idealist Facilitator", name_es: "Facilitador Idealista" },
    { key: "PRE", name: "Practical Evaluator", name_es: "Evaluador Práctico" },
    { key: "PRI", name: "Practical Innovator", name_es: "Innovador Práctico" },
    { key: "PRD", name: "Practical Driver", name_es: "Conductor Práctico" },
    { key: "PRF", name: "Practical Facilitator", name_es: "Facilitador Práctico" },
    { key: "EME", name: "Empathic Evaluator", name_es: "Evaluador Empático" },
    { key: "EMI", name: "Empathic Innovator", name_es: "Innovador Empático" },
    { key: "EMD", name: "Empathic Driver", name_es: "Conductor Empático" },
    { key: "EMF", name: "Empathic Facilitator", name_es: "Facilitador Empático" },
    { key: "RTE", name: "Rational Evaluator", name_es: "Evaluador Racional" },
    { key: "RTI", name: "Rational Innovator", name_es: "Innovador Racional" },
  ],
  CORE_OUTCOME: [
    { key: "EFFECTIVENESS", name: "Effectiveness", name_es: "Efectividad" },
    { key: "RELATIONSHIPS", name: "Relationships", name_es: "Relaciones" },
    { key: "QUALITY_OF_LIFE", name: "Quality of Life", name_es: "Calidad de Vida" },
    { key: "WELLBEING", name: "Wellbeing", name_es: "Bienestar" },
  ],
};

// POST: Desplegar contenido Six Seconds
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
    const { agentId, contentType, source = "SIX_SECONDS" } = body;

    if (!agentId || !contentType) {
      return NextResponse.json({
        ok: false,
        error: "Required fields: agentId, contentType",
      }, { status: 400 });
    }

    // Verificar que el agente existe
    const agent = await prisma.agentConfig.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ ok: false, error: "Agent not found" }, { status: 404 });
    }

    // Obtener contenido a desplegar
    const contentItems = sixSecondsContent[contentType];
    if (!contentItems) {
      return NextResponse.json({
        ok: false,
        error: `Invalid contentType. Valid types: ${Object.keys(sixSecondsContent).join(", ")}`,
      }, { status: 400 });
    }

    // Obtener usuario para deployedBy
    const user = await prisma.user.findUnique({ where: { email } });

    // Crear deployments
    const deployments = [];
    for (const item of contentItems) {
      try {
        const deployment = await prisma.agentKnowledgeDeployment.upsert({
          where: {
            agentId_contentType_contentKey: {
              agentId,
              contentType,
              contentKey: item.key,
            },
          },
          update: {
            title: item.name_es || item.name,
            content: item,
            status: "DEPLOYED",
            deployedAt: new Date(),
            deployedBy: user?.id,
            updatedAt: new Date(),
          },
          create: {
            agentId,
            source: source as any,
            contentType: contentType as any,
            contentKey: item.key,
            title: item.name_es || item.name,
            content: item,
            status: "DEPLOYED",
            deployedAt: new Date(),
            deployedBy: user?.id,
            tags: ["six-seconds", contentType.toLowerCase()],
          },
        });
        deployments.push(deployment);
      } catch (e) {
        console.error(`Error deploying ${item.key}:`, e);
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        deployed: deployments.length,
        contentType,
        agentId,
        deployments: deployments.map((d) => ({
          id: d.id,
          key: d.contentKey,
          title: d.title,
          status: d.status,
        })),
      },
    });
  } catch (e: any) {
    console.error("Error in admin/ai/knowledge/deploy POST:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
