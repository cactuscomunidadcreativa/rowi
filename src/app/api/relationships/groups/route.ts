/**
 * /api/relationships/groups
 *
 * GET  → lista los RelationshipGroup del usuario (con sus miembros y la brecha
 *        agregada cacheada).
 * POST → crea un grupo con { name?, memberIds[], context? } y computa/cachea la
 *        brecha por centroide. Anti-IDOR: solo memberIds de comunidades del usuario.
 *
 * El grupo es el paralelo de la díada 1:1 para escribir ECO a 3+ personas.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { refreshGroupGap } from "@/domains/eco/lib/ecoGroupBridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function currentUserId(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email?.toLowerCase();
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

/** memberIds permitidos: los que comparten comunidad con el usuario (o es él). */
async function authorizedMemberIds(userId: string, memberIds: string[]): Promise<string[]> {
  if (!memberIds.length) return [];
  const myMemberships = await prisma.communityMember.findMany({
    where: { userId, communityId: { not: null } },
    select: { communityId: true },
  });
  const myCommunityIds = new Set(myMemberships.map((m) => m.communityId).filter((c): c is string => !!c));
  const requested = await prisma.communityMember.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, communityId: true, userId: true },
  });
  return requested
    .filter((m) => m.userId === userId || (m.communityId != null && myCommunityIds.has(m.communityId)))
    .map((m) => m.id);
}

export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const groups = await prisma.relationshipGroup.findMany({
    where: { ownerUserId: userId },
    orderBy: { updatedAt: "desc" },
    include: { members: { select: { memberId: true, displayName: true } } },
  });
  return NextResponse.json({
    ok: true,
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      context: g.context,
      memberIds: g.members.map((m) => m.memberId),
      members: g.members,
      lastGapSummary: g.lastGapSummary,
      updatedAt: g.updatedAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    memberIds?: string[];
    context?: string;
  };
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds : [];
  // Solo se validan los memberIds de comunidad; "user_<id>" se aceptan tal cual
  // (son usuarios Rowi, no community members). Mantener orden y deduplicar.
  const communityIds = memberIds.filter((id) => !id.startsWith("user_"));
  const userScoped = memberIds.filter((id) => id.startsWith("user_"));
  const allowedCommunity = await authorizedMemberIds(userId, communityIds);
  const finalMembers = Array.from(new Set([...allowedCommunity, ...userScoped]));

  if (finalMembers.length < 2) {
    return NextResponse.json({ ok: false, error: "need_2_members" }, { status: 400 });
  }

  const group = await prisma.relationshipGroup.create({
    data: {
      ownerUserId: userId,
      name: body.name?.slice(0, 80) || null,
      context: ["relationship", "leadership", "execution", "innovation", "decision", "conversation"].includes(body.context || "")
        ? body.context!
        : "relationship",
      members: { create: finalMembers.map((memberId) => ({ memberId })) },
    },
  });

  // Computa y cachea la brecha por centroide (no crítico si falta perfil).
  try { await refreshGroupGap(group.id, userId); } catch (e) { console.warn("refreshGroupGap:", e); }

  return NextResponse.json({ ok: true, groupId: group.id });
}
