/**
 * GET /api/admin/conversations
 *
 * Panel de revisión de conversaciones para investigación. Lee lo que Rowi YA
 * persiste (ECO, notas de coaching, respuestas IA, debrief) para que el dueño
 * pueda revisarlas y aprender. Read-only.
 *
 * Acceso: requireResearchUser + canSeePII (solo founder/scientific_lead — los
 * únicos que ven texto sensible). Cada acceso queda en ResearchAccessAudit.
 *
 * PRIVACIDAD: el texto ECO es privado duro y NUNCA va al dataset anónimo. Este
 * panel solo lo muestra a research-access con PII, con auditoría; no lo exporta.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireResearchUser, canSeePII, logResearchAccess } from "@/lib/research/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConvType = "eco" | "coach" | "ai" | "debrief";
const TYPES = new Set<ConvType>(["eco", "coach", "ai", "debrief"]);

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const auth = await requireResearchUser(req);
  if ("error" in auth) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  // Texto sensible: solo founder/scientific_lead.
  if (!canSeePII(auth.user.researchAccessLevel)) {
    return NextResponse.json({ ok: false, error: "pii_not_allowed" }, { status: 403 });
  }

  const { type: typeRaw } = await params;
  const type = typeRaw as ConvType;
  if (!TYPES.has(type)) {
    return NextResponse.json({ ok: false, error: "unknown_type" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 25));
  const q = (searchParams.get("q") || "").trim();
  const skip = (page - 1) * pageSize;

  await logResearchAccess({
    viewerUserId: auth.user.id,
    action: "view_conversations",
    contextPath: "/hub/admin/conversations",
    metadata: { type, page, q: q || undefined },
  });

  try {
    if (type === "eco") return await listEco(q, skip, pageSize);
    if (type === "coach") return await listCoach(q, skip, pageSize);
    if (type === "ai") return await listAi(q, skip, pageSize);
    return await listDebrief(q, skip, pageSize);
  } catch (e) {
    console.error("/api/admin/conversations error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

async function listEco(q: string, skip: number, take: number) {
  const where = q
    ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { lastGoal: { contains: q, mode: "insensitive" as const } }] }
    : {};
  const [total, threads] = await Promise.all([
    prisma.ecoThread.count({ where }),
    prisma.ecoThread.findMany({
      where, orderBy: { updatedAt: "desc" }, skip, take,
      include: {
        dyad: { select: { otherName: true, relationType: true, owner: { select: { name: true, email: true } }, other: { select: { name: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { goal: true, ecoLevel: true, createdAt: true } },
      },
    }),
  ]);
  const rows = threads.map((t) => ({
    id: t.id,
    owner: t.dyad?.owner?.name || t.dyad?.owner?.email || "—",
    other: t.dyad?.other?.name || t.dyad?.otherName || "—",
    relationType: t.dyad?.relationType || "—",
    messageCount: t.messageCount,
    lastGoal: t.messages[0]?.goal || t.lastGoal || "—",
    ecoLevel: t.messages[0]?.ecoLevel || "—",
    updatedAt: t.updatedAt.toISOString().slice(0, 16).replace("T", " "),
  }));
  return NextResponse.json({ ok: true, rows, total, page: skip / take + 1, pageSize: take });
}

async function listCoach(q: string, skip: number, take: number) {
  const where = q
    ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { content: { contains: q, mode: "insensitive" as const } }] }
    : {};
  const [total, notes] = await Promise.all([
    prisma.coachNote.count({ where }),
    prisma.coachNote.findMany({
      where, orderBy: { updatedAt: "desc" }, skip, take,
      include: { author: { select: { name: true, email: true } } },
    }),
  ]);
  const rows = notes.map((n) => ({
    id: n.id,
    author: n.author?.name || n.author?.email || "—",
    category: n.category || "—",
    title: n.title || "—",
    content: n.content.length > 160 ? n.content.slice(0, 160) + "…" : n.content,
    tags: (n.tags || []).join(", ") || "—",
    createdAt: n.createdAt.toISOString().slice(0, 16).replace("T", " "),
  }));
  return NextResponse.json({ ok: true, rows, total, page: skip / take + 1, pageSize: take });
}

async function listAi(q: string, skip: number, take: number) {
  const where = q
    ? { OR: [{ kind: { contains: q, mode: "insensitive" as const } }, { response: { contains: q, mode: "insensitive" as const } }] }
    : {};
  const [total, cached] = await Promise.all([
    prisma.aIResponseCache.count({ where }),
    prisma.aIResponseCache.findMany({ where, orderBy: { lastHitAt: "desc" }, skip, take }),
  ]);
  const rows = cached.map((c) => ({
    id: c.id,
    kind: c.kind,
    model: c.model,
    scope: c.scope,
    response: c.response.length > 200 ? c.response.slice(0, 200) + "…" : c.response,
    hits: c.hits,
    createdAt: c.createdAt.toISOString().slice(0, 16).replace("T", " "),
  }));
  return NextResponse.json({ ok: true, rows, total, page: skip / take + 1, pageSize: take });
}

async function listDebrief(q: string, skip: number, take: number) {
  const where = q ? { notes: { contains: q, mode: "insensitive" as const } } : {};
  const [total, sessions] = await Promise.all([
    prisma.debriefSession.count({ where }),
    prisma.debriefSession.findMany({
      where, orderBy: { updatedAt: "desc" }, skip, take,
      include: { subject: { select: { name: true } }, facilitator: { select: { name: true } } },
    }),
  ]);
  const rows = sessions.map((s) => ({
    id: s.id,
    scope: s.scope,
    status: s.status,
    step: s.step,
    facilitator: s.facilitator?.name || "—",
    subject: s.subject?.name || "—",
    notes: s.notes ? (s.notes.length > 160 ? s.notes.slice(0, 160) + "…" : s.notes) : "—",
    scheduledAt: s.scheduledAt.toISOString().slice(0, 16).replace("T", " "),
  }));
  return NextResponse.json({ ok: true, rows, total, page: skip / take + 1, pageSize: take });
}
