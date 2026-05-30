// apps/rowi/src/app/api/ai/engine/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma"; // ✅ corregido
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

export async function POST(req: Request) {
  // 🔐 Configura el motor de IA de un tenant/hub: solo admins en su scope.
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();

    const allowedTenantIds = await tenantIdsForScope(auth.scope);
    if (allowedTenantIds !== null && body.tenantId && !allowedTenantIds.includes(body.tenantId)) {
      return NextResponse.json({ ok: false, error: "No autorizado para este tenant" }, { status: 403 });
    }

    // Buscar motor existente por tenant o hub
    const existing = await prisma.emotionalAIEngine.findFirst({
      where: {
        tenantId: body.tenantId ?? undefined,
        hubId: body.hubId ?? undefined,
      },
    });

    // Crear o actualizar motor emocional
    const engine = existing
      ? await prisma.emotionalAIEngine.update({
          where: { id: existing.id },
          data: {
            state: body.state ?? existing.state,
            mode: body.mode ?? existing.mode,
            description: body.description ?? existing.description,
            temperature: body.temperature ?? existing.temperature,
            contextSize: body.contextSize ?? existing.contextSize,
            memorySpan: body.memorySpan ?? existing.memorySpan,
          },
        })
      : await prisma.emotionalAIEngine.create({
          data: {
            tenantId: body.tenantId ?? null,
            hubId: body.hubId ?? null,
            state: "idle",
            mode: body.mode ?? "coach",
            description: body.description ?? "Motor emocional activo",
            temperature: body.temperature ?? 0.7,
            contextSize: body.contextSize ?? 8192,
            memorySpan: body.memorySpan ?? 30,
          },
        });

    return NextResponse.json({ ok: true, engine });
  } catch (err: any) {
    console.error("❌ Error en EmotionalAIEngine:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}