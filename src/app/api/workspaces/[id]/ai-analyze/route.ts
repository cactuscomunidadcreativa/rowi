// src/app/api/workspaces/[id]/ai-analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canAccessWorkspace } from "@/lib/workspace/permissions";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/workspaces/[id]/ai-analyze
 * Analisis AI con contexto del workspace.
 * Body: { question: string, context?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { allowed, role } = await canAccessWorkspace(token.sub, id);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { question, context = "" } = body || {};
    if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });

    // Cargar contexto del workspace
    const workspace = await prisma.rowiCommunity.findUnique({
      where: { id },
      include: {
        clientOrg: { select: { name: true } },
        _count: { select: { communityMembers: true } },
      },
    });
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Cargar stats agregados
    const members = await prisma.communityMember.findMany({
      where: { communityId: id },
      select: {
        name: true,
        brainStyle: true,
        country: true,
        role: true,
        snapshots: {
          orderBy: { at: "desc" },
          take: 1,
          select: {
            overall4: true,
            K: true, C: true, G: true,
            EL: true, RP: true, ACT: true, NE: true,
            IM: true, OP: true, EMP: true, NG: true,
            brainStyle: true,
          },
        },
      },
      take: 100,
    });

    const withSei = members.filter((m) => m.snapshots[0]);
    const avgEQ = withSei.length > 0
      ? withSei.reduce((a, m) => a + (m.snapshots[0].overall4 || 0), 0) / withSei.length
      : 0;

    // Build system prompt con contexto
    const systemPrompt = `Eres un coach experto en inteligencia emocional usando el modelo Six Seconds (SEI).
Estas analizando un workspace llamado "${workspace.name}".
Tipo: ${workspace.workspaceType}
${workspace.targetRole ? `Rol objetivo: ${workspace.targetRole}` : ""}
${workspace.clientOrg ? `Cliente: ${workspace.clientOrg.name}` : ""}
Total miembros: ${workspace._count.communityMembers}
Miembros con SEI: ${withSei.length}
EQ promedio: ${Math.round(avgEQ)}

Contexto adicional: ${context}

Responde con insights accionables basados en los datos reales. Usa el modelo Six Seconds (3 Pursuits: Know/Choose/Give Yourself, 8 Competencias: EL, RP, ACT, NE, IM, OP, EMP, NG).
Rol del usuario que pregunta: ${role}.

Pregunta:`;

    // Llama a OpenAI via el endpoint existente /api/rowi si esta configurado
    // Si no, genera respuesta basada en heuristica simple
    const openAiKey = process.env.OPENAI_API_KEY;

    if (openAiKey) {
      try {
        const completion = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: question },
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        });
        const data = await completion.json();
        const answer = data?.choices?.[0]?.message?.content || "No response from AI.";
        return NextResponse.json({ answer, usage: data?.usage });
      } catch (aiErr: any) {
        console.error("AI error:", aiErr);
      }
    }

    // Fallback sin OpenAI - respuesta heuristica
    const answer = `Basado en los datos del workspace "${workspace.name}":
- ${withSei.length} miembros con SEI de un total de ${workspace._count.communityMembers}
- EQ promedio: ${Math.round(avgEQ)}
- Tipo de workspace: ${workspace.workspaceType}

Para tu pregunta "${question}", te recomiendo:
1. Revisar el modulo Selection si buscas ranking de personas
2. Revisar el modulo Evolution para tracking longitudinal
3. Crear un Development Plan para miembros especificos desde la pestana Plans

(Configura OPENAI_API_KEY en .env para respuestas AI completas)`;

    return NextResponse.json({ answer, fallback: true });
  } catch (err: any) {
    console.error("POST /api/workspaces/[id]/ai-analyze error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
