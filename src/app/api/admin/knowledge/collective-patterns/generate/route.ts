/**
 * 🔍 API: Detectar patrones colectivos de un tenant (Fase 3 del knowledge layer)
 * POST /api/admin/knowledge/collective-patterns/generate  { tenantId }
 *
 * Agrega las competencias SEI de los miembros de un tenant (N≥5 por privacidad),
 * detecta la competencia colectiva más débil (oportunidad de mejora) y crea un
 * CollectivePattern con una recomendación accionable: la intervención del
 * catálogo que mueve esa competencia. Conecta detección → playbook.
 *
 * Plataforma-level → SuperAdmin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";

const COMPETENCIES = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;
const MIN_N = 5; // floor de privacidad (N≥5 para agregados)

const COMP_NAME: Record<string, string> = {
  EL: "Consciencia emocional", RP: "Lectura de patrones", ACT: "Pensamiento consecuente",
  NE: "Navegación emocional", IM: "Motivación intrínseca", OP: "Optimismo",
  EMP: "Empatía", NG: "Propósito noble",
};

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const tenantId = body?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId requerido" }, { status: 400 });
  }

  // Usuarios del tenant.
  const users = await prisma.user.findMany({
    where: { primaryTenantId: tenantId },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  if (userIds.length < MIN_N) {
    return NextResponse.json({
      ok: false,
      error: `Muestra insuficiente (${userIds.length} < ${MIN_N}). Floor de privacidad.`,
    }, { status: 400 });
  }

  // Snapshot EQ más reciente de cada usuario.
  const snaps = await prisma.eqSnapshot.findMany({
    where: { userId: { in: userIds }, dataset: "actual" },
    orderBy: { at: "desc" },
    select: {
      userId: true, EL: true, RP: true, ACT: true,
      NE: true, IM: true, OP: true, EMP: true, NG: true,
    },
  });
  const latestByUser = new Map<string, (typeof snaps)[number]>();
  for (const s of snaps) {
    if (s.userId && !latestByUser.has(s.userId)) latestByUser.set(s.userId, s);
  }
  const rows = Array.from(latestByUser.values());

  if (rows.length < MIN_N) {
    return NextResponse.json({
      ok: false,
      error: `Snapshots insuficientes (${rows.length} < ${MIN_N}).`,
    }, { status: 400 });
  }

  // Promedio por competencia.
  const means: Record<string, number> = {};
  for (const c of COMPETENCIES) {
    const vals = rows.map((r) => (r as any)[c]).filter((v): v is number => typeof v === "number");
    means[c] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  // Competencia colectiva más débil.
  const weakest = COMPETENCIES.reduce((min, c) => (means[c] < means[min] ? c : min), COMPETENCIES[0]);

  // Intervención del catálogo que entrena esa competencia (la recomendación).
  let recommendedIntervention: { key: string; title: string } | null = null;
  try {
    const iv = await prisma.intervention.findFirst({
      where: { targetComp: weakest, active: true },
      select: { key: true, title: true },
    });
    recommendedIntervention = iv;
  } catch {
    recommendedIntervention = null;
  }

  // Persistir el patrón colectivo.
  const pattern = await prisma.collectivePattern.create({
    data: {
      tenantId,
      patternType: "weakest_competency",
      title: `Oportunidad colectiva: ${COMP_NAME[weakest] ?? weakest}`,
      description:
        `Entre ${rows.length} miembros, la competencia colectiva más baja es ` +
        `${COMP_NAME[weakest] ?? weakest} (promedio ${means[weakest].toFixed(0)}/135).`,
      severity: means[weakest] < 90 ? "warning" : "info",
      confidence: Math.min(1, rows.length / 30),
      affectedUsers: rows.length,
      data: { means, weakest },
      recommendations: recommendedIntervention
        ? [{ interventionKey: recommendedIntervention.key, title: recommendedIntervention.title }]
        : [],
      status: "active",
    },
  });

  return NextResponse.json({
    ok: true,
    pattern: { id: pattern.id, weakest, mean: means[weakest], affectedUsers: rows.length },
    recommendation: recommendedIntervention,
  });
}
